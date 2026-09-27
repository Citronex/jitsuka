import { expect, test } from "@playwright/test";
import { halfGuardFixture } from "../src/domain/fixture";

test("Clear roll confirms, clears only the canvas, and preserves the saved roll", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByText("My map", { exact: true }).click();
  await page.getByLabel("Jitsuka JSON").fill(JSON.stringify(halfGuardFixture));
  await page.getByRole("button", { name: "Roll", exact: true }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  const saved = await page.evaluate(() =>
    localStorage.getItem("jitsuka:document:v1"),
  );
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toBe(
      "are you sure? these will delete your roll data from the map (not your device)",
    );
    await dialog.dismiss();
  });
  await page.getByRole("button", { name: "Clear roll" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Clear roll" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(0);
  await expect(page.locator(".react-flow__edge")).toHaveCount(0);
  await expect(page.getByLabel("Jitsuka JSON")).toHaveValue("");
  await page.getByRole("button", { name: "Close My map" }).click();
  await page.getByRole("button", { name: "Zoom In", exact: true }).click();
  // Let the normal debounce elapse: clearing and moving the viewport must not save the blank canvas.
  await page.waitForTimeout(500);
  expect(
    await page.evaluate(() => localStorage.getItem("jitsuka:document:v1")),
  ).toBe(saved);
  await page.reload();
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
});

test("Roll restores a blank device; edits persist and Copy JSON copies the canonical document", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as unknown as { copied: string }).copied = text;
        },
      },
    }),
  );
  await page.goto("/");
  await expect(page.locator(".react-flow__node")).toHaveCount(0);
  await page.getByText("My map", { exact: true }).click();
  const json = page.getByLabel("Jitsuka JSON");
  await json.focus();
  await expect(json).toHaveValue("");
  expect(
    await json.evaluate(
      (element) => getComputedStyle(element, "::placeholder").color,
    ),
  ).toBe("rgba(0, 0, 0, 0)");
  await json.fill(JSON.stringify(halfGuardFixture));
  await page.getByRole("button", { name: "Roll", exact: true }).click();
  await expect(page.getByText("Map rolled.", { exact: true })).toBeVisible();
  expect(JSON.parse(await json.inputValue())).toEqual(halfGuardFixture);
  await json.click();
  expect(JSON.parse(await json.inputValue())).toEqual(halfGuardFixture);
  await json.fill("unfinished draft");
  await page.getByRole("button", { name: "Close My map" }).click();
  await expect(json).not.toBeVisible();
  await page.getByText("My map", { exact: true }).click();
  expect(JSON.parse(await json.inputValue())).toEqual(halfGuardFixture);
  await page.getByRole("button", { name: "Close My map" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  await page.getByRole("button", { name: "Edit map" }).click();
  await page.locator('.react-flow__node[data-id="sweep"]').click();
  await page.getByLabel("Technique / position").fill("My John Wayne Sweep");
  await page.getByLabel("Node type", { exact: true }).selectOption("goal");
  await page
    .getByRole("button", { name: "Update technique", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByText("My John Wayne Sweep", { exact: true }),
  ).toBeVisible();
  await page.getByText("My map", { exact: true }).click();
  expect(JSON.parse(await json.inputValue()).nodes[1].label).toBe(
    "My John Wayne Sweep",
  );
  await page.getByRole("button", { name: "Copy JSON", exact: true }).click();
  await expect(
    page.getByText("roll copied, oss 🤙🏽", { exact: true }),
  ).toBeVisible();
  const saved = JSON.parse(await json.inputValue());
  expect(saved.format).toBe("jitsuka");
  expect(saved.nodes[1]).toEqual({
    ...halfGuardFixture.nodes[1],
    type: "goal",
    label: "My John Wayne Sweep",
  });
  expect(saved.edges).toEqual(halfGuardFixture.edges);
  expect(
    await page.evaluate(() => (window as unknown as { copied: string }).copied),
  ).toBe(await json.inputValue());
  const before = await page.evaluate(() =>
    localStorage.getItem("jitsuka:document:v1"),
  );
  await json.fill('{"format":"bad"}');
  await page.getByRole("button", { name: "Roll", exact: true }).click();
  await expect(page.getByText(/Couldn't roll this map/)).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("jitsuka:document:v1")),
  ).toBe(before);
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
});

test("corrupt saved data stays untouched and clipboard failure allows manual copying", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("jitsuka:document:v1", "broken");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("denied");
        },
      },
    });
  });
  await page.goto("/");
  await expect(
    page.getByText(/stored copy has not been overwritten/),
  ).toBeVisible();
  await expect(page.locator(".react-flow__node")).toHaveCount(0);
  await page.getByText("My map", { exact: true }).click();
  await page.getByRole("button", { name: "Copy JSON", exact: true }).click();
  await expect(page.getByText(/Clipboard unavailable/)).toBeVisible();
  const json = page.getByLabel("Jitsuka JSON");
  await expect(json).toBeFocused();
  expect(JSON.parse(await json.inputValue()).format).toBe("jitsuka");
  expect(
    await json.evaluate(
      (element: HTMLTextAreaElement) =>
        element.selectionEnd - element.selectionStart,
    ),
  ).toBe((await json.inputValue()).length);
  expect(
    await page.evaluate(() => localStorage.getItem("jitsuka:document:v1")),
  ).toBe("broken");
});

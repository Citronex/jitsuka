import { expect, test } from "@playwright/test";
test("create, label, persist and delete a connected technique", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Edit map" }).click();
  await expect(
    page.getByText("Same-side arm connection", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "rounded shape", exact: true })
    .click();
  await page.getByLabel("Technique / position").fill("Knee Cut");
  await page
    .getByLabel("Video or reference link")
    .fill("https://www.youtube.com/watch?v=example");
  await page.getByRole("button", { name: "Close editor" }).click();
  await page.getByRole("button", { name: "→ Arrow", exact: true }).click();
  await page
    .locator(".react-flow__node")
    .filter({ hasText: "Half Guard" })
    .first()
    .click();
  await page
    .locator(".react-flow__node")
    .filter({ hasText: "Knee Cut" })
    .click();
  await expect(page.getByLabel("Action / condition")).toBeFocused();
  await page.getByLabel("Action / condition").fill("Win the underhook");
  await page.reload();
  await expect(
    page.getByText("Win the underhook", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Add a technique" }),
  ).toHaveCount(0);
  const popupPromise = page.waitForEvent("popup");
  await page
    .locator(".react-flow__node")
    .filter({ hasText: "Knee Cut" })
    .click();
  const popup = await popupPromise;
  expect(popup.url()).toContain("youtube.com");
  await popup.close();
  await page.getByRole("button", { name: "Edit map" }).click();
  await page.evaluate(() => {
    window.open = () => { throw new Error("Edit mode must not open links"); };
  });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page
    .locator(".react-flow__node")
    .filter({ hasText: "Knee Cut" })
    .click();
  await expect(page.getByLabel("Technique / position")).toHaveValue("Knee Cut");
  expect(errors).toEqual([]);
  await page.getByRole("button", { name: "Delete technique" }).click();
  await expect(
    page.getByText("Win the underhook", { exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("Knee Cut", { exact: true })).toHaveCount(0);
});
test("phone layout supports adding and editing", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Edit map" }).click();
  await page.getByRole("button", { name: "circle shape" }).click();
  await page.getByLabel("Technique / position").fill("Side Control");
  await expect(
    page.getByRole("button", { name: "Delete technique" }),
  ).toBeInViewport();
  await page.screenshot({ path: "test-results/mobile.png" });
});

test("view mode launcher drags without editing and opens editor on click", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Add a technique" }),
  ).toHaveCount(0);
  const launcher = page.getByRole("button", { name: "Edit map" });
  const before = (await launcher.boundingBox())!;
  await page.mouse.move(before.x + 29, before.y + 29);
  await page.mouse.down();
  await page.mouse.move(before.x + 209, before.y + 169, { steps: 10 });
  await page.mouse.up();
  await expect(
    page.getByRole("heading", { name: "Add a technique" }),
  ).toHaveCount(0);
  const after = (await launcher.boundingBox())!;
  expect(after.x).toBeGreaterThan(before.x + 150);
  await launcher.click();
  await expect(
    page.getByRole("heading", { name: "Add a technique" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Done editing" }).click();
  await expect(launcher).toBeVisible();
  expect((await launcher.boundingBox())!.x).toBe(after.x);
  await launcher.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Add a technique" }),
  ).toBeVisible();
});

test("connection labels preserve Enter line breaks on the map and after reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Edit map" }).click();
  await page.locator('.react-flow__edge[data-id="e1"] .react-flow__edge-textbg').click();
  const field = page.getByLabel("Action / condition");
  await field.fill("Opponent posts");
  await field.press("Enter");
  await field.pressSequentially("same-side hand!");
  await field.press("Backspace");
  await expect(field).toHaveValue("Opponent posts\nsame-side hand");
  const lines = page.locator('.react-flow__edge[data-id="e1"] tspan');
  await expect(lines).toHaveText(["Opponent posts", "same-side hand"]);
  const first = (await lines.nth(0).boundingBox())!;
  const second = (await lines.nth(1).boundingBox())!;
  expect(second.y).toBeGreaterThan(first.y);
  await page.reload();
  await expect(lines).toHaveText(["Opponent posts", "same-side hand"]);
});

test('unlinked nodes are silent and editing panels stack with one color picker', async ({ page }) => {
  await page.goto('/');
  const halfGuard = page.locator('.react-flow__node[data-id="half"]');
  await halfGuard.click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit map' }).click();
  await halfGuard.click();
  const toolbar = page.locator('.toolbar');
  const inspector = page.getByRole('complementary', { name: 'Edit technique', exact: true });
  await expect(toolbar.getByRole('button', { name: 'blue color' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'blue color' })).toHaveCount(1);
  const top = (await toolbar.boundingBox())!;
  const bottom = (await inspector.boundingBox())!;
  expect(bottom.x).toBe(top.x);
  expect(bottom.y).toBeGreaterThan(top.y + top.height);
  await page.getByRole('button', { name: 'Close editor' }).click();
  await expect(toolbar.getByRole('button', { name: 'blue color' })).toBeVisible();
});

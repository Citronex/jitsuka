import { expect, test } from "@playwright/test";
import { seedMap } from "./seed";
import { halfGuardFixture } from "../src/domain/fixture";
test.beforeEach(async ({ page }) => seedMap(page));
test("an upward connection leaves the source top and enters the target bottom", async ({
  page,
}) => {
  const document = structuredClone(halfGuardFixture);
  document.nodes[1].position.y = -250;
  await page.addInitScript(
    (doc) => localStorage.setItem("jitsuka:document:v3", JSON.stringify(doc)),
    document,
  );
  await page.goto("/");
  const source = page.locator('.react-flow__node[data-id="half"]');
  const target = page.locator('.react-flow__node[data-id="sweep"]');
  await expect(source).toBeVisible();
  await expect(target).toBeVisible();
  const path = page.locator(".react-flow__edge-path");
  await expect(path).toHaveCount(1);
  await expect
    .poll(async () => {
      const from = (await source
        .locator('[data-handleid="top"]')
        .boundingBox())!;
      const to = (await target
        .locator('[data-handleid="bottom"]')
        .boundingBox())!;
      const points = await path.evaluate((element: SVGPathElement) => {
        const matrix = element.getScreenCTM()!;
        const start = element.getPointAtLength(0).matrixTransform(matrix);
        const end = element
          .getPointAtLength(element.getTotalLength())
          .matrixTransform(matrix);
        return { start: start.y, end: end.y };
      });
      return Math.max(
        Math.abs(points.start - from.y),
        Math.abs(points.end - (to.y + to.height)),
      );
    })
    .toBeLessThan(5);
});
test("the edit row opens a technique picker and Cancel is readable", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Edit map" }).click();
  await page
    .getByRole("button", { name: "Edit a technique", exact: true })
    .click({ position: { x: 30, y: 20 } });
  await page.getByLabel("Choose a technique to edit").selectOption("half");
  await expect(page.getByLabel("Name")).toHaveValue("Half Guard");
  await page.getByRole("button", { name: "Close editor" }).click();
  await page
    .getByRole("button", { name: "Add a technique", exact: true })
    .click();
  await page.getByRole("button", { name: "→ Normal", exact: true }).click();
  const cancel = page.getByRole("button", { name: "Cancel", exact: true });
  await expect(cancel).toHaveCSS("background-color", "rgb(24, 89, 163)");
  await expect(cancel).toHaveCSS("color", "rgb(255, 255, 255)");
  await cancel.click();
  await expect(cancel).toHaveCount(0);
});
test("create, label, persist and delete a connected technique", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Edit map" }).click();
  await page
    .getByRole("button", { name: "Add a technique", exact: true })
    .click();
  await expect(
    page.getByText("Same-side arm connection", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Category", { exact: true }).selectOption("position");
  await page
    .getByRole("button", { name: "Add technique", exact: true })
    .click();
  await page.getByLabel("Name").fill("Knee Cut");
  await page
    .getByLabel("Video or reference link")
    .fill("https://www.youtube.com/watch?v=example");
  await page.getByRole("button", { name: "Close editor" }).click();
  await page
    .getByRole("button", { name: "Add a technique", exact: true })
    .click();
  await page.getByRole("button", { name: "→ Normal", exact: true }).click();
  await page
    .locator(".react-flow__node")
    .filter({ hasText: "Half Guard" })
    .first()
    .click();
  await page
    .locator(".react-flow__node")
    .filter({ hasText: "Knee Cut" })
    .click();
  await expect(page.getByLabel("Transition condition")).toBeFocused();
  await page.getByLabel("Transition condition").fill("Win the underhook");
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
  await page
    .getByRole("button", { name: "Add a technique", exact: true })
    .click();
  await page.evaluate(() => {
    window.open = () => {
      throw new Error("Edit mode must not open links");
    };
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page
    .locator(".react-flow__node")
    .filter({ hasText: "Knee Cut" })
    .click();
  await expect(page.getByLabel("Name")).toHaveValue("Knee Cut");
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
  await page
    .getByRole("button", { name: "Add a technique", exact: true })
    .click();
  await page.getByLabel("Category", { exact: true }).selectOption("position");
  await page
    .getByRole("button", { name: "Add technique", exact: true })
    .click();
  await page.getByLabel("Name").fill("Side Control");
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
  await page
    .getByRole("button", { name: "Add a technique", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Add a technique" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Done editing" }).click();
  await expect(launcher).toBeVisible();
  expect((await launcher.boundingBox())!.x).toBe(after.x);
  await launcher.focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", { name: "Add a technique", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Add a technique" }),
  ).toBeVisible();
});

test("connection labels preserve Enter line breaks on the map and after reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Edit map" }).click();
  await page
    .getByRole("button", { name: "Add a technique", exact: true })
    .click();
  await page
    .locator('.react-flow__edge[data-id="e1"] .react-flow__edge-textbg')
    .click();
  const field = page.getByLabel("Transition condition");
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

test("unlinked nodes are silent and editing panels stack without color pickers", async ({
  page,
}) => {
  await page.goto("/");
  const halfGuard = page.locator('.react-flow__node[data-id="half"]');
  await halfGuard.click();
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.getByRole("button", { name: "Edit map" }).click();
  await page
    .getByRole("button", { name: "Add a technique", exact: true })
    .click();
  await halfGuard.click();
  const toolbar = page.locator(".toolbar");
  const inspector = page.getByRole("complementary", {
    name: "Edit technique",
    exact: true,
  });
  await expect(toolbar.getByRole("button", { name: "blue color" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("button", { name: "blue color" })).toHaveCount(0);
  const top = (await toolbar.boundingBox())!;
  const bottom = (await inspector.boundingBox())!;
  expect(bottom.x).toBe(top.x);
  expect(bottom.y).toBeGreaterThan(top.y + top.height);
  await page.getByRole("button", { name: "Close editor" }).click();
  await expect(
    toolbar.getByRole("button", { name: "Add a technique", exact: true }),
  ).toBeVisible();
});

test("Add and Update finish a technique without leaving Edit mode or duplicating nodes", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Edit map" }).click();
  await page
    .getByRole("button", { name: "Add a technique", exact: true })
    .click();
  await page.getByLabel("Category", { exact: true }).selectOption("position");
  await page
    .getByRole("button", { name: "Add technique", exact: true })
    .click();
  await page.getByLabel("Name").fill("Butterfly Guard");
  await page.getByLabel("Category", { exact: true }).selectOption("position");
  await page
    .getByRole("button", { name: "Add technique", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Done editing" }),
  ).toBeVisible();
  await expect(page.getByLabel("Name")).toHaveCount(0);
  await expect(page.locator(".react-flow__node")).toHaveCount(6);
  await page
    .locator(".react-flow__node")
    .filter({ hasText: "Butterfly Guard" })
    .click();
  await page.getByLabel("Name").fill("Butterfly Sweep");
  await page
    .getByRole("button", { name: "Update technique", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Done editing" }),
  ).toBeVisible();
  await expect(page.getByLabel("Name")).toHaveCount(0);
  await expect(page.locator(".react-flow__node")).toHaveCount(6);
  await page.reload();
  await expect(
    page.getByText("Butterfly Sweep", { exact: true }),
  ).toBeVisible();
});

test("edit mode starts minimized and opens the panel for the canvas target", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Edit map" }).click();
  await expect(
    page.getByRole("button", { name: "Add a technique", exact: true }),
  ).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("complementary", { name: "Edit a technique collapsed" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add technique", exact: true }),
  ).toHaveCount(0);
  await page
    .locator(".react-flow__pane")
    .click({ position: { x: 1100, y: 40 } });
  await expect(
    page
      .locator(".toolbar")
      .getByRole("button", { name: "Add technique", exact: true }),
  ).toBeVisible();
  await page.locator('.react-flow__node[data-id="half"]').click();
  await expect(page.getByLabel("Name")).toHaveValue("Half Guard");
  await expect(
    page
      .locator(".toolbar")
      .getByRole("button", { name: "Add technique", exact: true }),
  ).toHaveCount(0);
  await page
    .locator(".react-flow__pane")
    .click({ position: { x: 1100, y: 40 } });
  await expect(page.getByLabel("Name")).toHaveCount(0);
  await expect(
    page
      .locator(".toolbar")
      .getByRole("button", { name: "Add technique", exact: true }),
  ).toBeVisible();
});

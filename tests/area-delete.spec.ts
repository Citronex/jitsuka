import { test, expect } from "@playwright/test";
import { seedMap } from "./seed";
test("area deletion previews, cancels and removes enclosed nodes and attached edges", async ({
  page,
}) => {
  await seedMap(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Edit map" }).click();
  const count = await page.locator(".react-flow__node").count();
  const target = page.locator(".react-flow__node").first();
  const bounds = (await target.boundingBox())!;
  async function draw() {
    await page.getByRole("button", { name: "Delete an area" }).click();
    await page.mouse.move(bounds.x - 8, bounds.y - 8);
    await page.mouse.down();
    await page.mouse.move(
      bounds.x + bounds.width + 8,
      bounds.y + bounds.height + 8,
      { steps: 8 },
    );
    await page.mouse.up();
    await expect(
      page.getByRole("button", { name: "Delete selected" }),
    ).toBeEnabled();
  }
  await draw();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(count);
  await draw();
  await page.getByRole("button", { name: "Delete selected" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(count - 1);
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("jitsuka:document:v3")!).nodes.length,
      ),
    )
    .toBe(count - 1);
  await page.reload();
  await expect(page.locator(".react-flow__node")).toHaveCount(count - 1);
});

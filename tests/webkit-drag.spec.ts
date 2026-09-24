import { expect, test, devices } from "@playwright/test";
test.use({ ...devices["iPhone 13"], browserName: "webkit" });
test("WebKit keeps every technique visible on each drag frame", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Edit map" }).tap();
  await page.getByRole("button", { name: "rounded shape", exact: true }).tap();
  await page.getByLabel("Technique / position").fill("Safari drag");
  const node = page
    .locator(".react-flow__node")
    .filter({ hasText: "Safari drag" });
  const box = (await node.boundingBox())!;
  await page.mouse.move(box.x + box.width - 8, box.y + box.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 20; i++) {
    await page.mouse.move(
      box.x + box.width - 8 + i,
      box.y + box.height / 2 + i * 4,
    );
    expect(
      await page
        .locator(".react-flow__node")
        .evaluateAll((nodes) =>
          nodes.every((n) => getComputedStyle(n).visibility === "visible"),
        ),
    ).toBe(true);
  }
  await page.mouse.up();
  await expect(node).toBeVisible();
  await expect(page.locator(".react-flow__edge")).toHaveCount(4);
});

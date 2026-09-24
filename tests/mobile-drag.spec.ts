import { expect, test, devices } from "@playwright/test";
test.use({ ...devices["Pixel 7"], defaultBrowserType: "chromium" });
test("newly named technique can be dragged with touch without losing the map", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Edit map" }).tap();
  await page.getByRole("button", { name: "rounded shape", exact: true }).tap();
  await page.getByLabel("Technique / position").fill("Mobile drag");
  const node = page
    .locator(".react-flow__node")
    .filter({ hasText: "Mobile drag" });
  const bounds = (await node.boundingBox())!;
  await expect(page.getByLabel("Technique / position")).toHaveCSS(
    "font-size",
    "16px",
  );
  const client = await context.newCDPSession(page);
  const x = bounds.x + bounds.width - 8,
    y = bounds.y + bounds.height / 2;
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let i = 1; i <= 12; i++)
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + (30 * i) / 12, y: y + (100 * i) / 12 }],
    });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.getByLabel("Technique / position")).toBeVisible();
  await expect(node).toBeVisible();
  await expect(page.locator(".react-flow__node")).toHaveCount(6);
  expect(errors).toEqual([]);
  const end = (await node.boundingBox())!;
  expect(end.y).toBeGreaterThan(bounds.y + 40);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("jitsuka.map.v1")!),
  );
  const moved = saved.nodes.find(
    (n: { title: string }) => n.title === "Mobile drag",
  );
  expect(
    Number.isFinite(moved.position.x) && Number.isFinite(moved.position.y),
  ).toBe(true);
  await page.reload();
  await expect(node).toBeVisible();
  await page.screenshot({ path: "test-results/mobile-drag.png" });
});

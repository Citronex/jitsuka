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
  await page
    .getByRole("button", { name: "Add a technique", exact: true })
    .click();
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
  await page.evaluate(() => {
    const hiddenNodes: string[] = [];
    Object.assign(window, { hiddenNodes });
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const element = record.target;
        if (
          element instanceof HTMLElement &&
          element.matches(".react-flow__node") &&
          element.style.visibility === "hidden"
        )
          hiddenNodes.push(element.dataset.id || "unknown");
      }
    });
    observer.observe(document.querySelector(".react-flow__nodes")!, {
      subtree: true,
      attributes: true,
      attributeFilter: ["style"],
    });
  });
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
  expect(await page.evaluate(() => Reflect.get(window, "hiddenNodes"))).toEqual(
    [],
  );
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

test("interrupted edge drag stops moving the canvas after fingers lift", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Edit map" }).tap();
  await page
    .getByRole("button", { name: "Add a technique", exact: true })
    .click();
  await page.getByRole("button", { name: "rounded shape", exact: true }).tap();
  await page.getByLabel("Technique / position").fill("Interrupted drag");
  await page.getByRole("button", { name: "Close editor" }).tap();
  const node = page
    .locator(".react-flow__node")
    .filter({ hasText: "Interrupted drag" });
  const box = (await node.boundingBox())!;
  const client = await context.newCDPSession(page);
  const x = box.x + box.width - 8;
  const y = box.y + box.height / 2;
  const bottom = page.viewportSize()!.height - 5;
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y, id: 0 }],
  });
  for (let i = 1; i <= 15; i++)
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: y + ((bottom - y) * i) / 15, id: 0 }],
    });
  await page.waitForTimeout(150);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x, y: bottom, id: 0 },
      { x: x - 35, y: bottom - 30, id: 1 },
    ],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x, y: bottom - 1, id: 0 },
      { x: x - 35, y: bottom - 31, id: 1 },
    ],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  const viewport = page.locator(".react-flow__viewport");
  await page.waitForTimeout(200);
  const stopped = await viewport.getAttribute("style");
  await page.waitForTimeout(600);
  expect(await viewport.getAttribute("style")).toBe(stopped);
});

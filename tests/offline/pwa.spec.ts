import { expect, test } from "@playwright/test";
import { sampleMap } from "../../src/model";
test("installed assets, offline editing, map transfer, and reload under Pages path", async ({
  page,
  context,
}) => {
  await page.goto("/jitsuka/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  const manifest = await (await page.request.get(manifestHref!)).json();
  expect(manifest.start_url).toBe("/jitsuka/");
  for (const icon of manifest.icons)
    expect((await page.request.get(`/jitsuka/${icon.src}`)).ok()).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Edit map" }).click();
  await page
    .getByRole("button", { name: "Add a technique", exact: true })
    .click();
  await page.getByRole("button", { name: "circle shape" }).click();
  await page.getByLabel("Technique / position").fill("Offline technique");
  await page.reload();
  await expect(
    page.getByText("Offline technique", { exact: true }),
  ).toBeVisible();
  await page.getByText("My map", { exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export map" }).click();
  expect((await download).suggestedFilename()).toBe("jitsuka-map.json");
  await page.getByLabel("Import map file").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from("{}"),
  });
  await expect(page.getByRole("status")).toContainText("not a valid");
  await page.getByLabel("Import map file").setInputFiles({
    name: "map.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(sampleMap)),
  });
  await page.getByRole("button", { name: "Replace map" }).click();
  await page.reload();
  await expect(
    page.getByText("Offline technique", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("John Wayne Sweep", { exact: true }),
  ).toBeVisible();
});

import type { Page } from "@playwright/test";
import { sampleMap } from "../src/domain/fixture";
export async function seedMap(page: Page) {
  await page.addInitScript((sample) => {
    if (
      !localStorage.getItem("jitsuka:document:v3") &&
      !localStorage.getItem("jitsuka.map.v1")
    )
      localStorage.setItem("jitsuka:document:v3", JSON.stringify(sample));
  }, sampleMap);
}

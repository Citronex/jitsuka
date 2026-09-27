import type { Page } from "@playwright/test";
import { sampleMap } from "../src/model";
export async function seedLegacyMap(page: Page) {
  await page.addInitScript((sample) => {
    if (
      !localStorage.getItem("jitsuka:document:v1") &&
      !localStorage.getItem("jitsuka.map.v1")
    )
      localStorage.setItem("jitsuka.map.v1", JSON.stringify(sample));
  }, sampleMap);
}

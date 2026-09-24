import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage();
for (const size of [180, 192, 512]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>body{margin:0}svg{display:block}</style><svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512"><rect width="512" height="512" fill="#293a27"/><text x="256" y="300" text-anchor="middle" fill="#eef3de" font-family="Georgia,serif" font-weight="bold" font-size="240">j.</text></svg>`,
  );
  await page.screenshot({
    path: `public/${size === 180 ? "apple-touch-icon" : `icon-${size}`}.png`,
  });
}
await browser.close();

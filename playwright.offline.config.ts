import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/offline",
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command:
      "VITE_BASE_PATH=/jitsuka/ npm run build && VITE_BASE_PATH=/jitsuka/ npm run preview -- --port 4173",
    url: "http://127.0.0.1:4173/jitsuka/",
    reuseExistingServer: false,
  },
});

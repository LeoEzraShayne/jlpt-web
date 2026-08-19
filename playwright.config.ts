import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3100";
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-320", use: { browserName: "chromium", viewport: { width: 320, height: 800 }, isMobile: true, hasTouch: true } },
    { name: "mobile-360", use: { browserName: "chromium", viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true } },
    { name: "mobile-384", use: { browserName: "chromium", viewport: { width: 384, height: 854 }, isMobile: true, hasTouch: true } },
    { name: "oneplus-ace-3-pro", use: { browserName: "chromium", viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: `npm run start -- --hostname 127.0.0.1 --port ${port}`, url: `${baseURL}/login`, reuseExistingServer: false, timeout: 120_000 },
});

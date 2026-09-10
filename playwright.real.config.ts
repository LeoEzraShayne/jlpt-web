import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e/real-stack', workers: 1, retries: 0, timeout: 60_000,
  outputDir: `${process.env.REAL_QA_DIR}/playwright-results`,
  reporter: [['list'], ['json', { outputFile: `${process.env.REAL_QA_DIR}/browser-results.json` }]],
  use: { baseURL: `http://127.0.0.1:${process.env.REAL_WEB_PORT ?? 3117}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-320', use: { browserName: 'chromium', viewport: { width: 320, height: 800 }, isMobile: true, hasTouch: true } },
  ],
});

import { test as base } from "@playwright/test";
export { expect, type Page } from "@playwright/test";

// Existing learning suites exercise users who already acknowledged adult access.
// The dedicated adult-access suite uses the unmodified Playwright test fixture.
export const test = base.extend({
  page: async ({ page }, runTest) => {
    await page.addInitScript(() => sessionStorage.setItem("jlpt-adult-access-v1", "confirmed"));
    await runTest(page);
  },
});

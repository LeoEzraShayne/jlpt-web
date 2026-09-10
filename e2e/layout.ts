import { expect, type Page } from "@playwright/test";

export async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      })),
    )
    .toEqual(
      expect.objectContaining({
        clientWidth: page.viewportSize()?.width,
        scrollWidth: page.viewportSize()?.width,
      }),
    );
}

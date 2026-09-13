import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./layout";

test("adult confirmation protects login and direct authenticated entry; privacy stays public", async ({ page }, info) => {
  const errors: string[] = [];
  let signedIn = false;
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));
  // These UI-only responses intercept every API request; no production traffic.
  await page.route("**/api/v1/**", route => route.fulfill({
    status: 200, contentType: "application/json",
    headers: { "access-control-allow-origin": route.request().headers().origin ?? "*", "access-control-allow-credentials": "true", "access-control-allow-headers": "content-type" },
    body: JSON.stringify({ data: signedIn && route.request().url().endsWith("/me") ? { id: "adult-ui-fixture", uiLocale: "en" } : null }),
  }));
  await page.goto("/login");
  await expect(page).toHaveTitle(/登录|Sign in/);
  await expect(page.getByRole("heading", { name: "仅限年满 18 周岁的用户" })).toBeVisible();
  await expect(page.getByRole("button", { name: "确认并继续" })).toBeDisabled();
  await expect(page.getByRole("link", { name: "使用 Google 登录" })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await page.getByLabel("界面语言").selectOption("en");
  await expect(page.getByRole("heading", { name: "For users aged 18 and over" })).toBeVisible();
  await page.screenshot({ path: `/tmp/jlpt-adult-gate-${info.project.name}.png`, fullPage: false });
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Confirm and continue" }).click();
  await expect(page.getByRole("link", { name: "Continue with Google" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  signedIn = true;
  await page.evaluate(() => sessionStorage.removeItem("jlpt-adult-access-v1"));
  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "For users aged 18 and over" })).toBeVisible();
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Age requirement" })).toBeVisible();
  await page.goto("/delete-account");
  await expect(page.getByRole("heading", { name: "Account and data deletion request" })).toBeVisible();
  expect(errors).toEqual([]);
});

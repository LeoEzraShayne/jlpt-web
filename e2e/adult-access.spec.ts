import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./layout";
import { layoutFixtureResponse } from "./ui-layout-fixture";

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
  await page.evaluate(() => { sessionStorage.removeItem("jlpt-adult-access-v1"); localStorage.removeItem("jlpt-adult-access-v1"); });
  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "For users aged 18 and over" })).toBeVisible();
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Age requirement" })).toBeVisible();
  await page.goto("/delete-account");
  await expect(page.getByRole("heading", { name: "Account and data deletion request" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("explicit age acknowledgement survives a new app window and sign-out revokes every window", async ({ context, page }) => {
  layoutFixtureResponse("/api/v1/me/preferences", "PUT", { uiLocale: "zh", explanationLocale: "zh" });
  await context.route("**/api/v1/**", async route => {
    const request = route.request();
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(layoutFixtureResponse(request.url(), request.method(), request.postDataJSON() ?? {})) });
  });
  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "仅限年满 18 周岁的用户" })).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "确认并继续" }).click();
  await expect(page.getByRole("heading", { name: "你好，布局预览" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("jlpt-adult-access-v1"))).toBe("confirmed");
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto("/today");
  await expect(reopened.getByRole("heading", { name: "你好，布局预览" })).toBeVisible();
  await expect(reopened.getByRole("checkbox")).toHaveCount(0);
  const otherWindow = await context.newPage();
  await otherWindow.goto("/profile");
  await otherWindow.getByRole("button", { name: "退出登录", exact: true }).click();
  await expect(otherWindow).toHaveURL(/\/login/);
  for (const tab of [reopened, otherWindow]) {
    await expect(tab.getByRole("heading", { name: "仅限年满 18 周岁的用户" })).toBeVisible();
    expect(await tab.evaluate(() => [localStorage.getItem("jlpt-adult-access-v1"), sessionStorage.getItem("jlpt-adult-access-v1")])).toEqual([null, null]);
  }
});

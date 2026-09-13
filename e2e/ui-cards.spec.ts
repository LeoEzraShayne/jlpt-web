import { expect, test } from "./adult-fixture";
import { expectNoHorizontalOverflow } from "./layout";
import { layoutFixtureResponse } from "./ui-layout-fixture";

test("phone lists stack while tablet grids preserve odd cards, actions, pagination and editing", async ({ page }) => {
  layoutFixtureResponse("/api/v1/me/preferences", "PUT", { uiLocale: "zh", explanationLocale: "zh" });
  await page.route("**/api/v1/**", async route => {
    const request = route.request();
    const data = layoutFixtureResponse(request.url(), request.method(), request.postDataJSON() ?? {});
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(data) });
  });
  const width = page.viewportSize()!.width;
  for (const [path, label, desktopColumns] of [
    ["/grammar", "语法卡片列表", width >= 1280 ? 3 : 2],
    ["/history", "学习记录列表", width >= 1280 ? 3 : 2],
    ["/review", "已逾期复习列表", width >= 1280 ? 3 : 2],
    ["/today", "先完成复习任务列表", width >= 1280 ? 3 : 2],
  ] as const) {
    await page.goto(path);
    const grid = page.getByLabel(label, { exact: true });
    await expect(grid.locator(':scope > [data-slot="card"]')).toHaveCount(path === "/history" ? 2 : 3);
    await expectNoHorizontalOverflow(page);
    expect(await grid.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length)).toBe(width < 600 ? 1 : desktopColumns);
    if (width < 1024) {
      const cards = grid.locator(':scope > [data-slot="card"]');
      const first = (await cards.nth(0).boundingBox())!;
      const second = (await cards.nth(1).boundingBox())!;
      const third = path === "/history" ? null : (await cards.nth(2).boundingBox())!;
      if (width < 600) {
        expect(second.x).toBe(first.x);
        expect(second.y).toBeGreaterThan(first.y);
      } else expect(second.y).toBe(first.y);
      if (third) {
        expect(third.x).toBe(first.x);
        expect(third.y).toBeGreaterThan(first.y);
      }
      for (const action of await grid.locator('button, a[data-slot="button"]').all()) {
        expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
    }
    if (path === "/grammar" || path === "/history") {
      if (path === "/grammar") {
        const card = grid.locator(':scope > [data-slot="card"]').first();
        const status = card.locator('[data-slot="badge"]');
        const tags = status.locator('..').locator(':scope > span');
        await expect(tags).toHaveCount(2);
        const boxes = await Promise.all((await tags.all()).map(tag => tag.boundingBox()));
        const centers = boxes.map(box => box!.y + box!.height / 2);
        expect(Math.max(...centers) - Math.min(...centers)).toBeLessThan(1);
        const heading = (await card.getByRole("heading").boundingBox())!;
        for (const box of boxes) expect(box!.y + box!.height).toBeLessThanOrEqual(heading.y);
        const action = card.getByRole("link", { name: "查看并练习", exact: true });
        const date = action.locator('..').locator(':scope > span');
        const actionBox = (await action.boundingBox())!;
        const dateBox = (await date.boundingBox())!;
        expect(Math.abs(actionBox.y + actionBox.height / 2 - dateBox.y - dateBox.height / 2)).toBeLessThan(1);
        expect(actionBox.x).toBeGreaterThan(dateBox.x + dateBox.width);
      }
      if (path === "/history") {
        await expect(grid.locator('a[href="/history/layout-alayout-g1"]')).toHaveCount(0);
        const scoredCard = grid.locator(':scope > [data-slot="card"]').first();
        const score = (await scoredCard.locator("strong").boundingBox())!;
        const details = (await scoredCard.getByRole("link", { name: "查看详情", exact: true }).boundingBox())!;
        expect(Math.abs(score.y + score.height / 2 - details.y - details.height / 2)).toBeLessThan(1);
        expect(details.x).toBeGreaterThan(score.x + score.width);
      }
      await page.getByRole("button", { name: /加载更多/ }).click();
      await expect(grid.locator(':scope > [data-slot="card"]')).toHaveCount(path === "/history" ? 3 : 4);
      if (path === "/history") await expect(grid.locator('a[href="/history/layout-alayout-g3"]').locator("../..").locator("strong")).toHaveText("0分");
    }
    if (width >= 1024) {
      const actions = await grid.locator('a[data-slot="button"], button[data-slot="button"]').all();
      for (const action of actions) expect((await action.boundingBox())!.height).toBe(32);
    }
    if (path === "/today" && width >= 1024) {
      const overview = page.getByLabel("今日学习概览", { exact: true });
      const labels = ["最优先复习", "今日词汇", "今日完成", "今日剩余", "复习总账", "N1 总体进度"];
      const boxes = await Promise.all(labels.map(label => overview.getByLabel(label, { exact: true }).boundingBox()));
      for (const row of [0, 3]) {
        for (let i = row + 1; i < row + 3; i++) {
          expect(boxes[i]!.y).toBe(boxes[row]!.y);
          expect(boxes[i]!.height).toBe(boxes[row]!.height);
          expect(boxes[i]!.x).toBeGreaterThan(boxes[i - 1]!.x + boxes[i - 1]!.width);
        }
      }
      expect(boxes[3]!.y).toBeGreaterThan(boxes[0]!.y + boxes[0]!.height);
      await expect(overview.getByRole("link", { name: "学习清单", exact: true })).toHaveAttribute("href", "/vocabulary-learning");
    }
    if (path === "/today" && width < 1024) {
      const task = grid.locator(':scope > [data-slot="card"]').first();
      const action = task.getByRole("button", { name: "开始复习", exact: true });
      const duration = action.locator('..').locator('..').locator(':scope > span');
      const buttonBox = (await action.boundingBox())!;
      const durationBox = (await duration.boundingBox())!;
      expect(Math.abs(buttonBox.y + buttonBox.height / 2 - durationBox.y - durationBox.height / 2)).toBeLessThan(1);
      expect(buttonBox.x).toBeGreaterThan(durationBox.x + durationBox.width);
      const stats = page.getByLabel("今日剩余", { exact: true }).locator("dl");
      expect(await stats.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length)).toBe(3);
    }
  }
  await page.goto("/profile");
  const settings = page.getByLabel("学习设置", { exact: true });
  await expect(settings.locator(':scope > [data-slot="card"]')).toHaveCount(2);
  const settingsCards = await settings.locator(':scope > [data-slot="card"]').all();
  const languageBox = (await settingsCards[0].boundingBox())!;
  const scheduleBox = (await settingsCards[1].boundingBox())!;
  if (width >= 1024) {
    expect(scheduleBox.y).toBe(languageBox.y);
    expect(scheduleBox.x).toBeGreaterThan(languageBox.x + languageBox.width);
    expect(Math.abs(scheduleBox.width - languageBox.width)).toBeLessThan(1);
  } else expect(scheduleBox.y).toBeGreaterThan(languageBox.y);
  await expect(settings.getByRole("link", { name: "会员与额度", exact: true })).toHaveAttribute("href", "/membership");
  await expect(settings.getByLabel("讲解语言", { exact: true })).toBeVisible();
  await settings.getByRole("button", { name: "保存每日安排", exact: true }).click();
  await expect(settings.getByRole("status")).toHaveText("主目标已保存。");
  await expectNoHorizontalOverflow(page);
  await page.goto("/plans");
  const plan = page.getByLabel("N1 学习计划", { exact: true });
  const compactWidth = (await plan.boundingBox())!.width;
  if (width >= 1024) {
    const cards = await Promise.all(["N1", "N2", "N3", "N4"].map(level =>
      page.getByLabel(`${level} 学习计划`, { exact: true }).boundingBox()));
    for (let i = 1; i < cards.length; i++) {
      expect(cards[i]!.y).toBe(cards[0]!.y);
      expect(cards[i]!.x).toBeGreaterThan(cards[i - 1]!.x + cards[i - 1]!.width);
    }
  }
  if (width >= 600) {
    const actions = await Promise.all(["调整计划", "暂停计划", "计划预估"].map(name =>
      plan.getByRole("button", { name, exact: true }).boundingBox()));
    expect(actions[1]!.y).toBe(actions[0]!.y);
    expect(actions[2]!.y).toBe(actions[0]!.y);
    expect(actions[1]!.x).toBeGreaterThanOrEqual(actions[0]!.x + actions[0]!.width);
    expect(actions[2]!.x).toBeGreaterThanOrEqual(actions[1]!.x + actions[1]!.width);
  }
  const nextPlan = (await page.getByLabel("N2 学习计划", { exact: true }).boundingBox())!;
  const firstPlan = (await plan.boundingBox())!;
  if (width < 600) {
    expect(nextPlan.x).toBe(firstPlan.x);
    expect(nextPlan.y).toBeGreaterThan(firstPlan.y);
  } else expect(nextPlan.y).toBe(firstPlan.y);
  await plan.getByRole("button", { name: "调整计划" }).click();
  await expect(plan.getByLabel("计划开始日期")).toBeVisible();
  if (width < 1024) {
    if (width >= 600) expect((await plan.boundingBox())!.width).toBeGreaterThan(compactWidth * 1.9);
    else expect((await plan.boundingBox())!.width).toBe(compactWidth);
    const start = (await plan.getByLabel("计划开始日期").boundingBox())!;
    const end = (await plan.getByLabel("计划截止日期").boundingBox())!;
    expect(end.y).toBeGreaterThan(start.y);
    expect(start.x).toBe(end.x);
  }
  await expectNoHorizontalOverflow(page);
  await plan.getByRole("button", { name: "取消", exact: true }).click();
  await expect(plan.getByRole("button", { name: "调整计划" })).toBeVisible();
  expect((await plan.boundingBox())!.width).toBe(compactWidth);
  await plan.getByRole("button", { name: "计划预估", exact: true }).click();
  if (width >= 600 && width < 1024) expect((await plan.boundingBox())!.width).toBeGreaterThan(compactWidth * 1.9);
  if (width < 600) expect((await plan.boundingBox())!.width).toBe(compactWidth);
  await plan.getByRole("button", { name: "收起预估", exact: true }).click();
  expect((await plan.boundingBox())!.width).toBe(compactWidth);
});


test("English cards remain readable and single-column login has a 24px section gap", async ({ page }) => {
  layoutFixtureResponse("/api/v1/me/preferences", "PUT", { uiLocale: "en", explanationLocale: "en" });
  await page.route("**/api/v1/**", async route => {
    if (new URL(page.url()).pathname === "/login" && new URL(route.request().url()).pathname.endsWith("/me")) {
      await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: { code: "UNAUTHENTICATED" } }) });
      return;
    }
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(layoutFixtureResponse(route.request().url())) });
  });
  for (const path of ["/today", "/grammar", "/review", "/history", "/plans", "/profile"]) {
    await page.goto(path);
    await expect(page.locator('[data-slot="card"]').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page.getByText("NaN", { exact: true })).toHaveCount(0);
    for (const title of await page.locator('[data-slot="card"] h2, [data-slot="card"] h3').all()) {
      expect(await title.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    }
  }
  await page.goto("/login");
  const hero = page.locator("main > div > section").first();
  const login = page.locator("main > div > section").last();
  await expect(login.getByRole("link", { name: /Google/ })).toBeVisible();
  if (page.viewportSize()!.width < 1024) {
    const first = (await hero.boundingBox())!;
    const second = (await login.boundingBox())!;
    expect(Math.round(second.y - first.y - first.height)).toBe(24);
  }
  await expectNoHorizontalOverflow(page);
});

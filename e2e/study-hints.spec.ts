import { expect, test, type Page } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./layout";

const user = {
  id: "user-1",
  email: "test@example.com",
  displayName: "测试用户",
  role: "USER",
  timezone: "Asia/Tokyo",
  targetLevel: "N1",
  colorTheme: "sunshine",
};

const plan = {
  id: "plan-1",
  level: "N1",
  startDate: "2026-09-01T00:00:00.000Z",
  targetDate: "2026-12-06T00:00:00.000Z",
  dailyMinutes: 20,
  dailyNewLimit: 2,
  status: "ACTIVE",
};

const grammar = {
  id: "grammar-1",
  level: "N1",
  title: "～を踏まえて・～を踏まえた",
  chineseExplanation: "根据……；在……基础上",
  connectionRule: "名词＋を踏まえて",
  sortOrder: 1,
  examples: [
    {
      id: "example-1",
      sentence: "結果を踏まえて判断します。",
      translation: "根据结果作出判断。",
      sortOrder: 1,
    },
  ],
  progress: [],
};

function session(mode: "LEARN" | "REVIEW", hintRevealCount = 0) {
  const startedAt = new Date();
  return {
    id: mode.toLowerCase(),
    grammarId: grammar.id,
    taskId: `${mode.toLowerCase()}-task`,
    mode,
    status: "ACTIVE",
    revealedAt: mode === "LEARN" ? startedAt.toISOString() : null,
    hintRevealCount,
    timer: {
      phase: "FOCUS",
      phaseStartedAt: startedAt.toISOString(),
      phaseEndsAt: new Date(startedAt.getTime() + 600_000).toISOString(),
      focusMinutes: 10,
      breakMinutes: 5,
    },
    grammar,
    attempts: [],
  };
}

async function mockStudyApi(page: Page) {
  let revealCount = 0;
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    let data: unknown = {};
    if (path.endsWith("/me")) data = user;
    else if (path.endsWith("/study-plans")) data = { items: [plan], nextCursor: null };
    else if (path.endsWith("/study-plans/current")) data = plan;
    else if (path.endsWith("/study-sessions/review/reveal")) {
      revealCount += 1;
      // The reveal endpoint returns session fields, without loaded relations.
      const { grammar: omittedGrammar, attempts: omittedAttempts, ...update } = session("REVIEW", revealCount);
      void omittedGrammar;
      void omittedAttempts;
      data = update;
    } else if (path.endsWith("/study-sessions/review"))
      data = session("REVIEW", revealCount);
    else if (path.endsWith("/study-sessions/learn")) data = session("LEARN");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data }),
    });
  });
  return () => revealCount;
}

function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("first learning opens the grammar hint by default", async ({ page }) => {
  const errors = collectPageErrors(page);
  const reveals = await mockStudyApi(page);
  await page.goto("/study/learn");
  await expect(page.getByRole("button", { name: "隐藏提示" })).toBeVisible();
  await expect(page.getByText(grammar.chineseExplanation)).toBeVisible();
  expect(reveals()).toBe(0);
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("review starts closed and records each hint opening", async ({ page }) => {
  const errors = collectPageErrors(page);
  const reveals = await mockStudyApi(page);
  await page.goto("/study/review");
  const toggle = page.getByRole("button", { name: "查看提示" });
  await expect(toggle).toBeVisible();
  await expect(page.getByText(grammar.chineseExplanation)).toBeHidden();
  await page.getByPlaceholder(/请使用/).fill("結果を踏まえて判断します。");
  await toggle.click();
  await expect(page.getByRole("button", { name: "隐藏提示" })).toBeVisible();
  await expect.poll(reveals).toBe(1);
  await page.getByRole("button", { name: "隐藏提示" }).click();
  await page.getByRole("button", { name: "查看提示" }).click();
  await expect.poll(reveals).toBe(2);
  await expect(page.getByRole("heading", { name: grammar.title })).toBeVisible();
  await expect(page.getByText(grammar.connectionRule, { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder(/请使用/)).toHaveValue("結果を踏まえて判断します。");
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

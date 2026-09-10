import { expect, test, type Page } from "@playwright/test";

async function mockStudy(page: Page, rememberedAllowed = true, score = 100) {
  const completions: unknown[] = [];
  const submissions: unknown[] = [];
  let releaseCompletion!: () => void;
  const completionGate = new Promise<void>((resolve) => { releaseCompletion = resolve; });
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const headers = {
      "access-control-allow-origin": request.headers().origin ?? "*",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET,POST,OPTIONS",
    };
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers });
      return;
    }
    let data: unknown = {};
    if (path.endsWith("/me")) data = {
      id: "u1", displayName: "测试用户", email: "test@example.com",
      role: "USER", timezone: "Asia/Tokyo", targetLevel: "N1", colorTheme: "sunshine",
    };
    else if (path.endsWith("/study-plans")) data = { items: [{ id: "p1", level: "N1", status: "ACTIVE" }], nextCursor: null };
    else if (path.endsWith("/study-plans/current")) data = {
      id: "p1", level: "N1", status: "ACTIVE", dailyMinutes: 60,
    };
    else if (path.endsWith("/study-sessions/enter")) data = {
      id: "enter", grammarId: "g1", mode: "REVIEW", status: "ACTIVE", attempts: [],
      grammar: { id: "g1", title: "～ともあろう", level: "N1", examples: [], progress: [] },
      timer: { phase: "FOCUS", phaseStartedAt: new Date().toISOString(),
        phaseEndsAt: new Date(Date.now() + 600_000).toISOString(), focusMinutes: 30, breakMinutes: 5 },
    };
    else if (path.endsWith("/sentence-reviews")) {
      submissions.push(request.postDataJSON());
      data = { reviewId: "r1", status: "QUEUED" };
    } else if (path.endsWith("/sentence-reviews/r1")) data = {
      id: "r1", status: "COMPLETED", retryCount: 0,
      result: {
        id: "result1", totalScore: score, grammarScore: 30, connectionScore: 20,
        completenessScore: 20, naturalnessScore: 20, vocabularyScore: 10,
        isCorrect: true, resultLevel: "EXCELLENT", errorSpans: [],
        correctedSentence: "プロともあろう者が、こんなミスをするとは。",
        correctedSentenceFurigana: "プロともあろう者[もの]が、こんなミスをするとは。",
        explanationZh: "语法使用正确。", encouragement: "写得很好。",
        recallPolicy: { allowedRatings: rememberedAllowed ? ["FORGOT", "FUZZY", "REMEMBERED"] : ["FORGOT", "FUZZY"], reason: "NONE" },
      },
    };
    else if (path.endsWith("/study-sessions/enter/complete")) {
      completions.push(request.postDataJSON());
      await completionGate;
      data = { id: "enter", status: "COMPLETED" };
    } else if (path.endsWith("/dashboard/today")) data = {
      summary: { level: "N1", totalGrammar: 40 }, tasks: [], estimatedMinutes: 0,
      planning: { budgetMinutes: 60, plannedMinutes: 0, dueUnscheduledCount: 0 },
    };
    await route.fulfill({ status: 200, contentType: "application/json", headers, body: JSON.stringify({ data }) });
  });
  await page.goto("/study/enter");
  await expect(page.getByRole("heading", { name: "～ともあろう" })).toBeVisible();
  return { completions, submissions, releaseCompletion };
}

async function submitSentence(page: Page) {
  await page.getByPlaceholder(/请使用/).fill("プロともあろう者が、こんなミスをするとは。");
  await page.getByPlaceholder(/请使用/).press("Enter");
  await expect(page.getByText("这次记得怎么样？")).toBeVisible();
}

test("Enter submits a sentence, then remembers exactly once after the result", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const mock = await mockStudy(page);
  await submitSentence(page);
  await expect(page.locator("ruby rt")).toHaveText(["もの"]);
  expect(mock.submissions).toHaveLength(1);
  expect(mock.completions).toHaveLength(0);
  await expect(page.getByRole("button", { name: "记住了", exact: true })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect.poll(() => mock.completions.length).toBe(1);
  expect(mock.completions[0]).toEqual({ recallRating: "REMEMBERED", sentenceReviewId: "r1" });
  await expect(page.getByRole("button", { name: "记住了", exact: true })).toBeDisabled();
  await page.keyboard.press("Enter");
  expect(mock.completions).toHaveLength(1);
  mock.releaseCompletion();
  await expect(page).toHaveURL(/\/today$/);
  expect(errors).toEqual([]);
});

test("modifier keys, IME confirmation and key repeat do not remember", async ({ page }) => {
  const mock = await mockStudy(page);
  await submitSentence(page);
  for (const key of ["Shift+Enter", "Control+Enter", "Alt+Enter", "Meta+Enter"]) await page.keyboard.press(key);
  for (const extra of [{ isComposing: true }, { keyCode: 229 }, { repeat: true }]) {
    await page.locator("body").dispatchEvent("keydown", { key: "Enter", bubbles: true, ...extra });
  }
  // A subsequent request is a barrier after processing the ignored keyboard events.
  await page.getByRole("button", { name: "忘记了", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => mock.completions.length).toBe(1);
  expect(mock.completions).toEqual([{ recallRating: "FORGOT", sentenceReviewId: "r1" }]);
  mock.releaseCompletion();
  await expect(page).toHaveURL(/\/today$/);
});

test("Enter cannot choose remembered when the review policy disallows it", async ({ page }) => {
  const mock = await mockStudy(page, false);
  await submitSentence(page);
  await expect(page.getByRole("button", { name: "记住了", exact: true })).toHaveCount(0);
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "有些模糊", exact: true }).click();
  await expect.poll(() => mock.completions.length).toBe(1);
  expect(mock.completions).toEqual([{ recallRating: "FUZZY", sentenceReviewId: "r1" }]);
  mock.releaseCompletion();
  await expect(page).toHaveURL(/\/today$/);
});


test("retry actions share one row and Enter defaults to retry", async ({ page }, testInfo) => {
  const mock = await mockStudy(page, false, 59);
  await submitSentence(page);
  const buttons = ["忘记了", "有些模糊", "修改后重试"].map((name) =>
    page.getByRole("button", { name, exact: true }));
  const bounds = await Promise.all(buttons.map((button) => button.boundingBox()));
  expect(bounds.every(Boolean)).toBe(true);
  expect(Math.max(...bounds.map((box) => box!.y)) - Math.min(...bounds.map((box) => box!.y))).toBeLessThan(2);
  await expect(buttons[2]).toHaveAttribute("data-variant", "default");
  await expect(page.getByText("首次结果仍会保留", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await buttons[2].scrollIntoViewIfNeeded();
  await page.screenshot({ path: `/tmp/jlpt-retry-${testInfo.project.name}.png` });
  await page.keyboard.press("Enter");
  await expect(page.getByPlaceholder(/请使用/)).toHaveValue("");
  await expect(page.getByText("上次 AI 修改后的句子", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /提交给 AI/ })).toBeDisabled();
  expect(mock.completions).toHaveLength(0);
});

test("Tab chooses another recall action and Enter activates that button", async ({ page }) => {
  const mock = await mockStudy(page, false, 59);
  await submitSentence(page);
  await page.getByRole("button", { name: "忘记了", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "有些模糊", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect.poll(() => mock.completions.length).toBe(1);
  expect(mock.completions).toEqual([{ recallRating: "FUZZY", sentenceReviewId: "r1" }]);
  mock.releaseCompletion();
  await expect(page).toHaveURL(/\/today$/);
});

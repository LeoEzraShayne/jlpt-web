import { expect, test, type Page } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./layout";
const user = {
  id: "u1",
  email: "test@example.com",
  displayName: "测试用户",
  role: "USER",
  timezone: "Asia/Tokyo",
  targetLevel: "N1",
  colorTheme: "sunshine",
};
const grammar = {
  id: "g1",
  level: "N1",
  title: "～にかかわる",
  chineseExplanation: "关系到……",
  connectionRule: "名词＋にかかわる",
  sortOrder: 1,
  examples: [
    {
      id: "e1",
      sentence: "命にかかわる問題だ。",
      translation: "关系生命的问题。",
      sortOrder: 1,
    },
  ],
  progress: [],
};
const plan = {
  id: "p1",
  level: "N1",
  startDate: "2026-08-09T12:00:00.000Z",
  targetDate: "2026-12-06T12:00:00.000Z",
  dailyMinutes: 20,
  dailyNewLimit: 2,
  status: "ACTIVE",
  totalGrammar: 40,
  learnedGrammar: 0,
  remainingGrammar: 40,
  recommendedDailyNew: 1,
};
const timer = {
  phase: "FOCUS",
  phaseStartedAt: new Date().toISOString(),
  phaseEndsAt: new Date(Date.now() + 600_000).toISOString(),
  focusMinutes: 10,
  breakMinutes: 10,
};
const planning = (plannedMinutes: number) => ({ budgetMinutes: 20, plannedMinutes, dueUnscheduledCount: 0, planAtRisk: false, algorithmVersion: "adaptive-v1" });
const reviewResult = {
  id: "res1",
  totalScore: 59,
  grammarScore: 20,
  connectionScore: 15,
  completenessScore: 10,
  naturalnessScore: 9,
  vocabularyScore: 5,
  isCorrect: false,
  resultLevel: "NEEDS_REVISION",
  errorSpans: [],
  correctedSentence: "これは命にかかわる問題です。",
  correctedSentenceFurigana: "これは命[いのち]にかかわる問題[もんだい]です。",
  correctedSentenceTranslationZh: "这是一个性命攸关的问题。",
  alternativeSentence: "少子化は国家の存続にかかわる重要な問題です。",
  alternativeSentenceFurigana:
    "少子化[しょうしか]は国家[こっか]の存続[そんぞく]にかかわる重要[じゅうよう]な問題[もんだい]です。",
  alternativeSentenceTranslationZh: "少子化是关系到国家存续的重要问题。",
  explanationZh: "需要修改。",
  encouragement: "再调整一下",
};
async function mockAuthenticatedApi(
  page: Page,
  overrides: {
    today?: unknown;
    reviewQueue?: unknown[];
    onboardingWithoutPlan?: boolean;
  } = {},
) {
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    const requestOrigin = route.request().headers().origin;
    const cors = {
      "access-control-allow-origin": requestOrigin ?? "http://127.0.0.1:3100",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET,POST,PATCH,PUT,OPTIONS",
    };
    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: cors });
      return;
    }
    let data: unknown = {};
    let meta: unknown;
    if (path.endsWith("/me")) data = user;
    else if (path.endsWith("/study-plans")) data = method === "POST" ? plan : { items: overrides.onboardingWithoutPlan && new URL(page.url()).pathname === "/onboarding" ? [] : [plan], nextCursor: null };
    else if (/\/study-plans\/[^/]+\/forecast$/.test(path)) { data = []; meta = { algorithmVersion: "adaptive-v1", isEstimate: true, assumption: "REMEMBERED", projectedCompletionDate: "2026-09-30", targetDate: "2026-12-06", remainingNewAfterHorizon: 39, planAtRisk: false }; }
    else if (path.endsWith("/study-plans/current")) {
      if (overrides.onboardingWithoutPlan && new URL(page.url()).pathname === "/onboarding") {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          headers: cors,
          body: JSON.stringify({
            error: { code: "PLAN_NOT_INITIALIZED", message: "Study plan not initialized" },
          }),
        });
        return;
      }
      data = plan;
    }
    else if (path.endsWith("/dashboard/today"))
      data = overrides.today ?? {
        summary: {
          newCount: 1,
          reviewCount: 0,
          completedCount: 0,
          level: "N1",
          totalGrammar: 40,
          masteryPercent: 0,
          masteredGrammar: 0,
          unmasteredGrammar: 40,
          learnedGrammar: 0,
          trackedGrammar: 0,
          overdueReviewCount: 0,
        },
        estimatedMinutes: 8,
        requiredReviewRemaining: 0,
        newLearningUnlocked: true,
        nextTaskId: "t1",
        planning: planning(8),
        tasks: [
          {
            id: "t1",
            grammarId: "g1",
            type: "LEARN",
            status: "PENDING",
            estimatedMinutes: 8,
            priorityGroup: "NEW",
            locked: false,
            grammar,
          },
        ],
      };
    else if (path.endsWith("/grammar-levels"))
      data = [
        { level: "N1", grammarCount: 40, contentStatus: "AVAILABLE" },
        { level: "N2", grammarCount: 40, contentStatus: "AVAILABLE" },
        { level: "N3", grammarCount: 100, contentStatus: "AVAILABLE" },
        { level: "N4", grammarCount: 43, contentStatus: "AVAILABLE" },
      ];
    else if (path.endsWith("/grammar-points/g1"))
      data = { ...grammar, title: "～を皮切りに（して）・～を皮切りとして" };
    else if (path.endsWith("/grammar-points")) {
      const level = url.searchParams.get("level") || "N1";
      data = [
        {
          ...grammar,
          level,
          title: level === "N2" ? "～に関して" : grammar.title,
        },
      ];
    } else if (path.endsWith("/review-queue")) data = overrides.reviewQueue ?? [];
    else if (path.endsWith("/sentence-attempts/a1"))
      data = {
        id: "a1",
        grammarId: "g1",
        sentence:
          "これは非常に長い日本語の文章でも画面の外にはみ出さずに表示できることを確認するための例文です。",
        scene: "日常",
        createdAt: "2026-08-09T10:00:00.000Z",
        grammar,
        aiJob: { result: reviewResult },
      };
    else if (path.endsWith("/sentence-attempts")) data = [{ id: "a1", grammarId: "g1", sentence: "这是用于验证长句布局不会产生横向空白或溢出的日语学习记录。", createdAt: "2026-08-10T16:16:29.000Z", grammar, aiJob: { result: reviewResult } }];
    else if (path.endsWith("/study-sessions") && method === "POST")
      data = { session: { id: "s1" }, grammar };
    else if (path.endsWith("/study-sessions/s1/timer/advance")) data = timer;
    else if (path.endsWith("/study-sessions/s1"))
      data = {
        id: "s1",
        grammarId: "g1",
        taskId: "t1",
        mode: "LEARN",
        status: "ACTIVE",
        timer,
        grammar,
        attempts: [],
      };
    else if (path.endsWith("/sentence-reviews") && method === "POST")
      data = { reviewId: "r1", status: "QUEUED" };
    else if (path.endsWith("/sentence-reviews/r1"))
      data = {
        id: "r1",
        status: "COMPLETED",
        retryCount: 0,
        result: reviewResult,
      };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: cors,
      body: JSON.stringify({ data, ...(meta ? { meta } : {}) }),
    });
  });
}
test("brand login page is responsive and exposes Google sign in", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /真正掌握/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Google 登录/ })).toBeVisible();
  const copy = page.getByText(
    "使用 Google 账号登录，学习进度和主题会在不同设备间同步。",
  );
  await expect(copy).toBeVisible();
  await expect(copy).toHaveCSS(
    "white-space",
    (page.viewportSize()?.width ?? 0) < 640 ? "normal" : "nowrap",
  );
  await expectNoHorizontalOverflow(page);
});
test("today task opens the focused study flow and enforces score 59 revision", async ({ page }) => {
  await mockAuthenticatedApi(page);
  await page.goto("/today");
  await expect(
    page.getByRole("heading", { name: "你好，测试用户" }),
  ).toBeVisible();
  const overview = page.locator('section[aria-label="今日学习概览"]');
  const columns = await overview.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
  const width = page.viewportSize()?.width ?? 0;
  expect(columns).toBe(width >= 1280 ? 6 : width >= 768 ? 2 : 1);
  await expect(page.getByText("今日剩余", { exact: true })).toBeVisible();
  await expect(page.getByText("今日完成", { exact: true })).toBeVisible();
  await expect(page.getByText("复习总账", { exact: true })).toBeVisible();
  await expect(page.getByText("未来 7 天复习").locator("..")).toContainText("0");
  await expect(page.getByText(/其中预算外/)).toHaveCount(0);
  await expect(page.getByText("N1 总体进度", { exact: true })).toBeVisible();
  const recommendationLabel = page.getByText("开始今天的新语法", { exact: true });
  const recommendationText = recommendationLabel.locator("..");
  const [recommendationIconBox, recommendationLabelBox, recommendationTitleBox] = await Promise.all([
    recommendationText.locator("..").locator("svg").first().boundingBox(),
    recommendationLabel.boundingBox(),
    recommendationText.getByRole("heading", { name: grammar.title }).boundingBox(),
  ]);
  expect(recommendationIconBox).not.toBeNull();
  expect(recommendationLabelBox).not.toBeNull();
  expect(recommendationTitleBox).not.toBeNull();
  expect(recommendationLabelBox!.x).toBeGreaterThan(recommendationIconBox!.x + recommendationIconBox!.width);
  expect(Math.abs(recommendationLabelBox!.x - recommendationTitleBox!.x)).toBeLessThan(2);
  expect(recommendationTitleBox!.y).toBeGreaterThan(recommendationLabelBox!.y);
  await expect(recommendationText.getByText("用造句检验自己是否真正掌握")).toBeVisible();
  await expect(recommendationText.getByRole("heading", { name: grammar.title })).toHaveCSS("font-size", "24px");
  await expect(page.getByText("待开始新语法").locator("..")).toContainText("1");
  await expect(page.getByText("尚未学习").locator("..")).toContainText("40");
  await expect(page.getByText("未掌握", { exact: true })).toHaveCount(0);
  const estimateBox = await page.getByText("预计 8 分钟", { exact: true }).last().boundingBox();
  const actionBox = await page.getByRole("button", { name: "开始学习" }).last().boundingBox();
  expect(estimateBox).not.toBeNull();
  expect(actionBox).not.toBeNull();
  expect(Math.abs((estimateBox!.y + estimateBox!.height / 2) - (actionBox!.y + actionBox!.height / 2))).toBeLessThan(5);
  await page.getByRole("button", { name: "开始学习" }).first().click();
  await expect(page).toHaveURL(/\/study\/s1/);
  await expect(page.locator("time")).toHaveText(/^(30:00|29:5\d)$/);
  await page.getByPlaceholder(/请使用/).fill("これは問題にかかわる。");
  await page.getByRole("button", { name: /提交给 AI/ }).click();
  await expect(page.getByText("59", { exact: true })).toBeVisible();
  await expect(page.getByText("そんぞく")).toBeVisible();
  await expect(page.getByText("这是一个性命攸关的问题。")).toBeVisible();
  await expect(
    page.getByText("少子化是关系到国家存续的重要问题。"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "修改后重新提交" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "记住了" })).toHaveCount(0);
  await page.getByRole("button", { name: "修改后重新提交" }).click();
  await expect(page.getByText("上次 AI 修改后的句子", { exact: true })).toBeVisible();
  await expect(page.locator("ruby rt")).toHaveText(["いのち", "もんだい"]);
  await expect(page.getByPlaceholder(/请使用/)).toHaveValue("");
  await expect(page.getByRole("button", { name: /提交给 AI/ })).toBeDisabled();
  await page.getByPlaceholder(/请使用/).fill("これは命にかかわる大事な問題です。");
  await expect(page.getByRole("button", { name: /提交给 AI/ })).toBeEnabled();
});
test("today prioritizes review, locks new learning, and keeps task actions aligned", async ({
  page,
}) => {
  const reviewGrammar = {
    ...grammar,
    id: "g-review",
    title: "～ずにはおかない",
    chineseExplanation: "一定会……；不能不……。",
  };
  const newGrammar = {
    ...grammar,
    id: "g-new",
    title: "～や否や",
    chineseExplanation: "刚一……就……。",
  };
  await mockAuthenticatedApi(page, {
    today: {
      summary: {
        newCount: 1,
        reviewCount: 1,
        completedCount: 0,
        level: "N1",
        totalGrammar: 40,
        masteryPercent: 20,
        masteredGrammar: 8,
        unmasteredGrammar: 32,
        learnedGrammar: 8,
        trackedGrammar: 8,
        overdueReviewCount: 1,
      },
      estimatedMinutes: 14,
      requiredReviewRemaining: 1,
      newLearningUnlocked: false,
      nextTaskId: "t-review",
      planning: planning(14),
      tasks: [
        {
          id: "t-review",
          grammarId: "g-review",
          type: "REVIEW",
          status: "PENDING",
          estimatedMinutes: 6,
          priorityGroup: "OVERDUE",
          locked: false,
          grammar: reviewGrammar,
        },
        {
          id: "t-new",
          grammarId: "g-new",
          type: "LEARN",
          status: "PENDING",
          estimatedMinutes: 8,
          priorityGroup: "NEW",
          locked: true,
          grammar: newGrammar,
        },
      ],
    },
  });
  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "先完成复习" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "今日新语法" })).toBeVisible();
  await expect(page.locator('[aria-label="先完成复习任务列表"]').getByRole("button", { name: "开始复习" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "先完成复习" })).toBeDisabled();
  await expect(page.getByText("先完成本组复习，再学习新语法", { exact: true })).toBeVisible();
  await expect(page.getByText("逾期待复习", { exact: true })).toBeVisible();
  const reviewCard = page.getByRole("heading", { name: reviewGrammar.title }).last().locator("..");
  const estimate = reviewCard.getByText("预计 6 分钟");
  const action = reviewCard.getByRole("button", { name: "开始复习" });
  const [estimateBox, actionBox] = await Promise.all([estimate.boundingBox(), action.boundingBox()]);
  expect(estimateBox).not.toBeNull();
  expect(actionBox).not.toBeNull();
  expect(Math.abs((estimateBox?.y ?? 0) + (estimateBox?.height ?? 0) / 2 - ((actionBox?.y ?? 0) + (actionBox?.height ?? 0) / 2))).toBeLessThan(3);
  expect(actionBox?.x ?? 0).toBeGreaterThan(estimateBox?.x ?? 0);
  await expect(reviewCard.getByText(reviewGrammar.chineseExplanation)).toBeVisible();
  const noteBox = await reviewCard.getByText(reviewGrammar.chineseExplanation).boundingBox();
  expect(noteBox).not.toBeNull();
  if ((page.viewportSize()?.width ?? 0) < 768) {
    expect((estimateBox?.y ?? 0) - ((noteBox?.y ?? 0) + (noteBox?.height ?? 0))).toBeLessThan(32);
  }
  await expectNoHorizontalOverflow(page);
});

test("today overview keeps only the task-list completion message", async ({ page }) => {
  await mockAuthenticatedApi(page, {
    today: {
      summary: {
        newCount: 0,
        reviewCount: 0,
        completedCount: 1,
        level: "N1",
        totalGrammar: 40,
        masteryPercent: 23,
        masteredGrammar: 9,
        unmasteredGrammar: 31,
        learnedGrammar: 10,
        trackedGrammar: 10,
        overdueReviewCount: 0,
      },
      estimatedMinutes: 0,
      requiredReviewRemaining: 0,
      newLearningUnlocked: true,
      nextTaskId: null,
      planning: planning(0),
      tasks: [
        {
          id: "done-task",
          grammarId: grammar.id,
          type: "LEARN",
          status: "COMPLETED",
          estimatedMinutes: 8,
          priorityGroup: "NEW",
          locked: false,
          grammar,
        },
      ],
    },
  });
  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "今日任务全部完成" })).toHaveCount(0);
  await expect(page.getByText("今天的学习闭环已经完成。")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "今天的任务完成了" })).toBeVisible();
  await expect(page.getByText("N1 总体进度", { exact: true })).toBeVisible();
  await expect(page.getByText("较稳定").locator("..")).toContainText("9");
  await expectNoHorizontalOverflow(page);
});

test("review queue exposes overdue, today, and upcoming priority groups", async ({
  page,
}) => {
  const progress = {
    id: "p1",
    masteryScore: 35,
    state: "NEEDS_WORK",
    grammar,
  };
  await mockAuthenticatedApi(page, {
    reviewQueue: [
      { id: "r-overdue", nextReviewAt: "2026-08-09T00:00:00.000Z", group: "OVERDUE", estimatedMinutes: 6, progress },
      { id: "r-today", nextReviewAt: "2026-08-11T12:00:00.000Z", group: "DUE_TODAY", estimatedMinutes: 4, progress: { ...progress, id: "p2" } },
      { id: "r-upcoming", nextReviewAt: "2026-08-12T12:00:00.000Z", group: "UPCOMING", estimatedMinutes: 4, progress: { ...progress, id: "p3" } },
    ],
  });
  await page.goto("/review");
  await expect(page.getByRole("heading", { name: "已逾期", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "今天复习", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /未来 7 天还有/ }).click();
  await expect(page.getByRole("heading", { name: "未来 7 天", exact: true })).toBeVisible();
  expect(await page.locator('[aria-label="已逾期复习列表"]').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe((page.viewportSize()?.width ?? 0) >= 1536 ? 3 : (page.viewportSize()?.width ?? 0) >= 768 ? 2 : 1);
  await expectNoHorizontalOverflow(page);
});
test("grammar library switches through the available N1 to N4 levels", async ({
  page,
}) => {
  await mockAuthenticatedApi(page);
  await page.goto("/grammar");
  const grammarGridColumns = await page
    .locator('[aria-label="语法卡片列表"]')
    .evaluate((element) =>
      getComputedStyle(element).gridTemplateColumns.split(" ").length,
    );
  const viewportWidth = page.viewportSize()?.width ?? 0;
  expect(grammarGridColumns).toBe(
    viewportWidth >= 1280 ? 3 : viewportWidth >= 768 ? 2 : 1,
  );
  await page.getByRole("button", { name: /^N2/ }).click();
  await expect(page.getByRole("heading", { name: "N2 语法库" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "～に関して" })).toBeVisible();
  await page.getByRole("button", { name: /^N4/ }).click();
  await expect(page.getByRole("heading", { name: "N4 语法库" })).toBeVisible();
  await expect(page.getByText("43 个正式语法")).toBeVisible();
  await expect(page.getByRole("button", { name: /^N5/ })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("daily new grammar limit supports up to ten", async ({ page }) => {
  await mockAuthenticatedApi(page, { onboardingWithoutPlan: true });
  await page.goto("/onboarding");
  await expect(page.getByLabel("每日新语法数量")).toHaveAttribute("max", "10");
  await page.goto("/profile");
  const panel = page.getByLabel("N1 学习计划", { exact: true });
  await panel.getByRole("button", { name: "调整计划" }).click();
  await expect(page.getByLabel("N1 每日新语法上限")).toHaveAttribute("max", "10");
  await expectNoHorizontalOverflow(page);
});
test("plan settings expose dates and new-learning limits without time caps", async ({ page }) => {
  await mockAuthenticatedApi(page, { onboardingWithoutPlan: true });
  await page.goto("/onboarding");
  await expect(page.getByText("计划日期", { exact: true })).toBeVisible();
  await expect(page.getByLabel("计划开始日期")).toBeVisible();
  await expect(page.getByLabel("计划截止日期")).toBeVisible();
  await expect(page.getByLabel("每日学习小时")).toHaveCount(0);
  await expect(page.getByLabel("每日学习分钟")).toHaveCount(0);
  await expect(page.getByLabel("每日新语法数量")).toBeVisible();
});
test("all main routes stay inside the viewport", async ({ page }) => {
  await mockAuthenticatedApi(page, { onboardingWithoutPlan: true });
  const routes = [
    ["/onboarding", "生成你的 N1 学习计划"],
    ["/today", "今日任务"],
    ["/grammar", "N1 语法库"],
    ["/grammar/g1", "～を皮切りに（して）・～を皮切りとして"],
    ["/review", "复习队列"],
    ["/history", "59分"],
    ["/history/a1", "当时的造句"],
    ["/profile", "我的学习"],
    ["/study/s1", "造一个日语句子"],
  ] as const;
  for (const [route, text] of routes) {
    await page.goto(route);
    await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});

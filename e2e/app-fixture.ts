import type { Page } from "@playwright/test";
const user = {
  id: "u1",
  email: "test@example.com",
  displayName: "测试用户",
  role: "USER",
  timezone: "Asia/Tokyo",
  targetLevel: "N1",
  colorTheme: "sunshine",
};
export const grammar = {
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
export const planning = (plannedMinutes: number) => ({ budgetMinutes: 20, plannedMinutes, dueUnscheduledCount: 0, planAtRisk: false, algorithmVersion: "adaptive-v1" });
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
export async function mockAuthenticatedApi(
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
    else if (path.endsWith("/me/entitlements")) data = { isMember: false, expiresAt: null, salesEnabled: false, quota: { enforcementEnabled: false, dailyLimit: 5, consumed: 0, reserved: 0, remaining: 5, rewardBalance: 0, resetsAt: "2026-09-14T00:00:00Z", timezone: "Asia/Tokyo" } };
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

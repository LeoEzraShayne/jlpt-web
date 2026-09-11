import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./layout";

test("review hides personal references, reveals explicitly, and saves checked AI variants", async ({
  page,
}, testInfo) => {
  let reveals = 0;
  let expressionReads = 0;
  const saves: unknown[] = [];
  const errors: string[] = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  const context = {
    version: "training-v1",
    instructionZh: "用目标语法完成新的工作任务。只换名词不算迁移。",
    scenario: {
      version: "scenario-v1",
      id: "work",
      scenarioId: "work",
      taskId: "task-work",
      objectiveId: "explain-decision",
      domain: "WORK",
      objective: "explain-decision",
      register: "FORMAL_WRITTEN",
      promptZh: "根据调查结果，向同事说明调整计划的理由。",
    },
    words: [
      {
        id: "v1-other-sense", word: "予定", reading: "よてい",
        chineseGloss: "预定", glosses: [], sourceName: "JMdict", sourceVersion: "2026-09",
      },
      {
        id: "v1",
        word: "予定",
        reading: "よてい",
        chineseGloss: "计划",
        glosses: [],
        sourceName: "JMdict",
        sourceVersion: "2026-09",
      },
    ],
    supportingGrammar: { id: "g2", title: "～ために", level: "N4" },
    expressions: [
      {
        id: "expression1",
        sentence: "調査を踏まえて予定を変えます。",
        furigana: "調査[ちょうさ]を踏[ふ]まえて予定[よてい]を変[か]えます。",
        translationZh: "根据调查改变计划。",
      },
    ],
    phrases: [],
    referenceHidden: false,
  };
  const result = {
    id: "result1",
    totalScore: 90,
    grammarScore: 30,
    connectionScore: 20,
    completenessScore: 20,
    naturalnessScore: 12,
    vocabularyScore: 8,
    isCorrect: true,
    usedTargetGrammar: true,
    targetGrammarCorrect: true,
    resultLevel: "CORRECT",
    errorSpans: [],
    correctedSentence: "結果を踏まえて決めます。",
    correctedSentenceFurigana: "結果[けっか]を踏[ふ]まえて決[き]めます。",
    correctedSentenceTranslationZh: "根据结果决定。",
    alternativeSentence: "結果を踏まえて予定を調整します。",
    alternativeSentenceFurigana:
      "結果[けっか]を踏[ふ]まえて予定[よてい]を調整[ちょうせい]します。",
    alternativeSentenceTranslationZh: "根据结果调整计划。",
    contentResponse: "说明依据后，对方更容易理解你的决定。",
    explanationZh: "目标语法使用正确。",
    encouragement: "表达清楚",
    diversityAdvice: "下次可以补充决定的理由，简单正确的句子同样有效。",
    nextPractice: "换成旅行场景，解释行程变化。",
    scenarioTaskCompleted: true,
    recallPolicy: {
      allowedRatings: ["FORGOT", "FUZZY", "REMEMBERED"],
      effectiveRatingCap: null,
      reason: "NONE",
      scorePolicyVersion: "ai-score-v1",
    },
  };
  const grammar = {
    id: "g1",
    title: "～を踏まえて",
    level: "N1",
    chineseExplanation: "以……为依据",
    connectionRule: "名词＋を踏まえて",
    examples: [],
    progress: [],
  };
  await page.route("**/api/v1/**", async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace("/api/v1", "");
    const headers = {
      "access-control-allow-origin": req.headers().origin ?? "*",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET,POST,PUT,OPTIONS",
    };
    if (req.method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    let data: unknown = {};
    let status = 200;
    if (path === "/me")
      data = {
        id: "u1",
        displayName: "测试用户",
        timezone: "Asia/Tokyo",
        colorTheme: "sunshine",
        targetLevel: "N1",
      };
    else if (path === "/study-plans")
      data = {
        items: [{ id: "p1", level: "N1", status: "ACTIVE" }],
        nextCursor: null,
      };
    else if (
      path === "/study-sessions/s1" ||
      path === "/study-sessions/s1/reveal"
    ) {
      const reveal = path.endsWith("/reveal");
      if (reveal) reveals++;
      data = {
        id: "s1",
        grammarId: "g1",
        mode: "REVIEW",
        status: "ACTIVE",
        trainingMode: "TRANSFER",
        scenarioId: "work",
        attempts: [],
        hintRevealCount: reveals,
        grammar: reveal
          ? grammar
          : { ...grammar, chineseExplanation: "", connectionRule: null },
        timer: {
          phase: "FOCUS",
          phaseStartedAt: new Date().toISOString(),
          phaseEndsAt: new Date(Date.now() + 600000).toISOString(),
          focusMinutes: 10,
          breakMinutes: 5,
        },
        trainingContext: reveal
          ? context
          : {
              ...context,
              referenceHidden: true,
              expressions: [{ id: "expression1", hidden: true }],
            },
      };
    } else if (path === "/sentence-reviews" && req.method() === "POST")
      data = { reviewId: "review1" };
    else if (path === "/sentence-reviews/review1")
      data = { id: "review1", status: "COMPLETED", retryCount: 0, result };
    else if (path === "/expressions" && req.method() === "POST") {
      saves.push(req.postDataJSON());
      data = { id: "saved1" };
    } else if (path === "/expressions") {
      expressionReads++;
      data = [];
    } else if (path.endsWith("/activity")) data = {};
    else status = 404;
    await route.fulfill({
      status,
      headers,
      contentType: "application/json",
      body: JSON.stringify({ data }),
    });
  });
  await page.goto("/study/s1");
  await expect(
    page.getByText("根据调查结果，向同事说明调整计划的理由。"),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "跨场景运用" })).toBeVisible();
  await expect(
    page.getByText("調査を踏まえて予定を変えます。", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "收藏生词" })).toHaveCount(1);
  await expect(page.getByText(/来源：JMdict/)).toHaveCount(0);
  await expect(page.getByText(/2026-09/)).toHaveCount(0);
  expect(reveals).toBe(0);
  expect(expressionReads).toBe(0);
  await page.getByRole("button", { name: "查看参考表达（使用提示）" }).click();
  await expect(page.getByText("以……为依据", { exact: true })).toBeVisible();
  await page.getByText("参考表达与短句素材", { exact: true }).click();
  await expect(
    page.getByText("根据调查改变计划。", { exact: true }),
  ).toBeVisible();
  expect(reveals).toBe(1);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "查看参考表达（使用提示）" }),
  ).toBeVisible();
  await expect(
    page.getByText("根据调查改变计划。", { exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("日语句子").fill("結果を踏まえて決めます。");
  await page.getByRole("button", { name: "提交给 AI 批改" }).click();
  await expect(page.getByRole("heading", { name: "内容回应" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "拓展示例" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "后续练习" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "表达变化建议" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "收藏表达", exact: true })).toHaveCount(0);
  expect(saves).toEqual([]);
  expect(expressionReads).toBe(0);
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: `/tmp/jlpt-v2-training-${testInfo.project.name}.png`,
    fullPage: true,
  });
});

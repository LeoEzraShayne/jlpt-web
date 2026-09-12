import type { Page } from "@playwright/test";
import type { LearningVocabulary, VocabularyPractice } from "../src/components/vocabulary-learning/types";

export function practiceFixture(overrides: Partial<VocabularyPractice> = {}): VocabularyPractice {
  return { id: "vp1", vocabularyId: "v1", grammarId: "g1", linkedStudySessionId: null,
    status: "READY", unknownAtStart: false, hintLevel: 0, hints: {},
    createdAt: "2026-09-12T00:00:00Z", promptZh: "向同事说明明天要提前确认会议安排。",
    grammar: { id: "g1", title: "～ておく" }, ...overrides };
}
export async function mockVocabularyLearning(page: Page, overrides: Partial<VocabularyPractice> = {}) {
  const state = {
    practice: practiceFixture(overrides),
    actions: [] as string[], answers: [] as Array<{ sentence: string; requestKey: string }>,
    starts: [] as Record<string, string>[], hintBodies: [] as unknown[], queries: [] as string[],
    failAnswerOnce: false, failHintOnce: false, retryLimit: false, noDue: false, generatingReads: 0, assessingReads: 0,
    words: ["v1", "v2", "v3"].map((id, index): LearningVocabulary => ({
      id, word: "予定", reading: "よてい", senseKey: `${index}`, partOfSpeech: ["noun (common) (futsuumeishi)"],
      chineseGloss: ["计划；预定", "安排；日程", "预期"][index], chineseGlossSource: "词典翻译",
      glosses: [{ language: "eng", text: "plan" }], level: "N1", levelSource: "参考词表",
      sourceName: "JMdict", sourceVersion: "2026", sourceUrl: null, license: "CC-BY-SA", ownerId: null, validationStatus: "VALIDATED",
      learning: { id: `l${id}`, vocabularyId: id, knowledge: "KNOWN", practiceEnabled: true,
        paused: false, manualRevision: 1, nextReviewAt: "2026-09-12T00:00:00Z", lastPracticedAt: null, lastOutcome: null },
    })),
  };
  await page.route("**/api/v1/**", async route => {
    const req = route.request(), url = new URL(req.url()), path = url.pathname.replace("/api/v1", "");
    const headers = { "access-control-allow-origin": req.headers().origin ?? "*", "access-control-allow-credentials": "true", "access-control-allow-headers": "content-type", "access-control-allow-methods": "GET,POST,PATCH,PUT,OPTIONS" };
    if (req.method() === "OPTIONS") { await route.fulfill({ status: 204, headers }); return; }
    let data: unknown = {}, nextCursor: string | null = null;
    if (path === "/me") data = { id: "u1", displayName: "词汇测试", timezone: "Asia/Tokyo", targetLevel: "N1", role: "USER" };
    else if (path === "/study-plans") data = { items: [{ id: "plan", level: "N1", status: "PAUSED" }] };
    else if (path === "/vocabulary-learning/summary") data = { unknownCount: 1, practiceCount: 3, rememberedCount: 1, dueCount: state.noDue ? 0 : 2, completedTodayCount: 1 };
    else if (path === "/vocabulary" || path === "/vocabulary-learning") {
      state.queries.push(url.search);
      data = url.searchParams.get("query") === "无结果" ? [] : state.words;
    } else if (path.endsWith("/learning")) {
      const word = state.words.find(word => path.includes(`/${word.id}/`))!;
      const action = req.postDataJSON().action; state.actions.push(`${word.id}:${action}`);
      const learning = word.learning!; learning.manualRevision++;
      if (action === "UNKNOWN") { learning.knowledge = "UNKNOWN"; learning.practiceEnabled = false; }
      if (action === "PRACTICE") { if (learning.knowledge === "UNKNOWN") learning.knowledge = "KNOWN"; learning.practiceEnabled = true; }
      if (action === "REMEMBERED") learning.knowledge = "REMEMBERED";
      if (action === "PAUSE" || action === "RESUME") learning.paused = action === "PAUSE";
      if (action === "STOP_PRACTICE") learning.practiceEnabled = false;
      data = learning;
    } else if (path.endsWith("/learning-history")) {
      data = [{ ...state.practice, id: url.searchParams.has("cursor") ? "older" : "vp1", status: "COMPLETED" }];
      nextCursor = url.searchParams.has("cursor") ? null : "older";
    } else if (path === "/vocabulary-practices" && req.method() === "POST") {
      state.starts.push(req.postDataJSON());
      if (state.noDue) { await route.fulfill({ status: 404, headers, json: { error: { code: "NOT_FOUND", message: "无到期词汇" } } }); return; }
      data = state.practice;
    } else if (path.endsWith("/hint")) {
      state.hintBodies.push(req.postDataJSON());
      if (state.failHintOnce) { state.failHintOnce = false; await route.fulfill({ status: 503, headers, json: { error: { message: "提示暂不可用" } } }); return; }
      state.practice.hintLevel = Math.min(4, state.practice.hintLevel + 1);
      state.practice.hints = {
        meaning: "计划；预定", ...(state.practice.hintLevel >= 2 ? { reading: "よてい" } : {}),
        ...(state.practice.hintLevel >= 3 ? { word: "予定" } : {}),
        ...(state.practice.hintLevel >= 4 ? { chunks: [{ id: "c2", text: "予定を" }, { id: "c3", text: "確認しておきます。" }, { id: "c1", text: "明日の" }] } : {}),
      }; data = state.practice;
    } else if (path.endsWith("/answer")) {
      state.answers.push(req.postDataJSON());
      if (state.failAnswerOnce) { state.failAnswerOnce = false; await route.fulfill({ status: 503, headers, json: { error: { message: "保存暂不可用" } } }); return; }
      state.practice.answer = req.postDataJSON().sentence; state.practice.status = "ASSESSING"; data = state.practice;
    } else if (path.endsWith("/retry")) {
      if (state.retryLimit) { await route.fulfill({ status: 409, headers, json: { error: { code: "RETRY_LIMIT", message: "retry limit reached" } } }); return; }
      state.practice.status = state.practice.answer ? "ASSESSING" : "QUEUED"; data = state.practice;
    } else if (path === "/vocabulary-practices/vp1") {
      if (["QUEUED", "GENERATING"].includes(state.practice.status) && ++state.generatingReads >= 2) state.practice.status = "READY";
      if (state.practice.status === "ASSESSING" && ++state.assessingReads >= 2) {
        state.practice.status = "COMPLETED"; state.practice.completedAt = "2026-09-12T02:00:00Z";
        state.practice.result = { outcome: state.practice.unknownAtStart || state.practice.hintLevel ? "PROMPTED" : "INDEPENDENT", usedTarget: true, targetCorrect: true, meaningCorrect: true, readingCorrect: null,
          explanationZh: "当前释义使用准确。", corrections: [], correctedSentence: state.practice.answer!, correctedFurigana: "明日[あした]の予定[よてい]を確認[かくにん]しておきます。", correctedTranslationZh: "事先确认明天的安排。" };
        state.practice.reference = { sentence: "予定を確認しておきます。", furigana: "予定[よてい]を確認[かくにん]しておきます。", translationZh: "提前确认安排。" };
        state.practice.nextReviewAt = "2026-09-15T00:00:00Z";
      } data = state.practice;
    } else if (path === "/study-sessions/s1") data = { id: "s1", mode: "PRACTICE", status: "ACTIVE", attempts: [], grammar: { id: "g1", title: "～ておく", level: "N1", chineseExplanation: "事先做", connectionRule: "动词て形", examples: [] } };
    else if (path === "/dashboard/today") data = { tasks: [], estimatedMinutes: 0, requiredReviewRemaining: 0, summary: { totalGrammar: 1, masteredGrammar: 0, learnedGrammar: 0, reviewCount: 0, overdueReviewCount: 0, completedCount: 0 }, planning: { dueUnscheduledCount: 0 }, levels: [] };
    await route.fulfill({ headers, json: { data, meta: { nextCursor } } });
  });
  return state;
}

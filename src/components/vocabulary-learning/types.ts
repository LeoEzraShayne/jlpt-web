import type { VocabularyEntry } from "@/lib/api/types";

export type LearningAction = "UNKNOWN" | "PRACTICE" | "REMEMBERED" | "PAUSE" | "RESUME" | "STOP_PRACTICE";
export type LearningList = "UNKNOWN" | "PRACTICE" | "REMEMBERED" | "DUE";
export type VocabularyLearning = {
  id: string; userId?: string; vocabularyId: string;
  knowledge: "UNKNOWN" | "KNOWN" | "REMEMBERED";
  practiceEnabled: boolean; paused: boolean; manualRevision: number;
  nextReviewAt?: string | null; lastPracticedAt?: string | null;
  lastOutcome?: string | null; createdAt?: string; updatedAt?: string;
};
// Structural extension keeps this feature independent of the shared API type rollout.
export type LearningVocabulary = VocabularyEntry & { learning?: VocabularyLearning | null };
export type LearningSummary = {
  unknownCount: number; practiceCount: number; rememberedCount: number;
  dueCount: number; completedTodayCount: number;
};
export type PracticeOutcome = "INDEPENDENT" | "PROMPTED" | "INCORRECT" | "UNVERIFIED";
export type VocabularyPractice = {
  explanationLocale?: "zh" | "en";
  reviewAttempts?: Array<{ id: string; ordinal: number; requestKey: string; status: "QUEUED" | "COMPLETED" | "FAILED"; answer: string; result: unknown; errorCode?: string | null; completedAt?: string | null }>;
  id: string; vocabularyId: string; grammarId: string | null;
  linkedStudySessionId: string | null;
  status: "QUEUED" | "GENERATING" | "READY" | "ASSESSING" | "COMPLETED" | "FAILED";
  unknownAtStart: boolean; hintLevel: number; errorCode?: string | null;
  createdAt: string; completedAt?: string | null; promptZh?: string;
  grammar?: { id: string; title: string } | null;
  hints: { meaning?: string; reading?: string; word?: string; chunks?: Array<{ id: string; text: string }> };
  learningPreview?: { word: string; reading: string; chineseGloss: string; exampleSentence: string; exampleFurigana: string; exampleTranslationZh: string };
  answer?: string | null;
  result?: {
    outcome: PracticeOutcome; meaningCorrect: boolean | null; readingCorrect: boolean | null;
    usedTarget: boolean; targetCorrect: boolean | null; explanationZh: string;
    corrections: Array<{ text: string; replacement: string; reason: string }>;
    correctedSentence: string; correctedFurigana: string; correctedTranslationZh: string;
  } | null;
  reference?: { sentence: string; furigana: string; translationZh: string };
  nextReviewAt?: string | null;
};

export const listLabels: Record<LearningList, string> = {
  UNKNOWN: "根本不会", PRACTICE: "认识但想练熟", REMEMBERED: "已记住", DUE: "待复习",
};
export const outcomeLabels: Record<PracticeOutcome, string> = {
  INDEPENDENT: "独立回忆", PROMPTED: "辅助练习", INCORRECT: "需要再练", UNVERIFIED: "暂未验证",
};
export function reviewDate(value?: string | null) {
  if (!value) return "暂无安排";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "暂无安排" : date.toLocaleDateString("zh-CN");
}
export function isPracticePending(practice?: VocabularyPractice) {
  return !!practice && ["QUEUED", "GENERATING", "ASSESSING"].includes(practice.status);
}

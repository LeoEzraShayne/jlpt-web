import { describe, expect, it } from "vitest";
import { vocabularySnapshot } from "./localized-practice";
import type { VocabularyPractice } from "./types";
const practice: VocabularyPractice = { id: "p", vocabularyId: "v", grammarId: null, linkedStudySessionId: null, status: "READY", unknownAtStart: false, hintLevel: 0, createdAt: "2026-09-13T00:00:00Z", hints: {}, promptZh: "旧场景" };
describe("vocabulary language snapshots", () => {
  it("retains old Chinese history even if translations happen to exist", () => {
    const original = { ...practice, localized: { locale: "en" as const, prompt: "New scenario" } };
    expect(vocabularySnapshot(original)).toBe(original);
  });
  it("uses English scenario but never materializes a locked hint or reference", () => {
    const value = vocabularySnapshot({ ...practice, explanationLocale: "en", localized: { locale: "en", prompt: "Describe your plans", meaningHint: "plan", referenceTranslation: "Secret reference" } });
    expect(value.promptZh).toBe("Describe your plans");
    expect(value.hints.meaning).toBeUndefined();
    expect(value.reference).toBeUndefined();
  });
  it("preserves Japanese and uses approved English preview translations", () => {
    const value = vocabularySnapshot({ ...practice, explanationLocale: "en", unknownAtStart: true, learningPreview: { word: "予定", reading: "よてい", chineseGloss: "安排", exampleSentence: "予定があります。", exampleFurigana: "", exampleTranslationZh: "有安排。", localized: { locale: "en", meaning: "plan", exampleTranslation: "I have plans." } } });
    expect(value.learningPreview?.word).toBe("予定");
    expect(value.learningPreview?.chineseGloss).toBe("plan");
    expect(value.learningPreview?.exampleTranslationZh).toBe("I have plans.");
  });
  it("makes unavailable English explicit instead of falling back to Chinese", () => {
    expect(vocabularySnapshot({ ...practice, explanationLocale: "en" }).promptZh).toBe("English feedback not yet available.");
  });
});

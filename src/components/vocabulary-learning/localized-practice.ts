import type { VocabularyPractice } from "./types";
const missing = "English feedback not yet available.";
/** Use saved session language. UI preference changes never reinterpret historical feedback. */
export function vocabularySnapshot(practice: VocabularyPractice): VocabularyPractice {
  if (practice.explanationLocale !== "en") return practice;
  const copy = practice.localized?.locale === "en" ? practice.localized : null;
  const feedback = practice.result?.localizedFeedback?.locale === "en" ? practice.result.localizedFeedback : null;
  const preview = practice.learningPreview?.localized?.locale === "en" ? practice.learningPreview.localized : null;
  return {
    ...practice,
    promptZh: practice.promptZh ? copy?.prompt ?? missing : undefined,
    hints: { ...practice.hints, ...(practice.hintLevel >= 1 && practice.hints.meaning ? { meaning: copy?.meaningHint ?? missing } : {}) },
    learningPreview: practice.learningPreview ? { ...practice.learningPreview, chineseGloss: preview?.meaning ?? missing, exampleTranslationZh: preview?.exampleTranslation ?? missing } : undefined,
    result: practice.result ? { ...practice.result, explanationZh: feedback?.explanation ?? missing, correctedTranslationZh: feedback?.correctedTranslation ?? missing, corrections: feedback?.corrections ?? practice.result.corrections.map(correction => ({ ...correction, reason: missing })) } : practice.result,
    reference: practice.reference ? { ...practice.reference, translationZh: copy?.referenceTranslation ?? missing } : undefined,
  };
}

import type { GrammarPoint, LocalizedContent, ReviewResult, VocabularyEntry } from "@/lib/api/types";
import type { AppLocale } from "@/lib/api/sentence-lab";
import { translate } from "./locale-store";
export function localizedText(content: LocalizedContent | null | undefined, field: NonNullable<LocalizedContent["fields"]> extends Partial<Record<infer K, unknown>> ? K : never, original: string | null | undefined, locale: AppLocale): string {
  if (locale === "zh") return original ?? "";
  if (content?.resolvedLocale === "en" && content.status === "VALIDATED" && content.fields) return content.fields[field] ?? "";
  return "English translation not yet available.";
}
export function localizeGrammar(grammar: GrammarPoint, locale: AppLocale): GrammarPoint {
  if (locale === "zh") return grammar;
  return { ...grammar, title: grammar.displayTitle ?? grammar.title, chineseExplanation: localizedText(grammar.localized, "explanation", grammar.chineseExplanation, locale), connectionRule: localizedText(grammar.localized, "connectionRule", grammar.connectionRule, locale), usageScene: localizedText(grammar.localized, "usageScene", grammar.usageScene, locale), commonErrors: localizedText(grammar.localized, "commonErrors", grammar.commonErrors, locale), examples: grammar.examples.map(example => ({ ...example, translation: localizedText(example.localized, "translation", example.translation, locale) })), relationMembers: grammar.relationMembers?.map(entry => ({ ...entry, group: { ...entry.group, notes: localizedText(entry.group.localized, "notes", entry.group.notes, locale) } })) };
}
export function feedbackSnapshot(result: ReviewResult): ReviewResult {
  const feedback = result.explanationLocale === "en" ? result.localizedFeedback : null;
  return feedback ? { ...result, explanationZh: feedback.explanation, correctedSentenceTranslationZh: feedback.correctedSentenceTranslation, encouragement: feedback.encouragement, errorSpans: feedback.errorSpans, contentResponse: feedback.contentResponse } : result;
}
export function vocabularyMeaning(word: Pick<VocabularyEntry, "chineseGloss" | "glosses">, locale: AppLocale) {
  if (locale === "zh") return word.chineseGloss?.trim() || word.glosses.filter(gloss => /^(zh(?:[-_].*)?|zho|chi)$/i.test(gloss.language)).map(gloss => gloss.text).join("；") || translate("中文释义待补充", "zh");
  return word.glosses.filter(gloss => /^(en(?:[-_].*)?|eng)$/i.test(gloss.language)).map(gloss => gloss.text).join("; ") || "English meaning not yet available.";
}

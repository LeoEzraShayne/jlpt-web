import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { ReviewResult } from "@/lib/api/types";
import { setLocale } from "@/lib/i18n/locale-store";
import { ReviewResultCard } from "./review-result-card";

const result: ReviewResult = {
  id: "r", totalScore: 95, grammarScore: 30, connectionScore: 20, completenessScore: 20,
  naturalnessScore: 15, vocabularyScore: 10, isCorrect: true, resultLevel: "CORRECT",
  errorSpans: [], correctedSentence: "本を読みます。", correctedSentenceFurigana: null,
  correctedSentenceTranslationZh: "I read a book.", explanationZh: "A natural sentence.",
  encouragement: "Keep practicing.", usedTargetGrammar: false, targetGrammarCorrect: false,
  alternativeSentence: "音楽を聞きながら本を読みます。", alternativeSentenceFurigana: null,
};
afterEach(() => { cleanup(); setLocale("zh"); });
it("labels historical scores and examples without applying new scoring semantics", () => {
  render(<ReviewResultCard result={{ ...result, scorePolicyVersion: "ai-score-v2" }} />);
  expect(screen.getByText("本次练习得分 / 100")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "拓展示例" })).toBeInTheDocument();
  expect(screen.queryByText("目标练习示例")).not.toBeInTheDocument();
});
it("shows target failure before encouragement and renders plain Japanese when annotations are unavailable", () => {
  setLocale("en");
  const { container } = render(<ReviewResultCard result={{ ...result, scorePolicyVersion: "sentence-quality-v1" }} />);
  expect(screen.getByRole("heading", { name: "Practice target not achieved" })).toBeInTheDocument();
  expect(screen.getByText("Sentence quality / 100")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Target practice example" })).toBeInTheDocument();
  expect(screen.getByText(result.correctedSentence)).toBeInTheDocument();
  expect(container.querySelector("ruby")).toBeNull();
  expect(screen.getByText(/This attempt does not provide evidence of target mastery/)).toBeInTheDocument();
});

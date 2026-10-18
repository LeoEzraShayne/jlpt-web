import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { setLocale } from "@/lib/i18n/locale-store";
import { PracticeFeedback } from "./practice-feedback";
import { vocabularySnapshot } from "./localized-practice";
import type { VocabularyPractice } from "./types";

function fixture(locale: "zh" | "en"): VocabularyPractice {
  const explanation = locale === "en" ? "The intended meaning needs more context." : "还需要上下文来确认词义。";
  const reason = locale === "en" ? "Use the polite past form here." : "这里改用礼貌体过去式。";
  const corrections = [{ text: "上げたです", replacement: "上げました", reason }];
  return {
    id: "p1", vocabularyId: "v1", grammarId: null, linkedStudySessionId: null,
    status: "COMPLETED", unknownAtStart: false, hintLevel: 0, hints: {},
    createdAt: "2026-09-17T00:00:00Z", explanationLocale: locale,
    answer: "もう上げたです。",
    result: {
      senseVerificationReason: "INSUFFICIENT_CONTEXT",
      outcome: "UNVERIFIED", usedTarget: true, targetCorrect: null, meaningCorrect: null, readingCorrect: null,
      explanationZh: explanation, corrections,
      correctedSentence: "もう上げました。", correctedFurigana: null, correctedTranslationZh: "",
      localizedFeedback: locale === "en" ? { locale, explanation, corrections, correctedTranslation: "" } : null,
    },
  };
}

afterEach(() => { cleanup(); setLocale("zh"); });

describe("insufficient vocabulary sense context", () => {
  it.each([
    ["zh", "词汇反馈 · 词义未确认", "原句信息不足，暂不提供确定译文", "本次不延长复习间隔。"],
    ["en", "Vocabulary feedback · Meaning not confirmed", "The original sentence lacks enough context to provide a definite translation.", "The review interval is not extended."],
  ] as const)("shows the %s uncertainty state without hiding corrections or treating an empty translation as missing feedback", (locale, title, notice, interval) => {
    setLocale(locale);
    const practice = fixture(locale);
    const { container } = render(<PracticeFeedback practice={practice} />);
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(notice)).toBeInTheDocument();
    expect(screen.getByText(interval)).toBeInTheDocument();
    expect(screen.getByText(practice.answer!)).toBeInTheDocument();
    expect(screen.getByText("もう上げました。")).toBeInTheDocument();
    expect(screen.getByText(practice.result!.corrections[0].reason)).toBeInTheDocument();
    expect(vocabularySnapshot(practice).result?.correctedTranslationZh).toBe("");
    expect(screen.queryByText("English feedback not yet available.")).not.toBeInTheDocument();
    expect(Array.from(container.querySelectorAll("p")).some(p => !p.textContent?.trim())).toBe(false);
  });

  it("keeps unmarked historical English results and their existing missing-feedback fallback", () => {
    setLocale("en");
    const practice = fixture("en");
    delete practice.result!.senseVerificationReason;
    practice.result!.localizedFeedback!.correctedTranslation = "I have already raised it.";
    const view = render(<PracticeFeedback practice={practice} />);
    expect(screen.getByText("I have already raised it.")).toBeInTheDocument();
    expect(screen.queryByText("Meaning not confirmed", { exact: false })).not.toBeInTheDocument();
    practice.result!.localizedFeedback = null;
    view.rerender(<PracticeFeedback practice={practice} />);
    expect(screen.getAllByText("English feedback not yet available.").length).toBeGreaterThan(0);
    expect(vocabularySnapshot(practice).result?.correctedTranslationZh).toBe("English feedback not yet available.");
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import type { CompletionNotice } from "@/lib/api/types";
import {
  COMPLETION_NOTICE_KEY,
  consumeCompletionNotice,
  formatStudyDate,
  getNewGrammarDescription,
  saveCompletionNotice,
} from "./study-display";

describe("study display helpers", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("formats date keys without UTC conversion", () => {
    expect(formatStudyDate("2026-08-15")).toBe("8月15日");
    expect(formatStudyDate("2026-08-15", true)).toBe("2026年8月15日");
  });

  it("consumes a completion notice only once", () => {
    const notice: CompletionNotice = {
      submittedRating: "REMEMBERED",
      effectiveRating: "FUZZY",
      nextReviewOn: "2026-08-15",
    };
    saveCompletionNotice(notice);
    expect(window.sessionStorage.getItem(COMPLETION_NOTICE_KEY)).toBeTruthy();
    expect(consumeCompletionNotice()).toEqual(notice);
    expect(consumeCompletionNotice()).toBeNull();
  });

  it("prompts first-time learners without claiming a review was completed", () => {
    expect(
      getNewGrammarDescription({
        newLearningUnlocked: true,
        tasks: [{ type: "LEARN" }],
      }),
    ).toBe("请开始第1次学习");
  });

  it("mentions a completed review only when review tasks existed", () => {
    expect(
      getNewGrammarDescription({
        newLearningUnlocked: true,
        tasks: [{ type: "REVIEW" }, { type: "LEARN" }],
      }),
    ).toBe("复习已完成，可以开始新内容");
    expect(
      getNewGrammarDescription({
        newLearningUnlocked: false,
        tasks: [{ type: "REVIEW" }, { type: "LEARN" }],
      }),
    ).toBe("先巩固到期内容，再学习新语法");
  });
});

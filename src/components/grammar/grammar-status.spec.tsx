import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GrammarStatus, learningStatus } from "./grammar-status";
import type { Progress } from "@/lib/api/types";

const progress: Progress = {
  id: "progress-1",
  status: "MASTERED",
  stage: 3,
  masteryScore: 80,
  learningState: {
    status: "DUE",
    stabilityEstimateDays: 8,
    difficultyEstimate: 4,
    estimatedRetrievability: 0.88,
    nextReviewOn: "2026-08-12",
    algorithmVersion: "legacy-v1",
    isEstimate: true,
  },
};

describe("GrammarStatus", () => {
  it("prefers the dynamic learning state over the stored progress label", () => {
    expect(learningStatus(progress)).toBe("DUE");
    render(<GrammarStatus progress={progress} />);
    expect(screen.getByText("今天复习")).toBeInTheDocument();
  });

  it("describes mastered content as stable instead of permanent", () => {
    render(<GrammarStatus progress={{ ...progress, learningState: undefined }} />);
    expect(screen.getByText("较稳定")).toBeInTheDocument();
  });
});

import { describe, expect, it } from "vitest";
import { historyScoreTone } from "./history-score";

describe("historyScoreTone", () => {
  it.each([
    [0, "text-destructive"],
    [59, "text-destructive"],
    [60, "text-sky-600"],
    [79, "text-sky-600"],
    [80, "text-success"],
    [100, "text-success"],
  ])("maps %i points to %s", (score, tone) => {
    expect(historyScoreTone(score)).toBe(tone);
  });
});

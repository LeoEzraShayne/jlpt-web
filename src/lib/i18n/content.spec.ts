import { describe, expect, it } from "vitest";
import { localizedText, feedbackSnapshot, vocabularyMeaning } from "./content";
import { translate } from "./locale-store";
import type { ReviewResult } from "@/lib/api/types";
describe("language boundaries", () => {
  it("never labels missing or stale Chinese content as an English translation", () => {
    expect(localizedText(null, "explanation", "中文原文", "en")).toBe("English translation not yet available.");
    expect(localizedText({ requestedLocale: "en", resolvedLocale: "en", status: "STALE", sourceHash: "old", fields: { explanation: "Outdated" } }, "explanation", "中文原文", "en")).not.toBe("Outdated");
    expect(localizedText(null, "explanation", "中文原文", "zh")).toBe("中文原文");
  });
  it("uses original English vocabulary glosses without overwriting Chinese additions", () => {
    const word = { chineseGloss: "安排", glosses: [{ language: "eng", text: "plan; schedule" }] };
    expect(vocabularyMeaning(word, "en")).toBe("plan; schedule");
    expect(vocabularyMeaning(word, "zh")).toBe("安排");
    expect(word.chineseGloss).toBe("安排");
  });
  it("keeps Japanese and interpolates UI copy", () => {
    expect(translate("予定があります。", "en")).toBe("予定があります。");
    expect(translate("今日免费任务剩余 3/5", "en")).toBe("Free tasks remaining today: 3/5");
  });
  it("selects feedback by the saved session language, not current interface language", () => {
    const result = { explanationLocale: "zh", explanationZh: "旧中文反馈", localizedFeedback: { explanation: "English feedback", correctedSentenceTranslation: null, encouragement: "Good", errorSpans: [] } } as unknown as ReviewResult;
    expect(feedbackSnapshot(result).explanationZh).toBe("旧中文反馈");
    expect(feedbackSnapshot({ ...result, explanationLocale: "en" }).explanationZh).toBe("English feedback");
  });
});

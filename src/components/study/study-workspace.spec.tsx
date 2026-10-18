import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { apiFetcher, apiRequest } from "@/lib/api/client";
import type { AiReviewJob, ReviewResult } from "@/lib/api/types";
import { StudyWorkspace } from "./study-workspace";

vi.mock("@/lib/api/client", async original => ({ ...await original<typeof import("@/lib/api/client")>(), apiFetcher: vi.fn(), apiRequest: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/components/focus/focus-cycle-display", () => ({ FocusCycleCard: () => null }));
vi.mock("./training-panel", () => ({ TrainingPanel: () => null }));
const session = {
  id: "s", grammarId: "g", mode: "REVIEW", status: "ACTIVE",
  grammar: { id: "g", title: "ながら", level: "N4", chineseExplanation: "一边", examples: [] },
  attempts: [{ id: "a", sentence: "歩きながら話します。", aiJob: { id: "j" } }],
};
function mount(job: AiReviewJob) {
  vi.mocked(apiFetcher).mockImplementation(async key => String(key).includes("sentence-reviews") ? job : session);
  return render(<SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}><StudyWorkspace sessionId="s" /></SWRConfig>);
}
beforeEach(() => vi.resetAllMocks());
afterEach(() => { cleanup(); vi.useRealTimers(); });

it("restores a failed job after refresh and locks a double-clicked retry", async () => {
  const job: AiReviewJob = { id: "j", status: "FAILED", retryCount: 1, canRetry: true, errorCode: "AI_REVIEW_DEADLINE" };
  mount(job);
  const retry = await screen.findByRole("button", { name: "重新批改" });
  expect(screen.getByText("AI 批改响应超时，请稍后重新批改。")).toBeInTheDocument();
  let resolve!: (value: { data: AiReviewJob }) => void;
  vi.mocked(apiRequest).mockImplementation(() => new Promise(done => { resolve = done as typeof resolve; }));
  fireEvent.click(retry); fireEvent.click(retry);
  expect(apiRequest).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "正在重新批改…" })).toBeDisabled();
  const queued = { ...job, status: "QUEUED" as const };
  vi.mocked(apiFetcher).mockResolvedValue(queued);
  await act(async () => resolve({ data: queued }));
  expect(screen.getByRole("button", { name: "AI 正在批改…" })).toBeDisabled();
});
it("disables manual retry when the server marks its budget exhausted", async () => {
  mount({ id: "j", status: "FAILED", retryCount: 4, canRetry: false });
  expect(await screen.findByRole("button", { name: "重新批改" })).toBeDisabled();
  expect(screen.getByText("本次批改已达到重试次数上限。")).toBeInTheDocument();
});
it("polls an active review every 1000ms rather than waiting for SWR's default dedupe interval", async () => {
  vi.useFakeTimers();
  mount({ id: "j", status: "PROCESSING", retryCount: 1 });
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  const reviewCalls = () => vi.mocked(apiFetcher).mock.calls.filter(call => String(call[0]).includes("sentence-reviews")).length;
  const before = reviewCalls();
  await act(async () => { await vi.advanceTimersByTimeAsync(1001); });
  expect(reviewCalls()).toBeGreaterThan(before);
});
it("resets fast polling when manually retrying the same job after a long failed wait", async () => {
  vi.useFakeTimers();
  const job: AiReviewJob = { id: "j", status: "FAILED", retryCount: 1, canRetry: true };
  mount(job);
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  await act(async () => { await vi.advanceTimersByTimeAsync(31_000); });
  const processing = { ...job, status: "PROCESSING" as const };
  vi.mocked(apiRequest).mockResolvedValueOnce({ data: processing });
  vi.mocked(apiFetcher).mockResolvedValue(processing);
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "重新批改" })));
  const before = vi.mocked(apiFetcher).mock.calls.length;
  await act(async () => { await vi.advanceTimersByTimeAsync(1001); });
  expect(vi.mocked(apiFetcher).mock.calls.length).toBeGreaterThan(before);
  expect(screen.getByRole("button", { name: "AI 正在批改…" })).toBeDisabled();
});

const qualityResult: ReviewResult = {
  id: "result", totalScore: 95, grammarScore: 30, connectionScore: 20,
  completenessScore: 20, naturalnessScore: 15, vocabularyScore: 10,
  isCorrect: true, resultLevel: "CORRECT", errorSpans: [],
  correctedSentence: "歩きながら話します。", correctedSentenceFurigana: null,
  explanationZh: "句子自然。", encouragement: "继续练习。",
  scorePolicyVersion: "sentence-quality-v1", usedTargetGrammar: false, targetGrammarCorrect: false,
};
it.each([
  { usedTargetGrammar: false, targetGrammarCorrect: false, reason: "TARGET_GRAMMAR_MISSING", title: "本次目标未完成", allowedRatings: ["FORGOT"] },
  { usedTargetGrammar: null, targetGrammarCorrect: null, reason: "TARGET_GRAMMAR_UNVERIFIED", title: "本次目标尚未确认", allowedRatings: ["FORGOT", "FUZZY"] },
] as const)("keeps a high quality score separate from target evidence: $reason", async state => {
  mount({ id: "j", status: "COMPLETED", retryCount: 1, result: {
    ...qualityResult, usedTargetGrammar: state.usedTargetGrammar, targetGrammarCorrect: state.targetGrammarCorrect,
    recallPolicy: { allowedRatings: [...state.allowedRatings], effectiveRatingCap: state.reason === "TARGET_GRAMMAR_MISSING" ? "FORGOT" : "FUZZY", reason: state.reason, scorePolicyVersion: "sentence-quality-v1" },
  } });
  expect(await screen.findByRole("heading", { name: state.title })).toBeInTheDocument();
  expect(screen.getByText("95")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "记住了" })).not.toBeInTheDocument();
  if (state.reason === "TARGET_GRAMMAR_MISSING") expect(screen.queryByRole("button", { name: "有些模糊" })).not.toBeInTheDocument();
  const revise = screen.getByRole("button", { name: "修改后重试" });
  fireEvent.click(revise);
  expect(screen.getByText("请重新写一句，再提交批改。")).toBeInTheDocument();
});

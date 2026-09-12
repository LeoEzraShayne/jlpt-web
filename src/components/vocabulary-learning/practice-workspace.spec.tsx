import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetcher, apiRequest } from "@/lib/api/client";
import { VocabularyPracticeWorkspace } from "./practice-workspace";
import { PracticeFeedback } from "./practice-feedback";
import type { VocabularyPractice } from "./types";

vi.mock("@/lib/api/client", () => ({ apiFetcher: vi.fn(), apiRequest: vi.fn(), ApiError: class extends Error {} }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
const fixture = (overrides: Partial<VocabularyPractice> = {}): VocabularyPractice => ({
  id: "p1", vocabularyId: "v1", grammarId: null, linkedStudySessionId: null,
  status: "READY", unknownAtStart: false, hintLevel: 0, hints: {},
  createdAt: "2026-09-12T00:00:00Z", promptZh: "说说明天的安排。", ...overrides,
});
function mount(data: VocabularyPractice) {
  vi.mocked(apiFetcher).mockResolvedValue(data);
  return render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}><VocabularyPracticeWorkspace id="p1" /></SWRConfig>);
}
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

describe("vocabulary evidence boundaries", () => {
  it("hides unrevealed payload fields, previews and references for known READY practices", async () => {
    mount(fixture({ hints: { meaning: "保密词义", reading: "よてい", word: "予定", chunks: [{ id: "c1", text: "秘密词块" }] },
      learningPreview: { word: "泄漏预览", reading: "秘密读音", chineseGloss: "秘密释义", exampleSentence: "秘密例句", exampleFurigana: "", exampleTranslationZh: "秘密翻译" },
      reference: { sentence: "隐藏参考", furigana: "", translationZh: "隐藏翻译" },
    }));
    await screen.findByRole("heading", { name: "词汇造句练习" });
    expect(screen.queryByText(/予定|よてい|秘密|泄漏|隐藏参考|隐藏翻译|保密词义/)).not.toBeInTheDocument();
  });
  it("does not overwrite a draft while saving a hint; double click records one hint", async () => {
    const practice = fixture(); mount(practice);
    const input = await screen.findByLabelText("日语句子");
    fireEvent.change(input, { target: { value: "正在写的日语" } });
    let finish!: (value: { data: VocabularyPractice }) => void;
    vi.mocked(apiRequest).mockImplementation(() => new Promise(resolve => { finish = resolve as typeof finish; }));
    fireEvent.click(screen.getByRole("button", { name: "查看词义提示" }));
    fireEvent.click(screen.getByRole("button", { name: "查看词义提示" }));
    await act(async () => finish({ data: { ...practice, hintLevel: 1, hints: { meaning: "安排" } } }));
    expect(input).toHaveValue("正在写的日语");
    expect(apiRequest).toHaveBeenCalledTimes(1);
    expect(apiRequest).toHaveBeenCalledWith("/vocabulary-practices/p1/hint", { method: "POST", body: "{}" });
  });
  it.each(["ASSESSING", "FAILED"] as const)("restores an immutable saved answer in %s", async status => {
    mount(fixture({ status, answer: "予定があります。" }));
    const input = await screen.findByLabelText("日语句子");
    expect(input).toHaveValue("予定があります。"); expect(input).toBeDisabled();
    expect(screen.queryByRole("button", { name: "查看词义提示" })).not.toBeInTheDocument();
  });
  it.each([
    ["LEARNING_CHANGED", "词汇标记已更新，请从清单重新开始练习"],
    ["RETRY_LIMIT", "这次练习已达到重试次数上限，请返回清单稍后重新开始。"],
  ])("replaces %s with localized recovery, without an invalid retry", async (errorCode, message) => {
    mount(fixture({ status: "FAILED", errorCode }));
    await screen.findByText(message);
    expect(screen.getByRole("link", { name: "返回词汇学习清单" })).toHaveAttribute("href", "/vocabulary-learning");
    expect(screen.queryByText(errorCode, { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /重试生成|重试批改/ })).not.toBeInTheDocument();
  });
  it("replays the original UUID and sentence after an uncertain submission", async () => {
    const practice = fixture(); mount(practice);
    const input = await screen.findByLabelText("日语句子");
    fireEvent.change(input, { target: { value: "  予定があります。  " } });
    vi.mocked(apiRequest).mockRejectedValueOnce(new Error("请求超时"));
    fireEvent.click(screen.getByRole("button", { name: "提交句子" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "重试提交原句" })).toBeEnabled());
    expect(input).toBeDisabled();
    vi.mocked(apiRequest).mockResolvedValueOnce({ data: { ...practice, status: "ASSESSING", answer: "予定があります。" } });
    fireEvent.click(screen.getByRole("button", { name: "重试提交原句" }));
    await screen.findByText(/句子已保存/);
    const calls = vi.mocked(apiRequest).mock.calls;
    expect(calls[1][1]?.body).toBe(calls[0][1]?.body);
    expect(JSON.parse(calls[0][1]?.body as string)).toEqual({ sentence: "予定があります。", requestKey: expect.stringMatching(/^[0-9a-f-]{36}$/) });
  });
  it("describes alternate expressions as unverified, with reading untested", () => {
    render(<PracticeFeedback practice={fixture({ status: "COMPLETED", result: {
      outcome: "UNVERIFIED", usedTarget: false, targetCorrect: null, meaningCorrect: null, readingCorrect: null,
      explanationZh: "表达自然。", corrections: [], correctedSentence: "", correctedFurigana: "", correctedTranslationZh: "",
    } })} />);
    expect(screen.getByText("词汇反馈 · 暂未验证")).toBeInTheDocument();
    expect(screen.getByText(/这句话没有提供目标词的使用证据，不代表句子错误/)).toBeInTheDocument();
    expect(screen.queryByText("需修改")).not.toBeInTheDocument();
    expect(screen.getAllByText("未验证")).toHaveLength(3);
  });
});

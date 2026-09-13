import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/client";
import { fetchHistoryPage } from "./history-page";

vi.mock("@/lib/api/client", () => ({ apiRequest: vi.fn() }));
const request = vi.mocked(apiRequest);
const scored = (id: string, totalScore: number) => ({ id, aiJob: { status: "COMPLETED", result: { totalScore } } });
beforeEach(() => request.mockReset());

describe("scored learning history", () => {
  it("keeps zero and positive scores, hiding missing or invalid scores", async () => {
    request.mockResolvedValue({ data: [scored("zero", 0), scored("pass", 95),
      { id: "ungraded" }, { id: "failed", aiJob: { status: "FAILED", result: null } },
      { id: "missing-score", aiJob: { result: { totalScore: null } } }, scored("invalid", NaN)] });
    expect((await fetchHistoryPage("/sentence-attempts")).items.map(item => item.id)).toEqual(["zero", "pass"]);
  });

  it("skips ungraded-only pages and preserves the cursor after the scored page", async () => {
    request.mockResolvedValueOnce({ data: [{ id: "pending", aiJob: { status: "PROCESSING" } }], meta: { nextCursor: "next/1" } })
      .mockResolvedValueOnce({ data: [{ id: "failed", aiJob: { status: "FAILED" } }], meta: { nextCursor: "next2" } })
      .mockResolvedValueOnce({ data: [scored("older", 0)], meta: { nextCursor: "next3" } });
    const page = await fetchHistoryPage("/sentence-attempts");
    expect(page).toEqual({ items: [scored("older", 0)], nextCursor: "next3", hasPending: true });
    expect(request.mock.calls.map(([path]) => path)).toEqual(["/sentence-attempts", "/sentence-attempts?cursor=next%2F1", "/sentence-attempts?cursor=next2"]);
  });

  it("returns an empty history after exhausting ungraded records", async () => {
    request.mockResolvedValue({ data: [{ id: "ungraded" }], meta: { nextCursor: null } });
    expect(await fetchHistoryPage("/sentence-attempts")).toEqual({ items: [], nextCursor: null, hasPending: false });
  });

  it("shows an attempt once pending grading completes on refresh", async () => {
    request.mockResolvedValueOnce({ data: [{ id: "pending", aiJob: { status: "QUEUED" } }] })
      .mockResolvedValueOnce({ data: [scored("pending", 78)] });
    expect(await fetchHistoryPage("/sentence-attempts")).toMatchObject({ items: [], hasPending: true });
    expect(await fetchHistoryPage("/sentence-attempts")).toMatchObject({ items: [scored("pending", 78)], hasPending: false });
  });

  it("propagates errors while looking past an ungraded page", async () => {
    request.mockResolvedValueOnce({ data: [], meta: { nextCursor: "next" } }).mockRejectedValueOnce(new Error("offline"));
    await expect(fetchHistoryPage("/sentence-attempts")).rejects.toThrow("offline");
  });

  it("stops a repeated cursor instead of looping forever", async () => {
    request.mockResolvedValue({ data: [], meta: { nextCursor: "same" } });
    await expect(fetchHistoryPage("/sentence-attempts")).rejects.toThrow("学习记录加载失败");
    expect(request).toHaveBeenCalledTimes(2);
  });
});

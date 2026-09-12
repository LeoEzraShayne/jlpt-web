import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetcher, apiRequest } from "@/lib/api/client";
import { MembershipPage, formatPrice } from "./membership-page";
import { QuotaSummary } from "./quota-notice";
import { setLocale } from "@/lib/i18n/locale-store";
import { VocabularyPracticeWorkspace } from "@/components/vocabulary-learning/practice-workspace";
vi.mock("@/lib/api/client", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/api/client")>(), apiFetcher: vi.fn(), apiRequest: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
function mount(element: React.ReactNode) { return render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>{element}</SWRConfig>); }
beforeEach(() => { vi.clearAllMocks(); window.history.replaceState(null, "", "/"); act(() => setLocale("zh")); });
afterEach(() => { cleanup(); act(() => setLocale("zh")); });
const membership = { isMember: false, expiresAt: null, quota: { enforcementEnabled: true, dailyLimit: 5, remaining: 2, reserved: 1, rewardBalance: 0, resetsAt: "2026-09-14T00:00:00Z", timezone: "Asia/Tokyo" } };
describe("membership UI", () => {
  it("uses currency minor units correctly", () => {
    expect(formatPrice(99, "USD", "en")).toBe("$0.99");
    expect(formatPrice(6400, "USD", "en")).toBe("$64.00");
    expect(formatPrice(100, "JPY", "en")).toBe("¥100");
  });
  it("keeps sales disabled and market independent from the interface language", async () => {
    vi.mocked(apiFetcher).mockImplementation(async path => path === "/me/entitlements" ? membership : { market: "GLOBAL", salesEnabled: false, products: [{ productCode: "DAY_PASS", currency: "USD", amount: 99, durationSeconds: 86400 }] });
    mount(<MembershipPage />);
    expect(await screen.findByRole("button", { name: "使用 Stripe 安全支付" })).toBeDisabled();
    act(() => setLocale("en"));
    expect(screen.getByLabelText("Purchase market")).toHaveValue("GLOBAL");
    expect(screen.getByRole("button", { name: "Pay securely with Stripe" })).toBeDisabled();
    expect(apiRequest).not.toHaveBeenCalled();
  });
  it.each([false, true])("shows the actual enforcement state (%s) in the banner and membership page", async enforcementEnabled => {
    vi.mocked(apiFetcher).mockImplementation(async path => path === "/me/entitlements"
      ? { ...membership, quota: { ...membership.quota, enforcementEnabled, remaining: 5 } }
      : { market: "GLOBAL", salesEnabled: false, products: [{ productCode: "DAY_PASS", currency: "USD", amount: 99, durationSeconds: 86400 }] });
    mount(<><QuotaSummary /><MembershipPage /></>);
    expect(await screen.findByRole("button", { name: "使用 Stripe 安全支付" })).toBeDisabled();
    expect(screen.getByText("免费学习")).toBeInTheDocument();
    expect(screen.queryByText("会员已生效")).not.toBeInTheDocument();
    if (enforcementEnabled) {
      expect(screen.getAllByText(/今日免费任务剩余 5\/5/)).toHaveLength(2);
      expect(screen.getByText("语法与词汇合计每天 5 个任务，每个任务包含 3 次成功批改。")).toBeInTheDocument();
      expect(screen.queryByText("当前尚未启用任务额度限制")).not.toBeInTheDocument();
    } else {
      expect(screen.getAllByText("当前尚未启用任务额度限制")).toHaveLength(2);
      expect(screen.queryByText(/今日免费任务剩余|每天 5 个任务|下次刷新|奖励任务余额/)).not.toBeInTheDocument();
    }
    act(() => setLocale("en"));
    expect(screen.getByRole("button", { name: "Pay securely with Stripe" })).toBeDisabled();
    expect(screen.getByText("Free learning")).toBeInTheDocument();
    if (enforcementEnabled) {
      expect(screen.getAllByText(/Free tasks remaining today: 5\/5/)).toHaveLength(2);
      expect(screen.queryByText("Task limits are not currently enabled.")).not.toBeInTheDocument();
    } else {
      expect(screen.getAllByText("Task limits are not currently enabled.")).toHaveLength(2);
      expect(screen.queryByText(/Free tasks remaining today:|5 tasks per day/)).not.toBeInTheDocument();
    }
    expect(apiRequest).not.toHaveBeenCalled();
  });
  it("keeps real membership separate from disabled task limits", async () => {
    vi.mocked(apiFetcher).mockImplementation(async path => path === "/me/entitlements"
      ? { ...membership, isMember: true, expiresAt: "2026-09-15T00:00:00Z", quota: { ...membership.quota, enforcementEnabled: false } }
      : { market: "GLOBAL", salesEnabled: false, products: [] });
    mount(<><QuotaSummary /><MembershipPage /></>);
    expect(await screen.findByText("会员已生效")).toBeInTheDocument();
    expect(screen.getByText(/有效期至/)).toBeInTheDocument();
    expect(screen.getAllByText("当前尚未启用任务额度限制")).toHaveLength(2);
    expect(screen.queryByText(/今日免费任务剩余/)).not.toBeInTheDocument();
  });
  it("preserves input across an allowance failure and interface switch", async () => {
    const practice = { id: "p1", vocabularyId: "v1", status: "READY", unknownAtStart: false, hintLevel: 0, hints: {}, createdAt: "2026-09-13T00:00:00Z" };
    vi.mocked(apiFetcher).mockResolvedValue(practice);
    vi.mocked(apiRequest).mockRejectedValue(new ApiError("quota", 402, "TASK_REVIEW_LIMIT"));
    mount(<VocabularyPracticeWorkspace id="p1" />);
    const input = await screen.findByLabelText("日语句子");
    fireEvent.change(input, { target: { value: "予定があります。" } });
    fireEvent.click(screen.getByRole("button", { name: "提交句子" }));
    await waitFor(() => expect(screen.getByRole("link", { name: "查看会员与额度" })).toHaveAttribute("target", "_blank"));
    act(() => setLocale("en"));
    expect(screen.getByLabelText("Japanese sentence")).toHaveValue("予定があります。");
    expect(screen.getByRole("link", { name: "View membership & allowance" })).toBeInTheDocument();
  });
});

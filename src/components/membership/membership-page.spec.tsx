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
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); window.history.replaceState(null, "", "/"); act(() => setLocale("zh")); });
afterEach(() => { cleanup(); act(() => setLocale("zh")); });
const membership = { isMember: false, expiresAt: null, quota: { enforcementEnabled: true, dailyLimit: 5, remaining: 2, reserved: 1, rewardBalance: 0, resetsAt: "2026-09-14T00:00:00Z", timezone: "Asia/Tokyo" } };
describe("membership UI", () => {
  it.each([0, 1])("keeps the other button unchanged and blocks duplicate checkout requests: index %s", async selectedIndex => {
    vi.mocked(apiFetcher).mockImplementation(async path => path === "/me/entitlements" ? membership : {
      market: "GLOBAL", salesEnabled: true, products: [
        { productCode: "DAY_PASS", currency: "USD", amount: 99, durationSeconds: 86400 },
        { productCode: "YEAR_PASS", currency: "USD", amount: 6400, durationSeconds: 31536000 },
      ],
    });
    let rejectCheckout!: (error: Error) => void;
    vi.mocked(apiRequest).mockImplementation(() => new Promise((_, reject) => { rejectCheckout = reject; }));
    mount(<MembershipPage />);
    const buttons = await screen.findAllByRole("button", { name: "使用 Stripe 安全支付" });
    fireEvent.click(buttons[selectedIndex]);
    expect(buttons[selectedIndex]).toHaveTextContent("正在打开安全支付…");
    expect(buttons[selectedIndex]).toBeDisabled();
    expect(buttons[1 - selectedIndex]).toHaveTextContent("使用 Stripe 安全支付");
    expect(buttons[1 - selectedIndex]).toBeEnabled();
    fireEvent.click(buttons[1 - selectedIndex]);
    expect(apiRequest).toHaveBeenCalledTimes(1);
    expect(JSON.parse(vi.mocked(apiRequest).mock.calls[0][1]?.body as string).productCode).toBe(selectedIndex === 0 ? "DAY_PASS" : "YEAR_PASS");
    await act(async () => { rejectCheckout(new ApiError("unavailable", 503, "BILLING_DISABLED")); });
    await screen.findByRole("alert");
    for (const button of buttons) {
      expect(button).toBeEnabled();
      expect(button).toHaveTextContent("使用 Stripe 安全支付");
    }
  });
  it.each([false, true])("opens native commerce, never Stripe, and hides member rewards (%s)", async isMember => {
    sessionStorage.setItem("jlpt-android-surface", "android-test");
    vi.mocked(apiFetcher).mockResolvedValue({ ...membership, isMember });
    mount(<MembershipPage />);
    const link = await screen.findByRole("button", { name: "在应用内查看价格与购买" });
    expect(link).toBeEnabled();
    expect(screen.queryByText("使用 Stripe 安全支付")).not.toBeInTheDocument();
    expect(apiFetcher).not.toHaveBeenCalledWith("/billing/catalog?market=GLOBAL");
    expect(Boolean(screen.queryByRole("button", { name: "在应用内查看奖励任务" }))).toBe(!isMember);
    expect(apiRequest).not.toHaveBeenCalled();
  });
  it("uses currency minor units correctly", () => {
    expect(formatPrice(99, "USD", "en")).toBe("$0.99");
    expect(formatPrice(6400, "USD", "en")).toBe("$64.00");
    expect(formatPrice(9900, "USD", "en")).toBe("$99.00");
    expect(formatPrice(100, "JPY", "en")).toBe("¥100");
  });
  it("keeps sales disabled and new purchases in USD across interface languages", async () => {
    vi.mocked(apiFetcher).mockImplementation(async path => path === "/me/entitlements" ? membership : { market: "GLOBAL", salesEnabled: false, products: [{ productCode: "DAY_PASS", currency: "USD", amount: 99, durationSeconds: 86400 }] });
    mount(<MembershipPage />);
    expect(await screen.findByRole("button", { name: "使用 Stripe 安全支付" })).toBeDisabled();
    act(() => setLocale("en"));
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText("New web purchases are charged in USD worldwide. Changing language does not change prices.")).not.toBeInTheDocument();
    expect(apiFetcher).toHaveBeenCalledWith("/billing/catalog?market=GLOBAL");
    expect(screen.getByRole("button", { name: "Pay securely with Stripe" })).toBeDisabled();
    expect(apiRequest).not.toHaveBeenCalled();
  });
  it.each(["zh", "en"] as const)("requests the global USD catalog and checkout in %s", async locale => {
    act(() => setLocale(locale));
    vi.mocked(apiFetcher).mockImplementation(async path => path === "/me/entitlements" ? membership : {
      market: "GLOBAL", salesEnabled: true, products: [
        { productCode: "DAY_PASS", currency: "USD", amount: 99, durationSeconds: 86400 },
        { productCode: "YEAR_PASS", currency: "USD", amount: 9900, durationSeconds: 31536000 },
      ],
    });
    vi.mocked(apiRequest).mockRejectedValueOnce(new ApiError("billing disabled", 503, "BILLING_DISABLED"));
    mount(<MembershipPage />);
    const buttons = await screen.findAllByRole("button", { name: locale === "en" ? "Pay securely with Stripe" : "使用 Stripe 安全支付" });
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByText(locale === "en" ? "$99" : "US$99")).toBeInTheDocument();
    fireEvent.click(buttons[1]);
    await waitFor(() => expect(apiRequest).toHaveBeenCalledTimes(1));
    expect(apiFetcher).toHaveBeenCalledWith("/billing/catalog?market=GLOBAL");
    expect(apiRequest).toHaveBeenCalledWith("/billing/checkout", { method: "POST", body: expect.any(String) });
    expect(JSON.parse(vi.mocked(apiRequest).mock.calls[0][1]?.body as string)).toEqual({
      productCode: "YEAR_PASS", market: "GLOBAL", locale, expectedAmount: 9900, requestKey: expect.stringMatching(/^[0-9a-f-]{36}$/),
    });
    await screen.findByRole("alert");
  });
  it("refreshes a changed quote and requires another click with a new request key", async () => {
    let amount = 6400;
    vi.mocked(apiFetcher).mockImplementation(async path => path === "/me/entitlements" ? { ...membership, isMember: true } : {
      market: "GLOBAL", salesEnabled: true, products: [{ productCode: "YEAR_PASS", currency: "USD", amount, regularAmount: 9900, durationSeconds: 31536000 }],
    });
    vi.mocked(apiRequest).mockImplementation(async () => { amount = 9900; throw new ApiError("changed", 409, "PRICE_CHANGED"); });
    mount(<MembershipPage />);
    fireEvent.click(await screen.findByRole("button", { name: "使用 Stripe 安全支付" }));
    await screen.findByText("价格已更新，请确认新价格后再次点击购买。");
    expect(apiRequest).toHaveBeenCalledTimes(1);
    expect(screen.getByText("US$99")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "使用 Stripe 安全支付" }));
    await waitFor(() => expect(apiRequest).toHaveBeenCalledTimes(2));
    const first = JSON.parse(vi.mocked(apiRequest).mock.calls[0][1]?.body as string);
    const second = JSON.parse(vi.mocked(apiRequest).mock.calls[1][1]?.body as string);
    expect(first.expectedAmount).toBe(6400); expect(second.expectedAmount).toBe(9900);
    expect(first.requestKey).not.toBe(second.requestKey);
    expect(screen.queryByText("会员已生效")).not.toBeInTheDocument();
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
    await screen.findByText("当前尚未启用任务额度限制");
    expect(screen.queryByText("会员已生效")).not.toBeInTheDocument();
    expect(screen.queryByText(/有效期至/)).not.toBeInTheDocument();
    expect(screen.getAllByText("当前尚未启用任务额度限制")).toHaveLength(1);
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

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Catalog } from "@/lib/api/sentence-lab";
import { MembershipPackages, offerTimeLeft } from "./membership-packages";

const end = Date.parse("2027-03-12T23:58:15Z");
const catalog: Catalog = {
  market: "GLOBAL", salesEnabled: true, launchAt: "2026-09-12T23:58:15Z", launchEndsAt: new Date(end).toISOString(),
  products: [
    { productCode: "DAY_PASS", currency: "USD", amount: 99, regularAmount: 99, durationSeconds: 86400, launchPrice: false },
    { productCode: "YEAR_PASS", currency: "USD", amount: 6400, regularAmount: 9900, durationSeconds: 31536000, launchPrice: true },
  ],
};
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(end - 86_400_000 - 3_600_000 - 120_000); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

it("shows the launch price, crossed-out regular price, duration badges and colored countdown", () => {
  const checkout = vi.fn();
  render(<MembershipPackages catalog={catalog} pending={null} onCheckout={checkout} onOfferExpired={vi.fn()} />);
  act(() => vi.advanceTimersByTime(0));
  expect(screen.getByRole("timer")).toHaveTextContent("1天1小时2分钟");
  expect(screen.getByText("首发优惠中")).toBeInTheDocument();
  expect(screen.getByText("US$99").tagName).toBe("DEL");
  expect(screen.getByText("US$64")).toBeInTheDocument();
  expect(screen.getByText("连续 24 小时")).toBeInTheDocument();
  expect(screen.getByText("连续 365 天")).toBeInTheDocument();
  expect(screen.getByTestId("launch-countdown")).not.toHaveTextContent("23:58:15");
  fireEvent.click(screen.getAllByRole("button", { name: "使用 Stripe 安全支付" })[1]);
  expect(checkout).toHaveBeenCalledWith("YEAR_PASS");
});

it("switches to the regular price at the exact deadline and refreshes the catalog once", () => {
  vi.setSystemTime(end - 1000);
  const refresh = vi.fn();
  render(<MembershipPackages catalog={catalog} pending={null} onCheckout={vi.fn()} onOfferExpired={refresh} />);
  act(() => vi.advanceTimersByTime(0));
  expect(screen.getByRole("timer")).toHaveTextContent("0天0小时1分钟");
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.queryByText("首发优惠中")).not.toBeInTheDocument();
  expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  expect(screen.queryByText("US$64")).not.toBeInTheDocument();
  expect(screen.getByText("US$99").tagName).toBe("SPAN");
  expect(refresh).toHaveBeenCalledTimes(1);
  act(() => vi.advanceTimersByTime(60_000));
  expect(refresh).toHaveBeenCalledTimes(1);
});

it("never keeps an expired legacy catalog quote purchasable without a regular price", () => {
  vi.setSystemTime(end);
  const legacy = { ...catalog, products: catalog.products.map(product => ({ ...product, regularAmount: undefined })) };
  render(<MembershipPackages catalog={legacy} pending={null} onCheckout={vi.fn()} onOfferExpired={vi.fn()} />);
  act(() => vi.advanceTimersByTime(0));
  expect(screen.getAllByRole("button")[1]).toBeDisabled();
  expect(screen.getByText("价格加载中…")).toBeInTheDocument();
});

it("does not invent an offer without a configured launch and never returns negative time", () => {
  const noOffer = { ...catalog, launchEndsAt: null, products: catalog.products.map(product => ({ ...product, amount: product.regularAmount!, launchPrice: false })) };
  render(<MembershipPackages catalog={noOffer} pending={null} onCheckout={vi.fn()} onOfferExpired={vi.fn()} />);
  expect(screen.queryByText("首发优惠中")).not.toBeInTheDocument();
  expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  expect(offerTimeLeft(end, end + 1)).toEqual({ days: 0, hours: 0, minutes: 0 });
});

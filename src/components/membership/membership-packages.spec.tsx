import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { Catalog } from "@/lib/api/sentence-lab";
import { MembershipPackages } from "./membership-packages";

const catalog: Catalog = {
  market: "GLOBAL", salesEnabled: true, launchAt: "2026-09-12T23:58:15Z", launchEndsAt: null,
  products: [
    { productCode: "DAY_PASS", currency: "USD", amount: 99, regularAmount: 99, durationSeconds: 86400, launchPrice: false },
    { productCode: "YEAR_PASS", currency: "USD", amount: 9900, regularAmount: 9900, durationSeconds: 31536000, launchPrice: false },
  ],
};
afterEach(cleanup);

it("shows standard one-time prices and durations and checks out the existing annual product", () => {
  const checkout = vi.fn();
  render(<MembershipPackages catalog={catalog} pending={null} onCheckout={checkout} />);
  expect(screen.getByText("US$99")).toBeInTheDocument();
  expect(screen.getByText("US$0.99")).toBeInTheDocument();
  expect(screen.getByText("连续 24 小时")).toBeInTheDocument();
  expect(screen.getByText("连续 365 天")).toBeInTheDocument();
  expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "使用 Stripe 安全支付" })[1]);
  expect(checkout).toHaveBeenCalledWith("YEAR_PASS");
});

it("renders the server quote with original price and automatic discount", () => {
  const discounted = { ...catalog, products: catalog.products.map(p => p.productCode === "YEAR_PASS" ? { ...p, amount: 6400, discountAmount: 3500, promotionEndsAt: "2027-03-12T23:58:00Z" } : p) };
  render(<MembershipPackages catalog={discounted} pending={null} onCheckout={vi.fn()} />);
  expect(screen.getByText("US$99").tagName).toBe("DEL");
  expect(screen.getByText("US$64")).toBeInTheDocument();
  expect(screen.getByText(/US\$35/)).toBeInTheDocument();
});

it("disables both products when sales are closed", () => {
  render(<MembershipPackages catalog={{ ...catalog, salesEnabled: false }} pending={null} onCheckout={vi.fn()} />);
  for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
});

it.each(["DAY_PASS", "YEAR_PASS"] as const)("only changes the selected payment button: %s", pending => {
  render(<MembershipPackages catalog={catalog} pending={pending} onCheckout={vi.fn()} />);
  const selected = screen.getByRole("button", { name: "正在打开安全支付…" });
  expect(selected).toBeDisabled();
  expect(selected).toHaveAttribute("aria-busy", "true");
  expect(selected.closest("[data-product]")).toHaveAttribute("data-product", pending);
  const other = screen.getByRole("button", { name: "使用 Stripe 安全支付" });
  expect(other).toBeEnabled();
  expect(other).not.toHaveAttribute("aria-busy");
});

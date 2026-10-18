import { cleanup, render, screen } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, expect, it, vi } from "vitest";
import { OrdersPage } from "./orders-page";
import { apiRequest } from "@/lib/api/client";
vi.mock("@/lib/api/client", async original => ({ ...await original<typeof import("@/lib/api/client")>(), apiRequest: vi.fn() }));
afterEach(cleanup);
it("shows gifts with their issue time, without a price or payment link", async () => {
  vi.mocked(apiRequest).mockResolvedValue({ data: [{ kind: "GIFT", id: "gift-123", giftedAt: "2026-09-13T08:58:00Z", createdAt: "2026-09-13T08:58:00Z", durationSeconds: 31536000, revokedAt: null }], meta: {} });
  render(<SWRConfig value={{ provider: () => new Map() }}><OrdersPage /></SWRConfig>);
  expect(await screen.findByText("赠送 VIP")).toBeInTheDocument();
  expect(screen.getByText(/赠送时间：/)).toHaveTextContent("2026");
  expect(screen.queryByText(/付款|关闭|订单号|US\$/)).not.toBeInTheDocument();
  expect(screen.getAllByRole("link")).toHaveLength(1);
  expect(apiRequest).toHaveBeenCalledWith("/billing/history?limit=20");
});
it("shows successful purchases as paid with payment time and order detail", async () => {
  vi.mocked(apiRequest).mockResolvedValue({ data: [{ kind: "PAYMENT", id: "test-order-123", provider: "STRIPE", productCode: "YEAR_PASS", currency: "USD", amount: 6400, status: "PAID", paidAt: "2026-09-13T08:58:00Z", createdAt: "2026-09-13T08:50:00Z", refundedAmount: 0 }], meta: {} });
  render(<SWRConfig value={{ provider: () => new Map() }}><OrdersPage /></SWRConfig>);
  expect(await screen.findByText("已付款")).toBeInTheDocument();
  expect(screen.getByText(/付款时间：/)).toHaveTextContent("2026");
  expect(screen.getByText("订单号：test-order-123")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /已付款/ })).toHaveAttribute("href", "/membership/return?orderId=test-order-123");
  expect(screen.queryByText(/赠送|关闭/)).not.toBeInTheDocument();
});

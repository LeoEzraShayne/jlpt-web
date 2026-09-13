import { ADULT_ACCESS_KEY } from "@/lib/adult-access";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthGate } from "./auth-gate";
import { ApiError } from "@/lib/api/client";
const state = vi.hoisted(() => ({ path: "/membership", me: { data: { id: "u1" }, isLoading: false, error: null as Error | null, mutate: vi.fn() }, plan: { data: { items: [] }, isLoading: false, error: null, mutate: vi.fn() }, replace: vi.fn(), setTheme: vi.fn(), usePlans: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => state.path, useRouter: () => ({ replace: state.replace }) }));
vi.mock("@/hooks/use-api", () => ({ useMe: () => state.me, usePlans: (enabled: boolean) => { state.usePlans(enabled); return state.plan; } }));
vi.mock("@/components/theme/theme-provider", () => ({ useColorTheme: () => ({ setTheme: state.setTheme }) }));
beforeEach(() => { sessionStorage.setItem(ADULT_ACCESS_KEY, "confirmed"); vi.clearAllMocks(); state.me.error = null; });
afterEach(cleanup);
describe("billing access before onboarding", () => {
  it.each(["/membership", "/membership/orders", "/membership/return"])("allows signed-in users without plans on %s", path => {
    state.path = path; render(<AuthGate><p>Order status</p></AuthGate>);
    expect(screen.getByText("Order status")).toBeInTheDocument();
    expect(state.usePlans).toHaveBeenCalledWith(false);
    expect(state.replace).not.toHaveBeenCalled();
  });
  it("keeps the order ID when redirecting an expired session to login", async () => {
    state.path = "/membership/return"; window.history.replaceState(null, "", "/membership/return?orderId=order-123");
    state.me.error = new ApiError("Expired", 401);
    render(<AuthGate><p>Order status</p></AuthGate>);
    await waitFor(() => expect(state.replace).toHaveBeenCalledWith("/login?next=%2Fmembership%2Freturn%3ForderId%3Dorder-123"));
  });
});

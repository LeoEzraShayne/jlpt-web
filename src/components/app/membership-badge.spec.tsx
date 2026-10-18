import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MembershipBadge } from "./membership-badge";
const membership = vi.hoisted(() => ({ data: undefined as undefined | { isMember: boolean }, error: undefined as undefined | Error }));
vi.mock("@/components/membership/use-membership", () => ({ useMembership: () => membership }));
vi.mock("@/components/locale/locale-provider", () => ({ useLocale: () => ({ t: (value: string) => value }) }));
afterEach(() => { cleanup(); membership.data = undefined; membership.error = undefined; });
describe("membership badge", () => {
  it("keeps unresolved membership distinct from non-members", () => {
    render(<MembershipBadge />);
    expect(screen.getByLabelText("正在读取会员状态")).toHaveTextContent("…");
    expect(screen.queryByLabelText("非会员")).not.toBeInTheDocument();
  });
  it("does not advertise cached membership as verified after a request error", () => {
    membership.data = { isMember: true }; membership.error = new Error("offline");
    render(<MembershipBadge />);
    expect(screen.getByLabelText("会员状态暂不可用")).toHaveTextContent("VIP ?");
    expect(screen.queryByLabelText("会员有效")).not.toBeInTheDocument();
  });
  it.each([true, false])("uses current entitlements without requiring an order: %s", isMember => {
    membership.data = { isMember }; render(<MembershipBadge />);
    expect(screen.getByLabelText(isMember ? "会员有效" : "非会员")).toHaveTextContent("VIP");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setLocale } from "@/lib/i18n/locale-store";
import { HomeView } from "./home-view";
import { AboutView } from "./about-view";
import { PrivacyView } from "./privacy-view";
import { DeleteAccountView } from "./delete-account-view";
vi.mock("@/hooks/use-api", () => ({ useMe: () => ({ data: null, mutate: vi.fn() }) }));
afterEach(() => { cleanup(); act(() => setLocale("zh")); });
describe("public English pages", () => {
  it.each([HomeView, AboutView, PrivacyView, DeleteAccountView])("translates all visible public page content in %s", View => {
    act(() => setLocale("en"));
    const { container } = render(<View />);
    const copy = Array.from(container.querySelectorAll("main p, main h1, main h2, main h3, main dd, main dt, main li, nav a")).map(node => node.textContent).join(" ");
    expect(copy).not.toMatch(/[\u4e00-\u9fff]/);
    expect(screen.getByLabelText("Interface")).toHaveValue("en");
  });
  it.each(["zh", "en"] as const)("offers a user-composed deletion email without sign-in in %s", locale => {
    act(() => setLocale(locale));
    const { container } = render(<DeleteAccountView />);
    const action = screen.getByRole("link", { name: locale === "zh" ? "用邮件申请删除" : "Request deletion by email" });
    const target = new URL(action.getAttribute("href")!);
    expect(target.protocol).toBe("mailto:");
    expect(target.pathname).toBe("contact@meritledger.org");
    expect(target.searchParams.get("subject")).toContain("JLPT");
    expect(target.searchParams.get("body")).toContain(locale === "zh" ? "发送申请不代表删除已完成" : "sending this request does not complete deletion");
    expect(target.searchParams.get("body")).not.toMatch(/\S+@\S+/);
    expect(container.querySelector("form")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(locale === "zh" ? "账号与数据删除申请" : "Account and data deletion request");
    expect(screen.getByRole("link", { name: locale === "zh" ? "查看旧功过格删除说明" : "Legacy Merit Ledger deletion instructions" })).toHaveAttribute("href", "https://official.meritledger.org/delete-account");
  });
  it("links to the public request page from privacy and the footer", () => {
    render(<PrivacyView />);
    expect(screen.getByRole("link", { name: "账号与数据删除申请" })).toHaveAttribute("href", "/delete-account");
    expect(screen.getByRole("link", { name: "账号删除申请" })).toHaveAttribute("href", "/delete-account");
  });
  it("discloses Stripe hosting, no auto renewal, and no web ads", () => {
    act(() => setLocale("en")); render(<PrivacyView />);
    expect(screen.getByText(/Stripe-hosted page/)).toBeInTheDocument();
    expect(screen.getByText(/no automatic renewal/)).toBeInTheDocument();
    expect(screen.getByText(/web version shows no ads/)).toBeInTheDocument();
  });
});

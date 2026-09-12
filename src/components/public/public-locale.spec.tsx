import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setLocale } from "@/lib/i18n/locale-store";
import { HomeView } from "./home-view";
import { AboutView } from "./about-view";
import { PrivacyView } from "./privacy-view";
vi.mock("@/hooks/use-api", () => ({ useMe: () => ({ data: null, mutate: vi.fn() }) }));
afterEach(() => { cleanup(); act(() => setLocale("zh")); });
describe("public English pages", () => {
  it.each([HomeView, AboutView, PrivacyView])("translates all visible public page content in %s", View => {
    act(() => setLocale("en"));
    const { container } = render(<View />);
    const copy = Array.from(container.querySelectorAll("main p, main h1, main h2, main h3, main dd, main dt, main li, nav a")).map(node => node.textContent).join(" ");
    expect(copy).not.toMatch(/[\u4e00-\u9fff]/);
    expect(screen.getByLabelText("Interface")).toHaveValue("en");
  });
  it("discloses Stripe hosting, no auto renewal, and no web ads", () => {
    act(() => setLocale("en")); render(<PrivacyView />);
    expect(screen.getByText(/Stripe-hosted page/)).toBeInTheDocument();
    expect(screen.getByText(/no automatic renewal/)).toBeInTheDocument();
    expect(screen.getByText(/web version shows no ads/)).toBeInTheDocument();
  });
});

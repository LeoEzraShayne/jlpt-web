import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdultAccessBoundary } from "./adult-access-boundary";
import { setLocale } from "@/lib/i18n/locale-store";
import { ADULT_ACCESS_KEY, setAdultAccessConfirmed } from "@/lib/adult-access";

vi.mock("@/components/locale/language-picker", () => ({ LanguagePicker: () => null }));
beforeEach(() => { sessionStorage.clear(); act(() => { setAdultAccessConfirmed(false); setLocale("zh"); }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("adult access acknowledgement", () => {
  it.each(["zh", "en"] as const)("does not mount protected content before explicit confirmation in %s", locale => {
    act(() => setLocale(locale));
    const mounted = vi.fn();
    function Content() { mounted(); return <p>Learning area</p>; }
    render(<AdultAccessBoundary><Content /></AdultAccessBoundary>);
    expect(mounted).not.toHaveBeenCalled();
    const checkbox = screen.getByRole("checkbox");
    const action = screen.getByRole("button", { name: locale === "zh" ? "确认并继续" : "Confirm and continue" });
    expect(checkbox).not.toBeChecked();
    expect(action).toBeDisabled();
    expect(screen.getByRole("link", { name: locale === "zh" ? "隐私说明" : "Privacy" })).toHaveAttribute("href", "/privacy");
    fireEvent.click(checkbox);
    expect(mounted).not.toHaveBeenCalled();
    fireEvent.click(action);
    expect(screen.getByText("Learning area")).toBeInTheDocument();
    expect(sessionStorage.getItem(ADULT_ACCESS_KEY)).toBe("confirmed");
  });
  it("keeps the acknowledgement across navigation but clears it on sign-out", () => {
    render(<AdultAccessBoundary><p>Existing signed-in session</p></AdultAccessBoundary>);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "确认并继续" }));
    expect(screen.getByText("Existing signed-in session")).toBeInTheDocument();
    act(() => setAdultAccessConfirmed(false));
    expect(screen.queryByText("Existing signed-in session")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "确认并继续" })).toBeDisabled();
  });
  it("requires confirmation for an unrecognized stored value", () => {
    sessionStorage.setItem(ADULT_ACCESS_KEY, "true");
    render(<AdultAccessBoundary><p>Learning area</p></AdultAccessBoundary>);
    expect(screen.queryByText("Learning area")).not.toBeInTheDocument();
  });
  it("allows explicit confirmation for this page when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Unavailable"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Unavailable"); });
    render(<AdultAccessBoundary><p>Learning area</p></AdultAccessBoundary>);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "确认并继续" }));
    expect(screen.getByText("Learning area")).toBeInTheDocument();
  });
});

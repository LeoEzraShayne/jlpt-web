import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdultAccessBoundary } from "./adult-access-boundary";
import { setLocale } from "@/lib/i18n/locale-store";
import { ADULT_ACCESS_KEY, setAdultAccessConfirmed } from "@/lib/adult-access";

vi.mock("@/components/locale/language-picker", () => ({ LanguagePicker: () => null }));
beforeEach(() => {
  // Node exposes an unavailable localStorage global; model an independent browser store.
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
    clear: () => values.clear(),
  });
  sessionStorage.clear(); act(() => { setAdultAccessConfirmed(false); setLocale("zh"); });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

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
    expect(localStorage.getItem(ADULT_ACCESS_KEY)).toBe("confirmed");
  });
  it("keeps the acknowledgement across navigation but clears it on sign-out", () => {
    render(<AdultAccessBoundary><p>Existing signed-in session</p></AdultAccessBoundary>);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "确认并继续" }));
    expect(screen.getByText("Existing signed-in session")).toBeInTheDocument();
    act(() => setAdultAccessConfirmed(false));
    expect(screen.queryByText("Existing signed-in session")).not.toBeInTheDocument();
    expect(localStorage.getItem(ADULT_ACCESS_KEY)).toBeNull();
    expect(sessionStorage.getItem(ADULT_ACCESS_KEY)).toBeNull();
    expect(screen.getByRole("button", { name: "确认并继续" })).toBeDisabled();
  });
  it.each(["sessionStorage", "localStorage"] as const)("requires confirmation for an unrecognized %s value", storage => {
    window[storage].setItem(ADULT_ACCESS_KEY, "true");
    render(<AdultAccessBoundary><p>Learning area</p></AdultAccessBoundary>);
    expect(screen.queryByText("Learning area")).not.toBeInTheDocument();
  });
  it("allows explicit confirmation for this page when storage is unavailable", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => { throw new Error("Unavailable"); });
    vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("Unavailable"); });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Unavailable"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Unavailable"); });
    render(<AdultAccessBoundary><p>Learning area</p></AdultAccessBoundary>);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "确认并继续" }));
    expect(screen.getByText("Learning area")).toBeInTheDocument();
  });
  it("migrates an existing explicit tab acknowledgement to persistent storage", () => {
    sessionStorage.setItem(ADULT_ACCESS_KEY, "confirmed");
    render(<AdultAccessBoundary><p>Learning area</p></AdultAccessBoundary>);
    expect(screen.getByText("Learning area")).toBeInTheDocument();
    expect(localStorage.getItem(ADULT_ACCESS_KEY)).toBe("confirmed");
  });
  it("restores a remembered acknowledgement with no tab session", () => {
    localStorage.setItem(ADULT_ACCESS_KEY, "confirmed");
    render(<AdultAccessBoundary><p>Learning area</p></AdultAccessBoundary>);
    expect(screen.getByText("Learning area")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
  it.each([ADULT_ACCESS_KEY, null])("revokes stale tab acknowledgement on another tab's removal: %s", key => {
    setAdultAccessConfirmed(true);
    render(<AdultAccessBoundary><p>Learning area</p></AdultAccessBoundary>);
    localStorage.removeItem(ADULT_ACCESS_KEY);
    const event = new Event("storage");
    Object.defineProperties(event, { key: { value: key }, newValue: { value: null }, storageArea: { value: localStorage } });
    act(() => window.dispatchEvent(event));
    expect(screen.queryByText("Learning area")).not.toBeInTheDocument();
    expect(sessionStorage.getItem(ADULT_ACCESS_KEY)).toBeNull();
  });
  it("does not reuse a stale persistent value when removal fails", () => {
    setAdultAccessConfirmed(true);
    render(<AdultAccessBoundary><p>Learning area</p></AdultAccessBoundary>);
    vi.spyOn(localStorage, "removeItem").mockImplementation(() => { throw new Error("Unavailable"); });
    act(() => setAdultAccessConfirmed(false));
    expect(screen.queryByText("Learning area")).not.toBeInTheDocument();
  });

  it.each(["confirmed", "unknown"])("checks browser storage after neutral server markup: %s", async stored => {
    localStorage.setItem(ADULT_ACCESS_KEY, stored);
    const tree = <AdultAccessBoundary><p>Learning area</p></AdultAccessBoundary>;
    const html = renderToString(tree);
    expect(html).not.toContain("adult-access-title");
    expect(html).not.toContain("Learning area");
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const gateSeen: boolean[] = [];
    const observer = new MutationObserver(() => gateSeen.push(Boolean(container.querySelector("#adult-access-title"))));
    observer.observe(container, { subtree: true, childList: true });
    const recoverable = vi.fn();
    let root: Root;
    await act(async () => { root = hydrateRoot(container, tree, { onRecoverableError: recoverable }); });
    await waitFor(() => expect(container.textContent).toContain(stored === "confirmed" ? "Learning area" : "仅限年满 18 周岁的用户"));
    expect(recoverable).not.toHaveBeenCalled();
    if (stored === "confirmed") expect(gateSeen).not.toContain(true);
    observer.disconnect();
    await act(async () => root.unmount());
    container.remove();
  });

});

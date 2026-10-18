import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FocusCycleProvider, useFocusCycle } from "./focus-cycle-provider";

const navigation = vi.hoisted(() => ({ pathname: "/study/task-1" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

const memoryStorage = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    clear: () => memoryStorage.clear(),
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    removeItem: (key: string) => memoryStorage.delete(key),
    setItem: (key: string, value: string) => memoryStorage.set(key, value),
  },
});

function Harness() {
  const focus = useFocusCycle();
  return (
    <div>
      <span data-testid="phase">{focus.phase}</span>
      <span data-testid="remaining">{Math.ceil(focus.remainingMs / 60_000)}</span>
      <input aria-label="background answer" />
    </div>
  );
}

describe("FocusCycleProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-11T09:00:00.000Z"));
    localStorage.clear();
    navigation.pathname = "/study/task-1";
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    localStorage.clear();
  });

  it("runs a five minute focus cycle and a five minute break", () => {
    render(<FocusCycleProvider><Harness /></FocusCycleProvider>);
    act(() => vi.advanceTimersByTime(0));
    expect(screen.getByTestId("phase")).toHaveTextContent("FOCUS");

    act(() => vi.advanceTimersByTime(5 * 60_000));
    expect(screen.getByTestId("phase")).toHaveTextContent("BREAK_PROMPT");
    expect(screen.getByRole("alertdialog")).toHaveAccessibleName("已经专注 5 分钟，休息一下吧");
    expect(document.body.style.pointerEvents).toBe("none");
    expect(screen.getByRole("button", { name: "暂时跳过" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "开始休息" }));
    expect(document.body.style.pointerEvents).not.toBe("none");
    expect(screen.getByTestId("phase")).toHaveTextContent("BREAK");

    act(() => vi.advanceTimersByTime(5 * 60_000));
    expect(screen.getByTestId("phase")).toHaveTextContent("FOCUS");
    expect(screen.getByTestId("remaining")).toHaveTextContent("5");
  });

  it("pauses focus time while the page is hidden", () => {
    render(<FocusCycleProvider><Harness /></FocusCycleProvider>);
    act(() => vi.advanceTimersByTime(0));
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByTestId("remaining")).toHaveTextContent("5");
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
  });

  it("restores the current-day cycle and resets stale state", () => {
    const today = new Intl.DateTimeFormat("en-CA").format(new Date());
    localStorage.setItem(
      "jlpt-task-focus-v2",
      JSON.stringify({ taskKey: navigation.pathname, date: today, phase: "FOCUS", remainingMs: 2 * 60_000 }),
    );
    const current = render(<FocusCycleProvider><Harness /></FocusCycleProvider>);
    act(() => vi.advanceTimersByTime(0));
    expect(screen.getByTestId("phase")).toHaveTextContent("FOCUS");
    expect(screen.getByTestId("remaining")).toHaveTextContent("2");
    current.unmount();

    localStorage.setItem(
      "jlpt-task-focus-v2",
      JSON.stringify({ taskKey: navigation.pathname, date: "2026-08-10", phase: "FOCUS", remainingMs: 2 * 60_000 }),
    );
    render(<FocusCycleProvider><Harness /></FocusCycleProvider>);
    act(() => vi.advanceTimersByTime(0));
    expect(screen.getByTestId("phase")).toHaveTextContent("FOCUS");
    expect(screen.getByTestId("remaining")).toHaveTextContent("5");
  });

  it("can skip the break prompt and start a fresh focus cycle", () => {
    render(<FocusCycleProvider><Harness /></FocusCycleProvider>);
    act(() => vi.advanceTimersByTime(0));
    act(() => vi.advanceTimersByTime(5 * 60_000));
    fireEvent.click(screen.getByRole("button", { name: "暂时跳过" }));
    expect(screen.getByTestId("phase")).toHaveTextContent("FOCUS");
    expect(screen.getByTestId("remaining")).toHaveTextContent("5");
  });
  it("starts each new grammar or vocabulary task at five minutes and pauses off task", () => {
    const view = render(<FocusCycleProvider><Harness /></FocusCycleProvider>);
    act(() => vi.advanceTimersByTime(0));
    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByTestId("remaining")).toHaveTextContent("4");
    navigation.pathname = "/today";
    view.rerender(<FocusCycleProvider><Harness /></FocusCycleProvider>);
    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByTestId("phase")).toHaveTextContent("IDLE");
    expect(JSON.parse(localStorage.getItem("jlpt-task-focus-v2")!).remainingMs).toBe(240_000);
    for (const path of ["/study/task-2", "/vocabulary-practice/task-3"]) {
      navigation.pathname = path;
      view.rerender(<FocusCycleProvider><Harness /></FocusCycleProvider>);
      act(() => vi.advanceTimersByTime(0));
      expect(screen.getByTestId("phase")).toHaveTextContent("FOCUS");
      expect(screen.getByTestId("remaining")).toHaveTextContent("5");
      act(() => vi.advanceTimersByTime(60_000));
    }
  });

  it("does not restore the old cross-task thirty-minute timer", () => {
    localStorage.setItem("jlpt-focus-cycle", JSON.stringify({
      date: new Intl.DateTimeFormat("en-CA").format(new Date()),
      phase: "BREAK_PROMPT", remainingMs: 0,
    }));
    render(<FocusCycleProvider><Harness /></FocusCycleProvider>);
    act(() => vi.advanceTimersByTime(0));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("remaining")).toHaveTextContent("5");
  });

});

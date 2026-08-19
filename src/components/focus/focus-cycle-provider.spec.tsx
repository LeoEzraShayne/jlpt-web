import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FocusCycleProvider, useFocusCycle } from "./focus-cycle-provider";

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
      <button onClick={focus.startFocus}>start</button>
    </div>
  );
}

describe("FocusCycleProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-11T09:00:00.000Z"));
    localStorage.clear();
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    localStorage.clear();
  });

  it("runs a 30 minute focus cycle and a five minute break", () => {
    render(<FocusCycleProvider><Harness /></FocusCycleProvider>);
    act(() => vi.advanceTimersByTime(0));
    fireEvent.click(screen.getByText("start"));
    expect(screen.getByTestId("phase")).toHaveTextContent("FOCUS");

    act(() => vi.advanceTimersByTime(30 * 60_000));
    expect(screen.getByTestId("phase")).toHaveTextContent("BREAK_PROMPT");
    fireEvent.click(screen.getByRole("button", { name: "开始休息" }));
    expect(screen.getByTestId("phase")).toHaveTextContent("BREAK");

    act(() => vi.advanceTimersByTime(5 * 60_000));
    expect(screen.getByTestId("phase")).toHaveTextContent("FOCUS");
    expect(screen.getByTestId("remaining")).toHaveTextContent("30");
  });

  it("pauses focus time while the page is hidden", () => {
    render(<FocusCycleProvider><Harness /></FocusCycleProvider>);
    act(() => vi.advanceTimersByTime(0));
    fireEvent.click(screen.getByText("start"));
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByTestId("remaining")).toHaveTextContent("30");
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
  });

  it("restores the current-day cycle and resets stale state", () => {
    const today = new Intl.DateTimeFormat("en-CA").format(new Date());
    localStorage.setItem(
      "jlpt-focus-cycle",
      JSON.stringify({ date: today, phase: "FOCUS", remainingMs: 12 * 60_000 }),
    );
    const current = render(<FocusCycleProvider><Harness /></FocusCycleProvider>);
    act(() => vi.advanceTimersByTime(0));
    expect(screen.getByTestId("phase")).toHaveTextContent("FOCUS");
    expect(screen.getByTestId("remaining")).toHaveTextContent("12");
    current.unmount();

    localStorage.setItem(
      "jlpt-focus-cycle",
      JSON.stringify({ date: "2026-08-10", phase: "FOCUS", remainingMs: 12 * 60_000 }),
    );
    render(<FocusCycleProvider><Harness /></FocusCycleProvider>);
    act(() => vi.advanceTimersByTime(0));
    expect(screen.getByTestId("phase")).toHaveTextContent("IDLE");
    expect(screen.getByTestId("remaining")).toHaveTextContent("30");
  });

  it("can skip the break prompt and start a fresh focus cycle", () => {
    render(<FocusCycleProvider><Harness /></FocusCycleProvider>);
    act(() => vi.advanceTimersByTime(0));
    fireEvent.click(screen.getByText("start"));
    act(() => vi.advanceTimersByTime(30 * 60_000));
    fireEvent.click(screen.getByRole("button", { name: "暂时跳过" }));
    expect(screen.getByTestId("phase")).toHaveTextContent("FOCUS");
    expect(screen.getByTestId("remaining")).toHaveTextContent("30");
  });
});

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export const FOCUS_MINUTES = 30;
export const BREAK_MINUTES = 5;
const FOCUS_MS = FOCUS_MINUTES * 60_000;
const BREAK_MS = BREAK_MINUTES * 60_000;
const STORAGE_KEY = "jlpt-focus-cycle";

type FocusPhase = "IDLE" | "FOCUS" | "BREAK_PROMPT" | "BREAK";
type FocusState = { date: string; phase: FocusPhase; remainingMs: number; breakEndsAt?: number };
type FocusContextValue = FocusState & {
  startFocus: () => void;
  startBreak: () => void;
  skipBreak: () => void;
};

const FocusContext = createContext<FocusContextValue | null>(null);

function dateKey() {
  return new Intl.DateTimeFormat("en-CA").format(new Date());
}

function initialState(): FocusState {
  return { date: dateKey(), phase: "IDLE", remainingMs: FOCUS_MS };
}

export function FocusCycleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FocusState>(initialState);
  const hydrated = useRef(false);
  const lastTick = useRef(0);

  useEffect(() => {
    let restored = initialState();
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as FocusState | null;
      if (stored?.date === dateKey()) {
        if (stored.phase === "BREAK" && (stored.breakEndsAt ?? 0) <= Date.now())
          restored = { date: dateKey(), phase: "FOCUS", remainingMs: FOCUS_MS };
        else if (stored.phase === "BREAK")
          restored = { ...stored, remainingMs: Math.max(0, (stored.breakEndsAt ?? 0) - Date.now()) };
        else restored = stored;
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    const timer = window.setTimeout(() => {
      setState(restored);
      hydrated.current = true;
      lastTick.current = Date.now();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    function resetTick() {
      lastTick.current = Date.now();
    }
    document.addEventListener("visibilitychange", resetTick);
    const timer = window.setInterval(() => {
      const now = Date.now();
      const elapsed = Math.max(0, now - lastTick.current);
      lastTick.current = now;
      setState((current) => {
        if (current.date !== dateKey()) return initialState();
        if (current.phase === "FOCUS") {
          if (document.hidden) return current;
          const remainingMs = Math.max(0, current.remainingMs - elapsed);
          if (remainingMs === 0)
            return { date: current.date, phase: "BREAK_PROMPT", remainingMs: 0 };
          return { ...current, remainingMs };
        }
        if (current.phase === "BREAK") {
          const remainingMs = Math.max(0, (current.breakEndsAt ?? now) - now);
          if (remainingMs === 0)
            return { date: current.date, phase: "FOCUS", remainingMs: FOCUS_MS };
          return { ...current, remainingMs };
        }
        return current;
      });
    }, 1_000);
    return () => {
      document.removeEventListener("visibilitychange", resetTick);
      window.clearInterval(timer);
    };
  }, []);

  const startFocus = useCallback(() => {
    lastTick.current = Date.now();
    setState((current) =>
      current.phase === "IDLE"
        ? { date: dateKey(), phase: "FOCUS", remainingMs: FOCUS_MS }
        : current,
    );
  }, []);
  const startBreak = useCallback(() => {
    const breakEndsAt = Date.now() + BREAK_MS;
    setState({ date: dateKey(), phase: "BREAK", remainingMs: BREAK_MS, breakEndsAt });
  }, []);
  const skipBreak = useCallback(() => {
    lastTick.current = Date.now();
    setState({ date: dateKey(), phase: "FOCUS", remainingMs: FOCUS_MS });
  }, []);
  const value = useMemo(
    () => ({ ...state, startFocus, startBreak, skipBreak }),
    [skipBreak, startBreak, startFocus, state],
  );
  return (
    <FocusContext.Provider value={value}>
      {children}
      {state.phase === "BREAK_PROMPT" && (
        <div className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-2xl border bg-card p-5 warm-shadow lg:bottom-6" role="dialog" aria-modal="true" aria-labelledby="focus-break-title">
          <h2 id="focus-break-title" className="font-semibold">已经专注 30 分钟，休息一下吧</h2>
          <p className="mt-1 text-sm text-muted-foreground">休息 5 分钟，让注意力恢复后再继续。</p>
          <div className="mt-4 flex gap-3">
            <Button className="flex-1" onClick={startBreak}>开始休息</Button>
            <Button className="flex-1" variant="outline" onClick={skipBreak}>暂时跳过</Button>
          </div>
        </div>
      )}
    </FocusContext.Provider>
  );
}

export function useFocusCycle() {
  const value = useContext(FocusContext);
  if (!value) throw new Error("useFocusCycle must be used within FocusCycleProvider");
  return value;
}

export function formatFocusTime(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1_000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

"use client";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const FOCUS_MINUTES = 5;
export const BREAK_MINUTES = 5;
const FOCUS_MS = FOCUS_MINUTES * 60_000;
const BREAK_MS = BREAK_MINUTES * 60_000;
const STORAGE_KEY = "jlpt-task-focus-v2";

type FocusPhase = "IDLE" | "FOCUS" | "BREAK_PROMPT" | "BREAK";
type FocusState = { taskKey: string | null; date: string; phase: FocusPhase; remainingMs: number; breakEndsAt?: number };
type FocusContextValue = FocusState & {
  startBreak: () => void;
  skipBreak: () => void;
};

const FocusContext = createContext<FocusContextValue | null>(null);

function dateKey() {
  return new Intl.DateTimeFormat("en-CA").format(new Date());
}

function initialState(taskKey: string | null = null): FocusState {
  return { taskKey, date: dateKey(), phase: taskKey ? "FOCUS" : "IDLE", remainingMs: FOCUS_MS };
}

export function FocusCycleProvider({ children }: { children: React.ReactNode }) {
  useLocale();
  const pathname = usePathname();
  const taskKey = /^\/(study|vocabulary-practice)\/[^/]+\/?$/.test(pathname) ? pathname : null;
  const [state, setState] = useState<FocusState>(() => initialState());
  const hydrated = useRef(false);
  const lastTick = useRef(0);

  useEffect(() => {
    hydrated.current = false;
    let restored = initialState(taskKey);
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as FocusState | null;
      if (taskKey && stored?.taskKey === taskKey && stored.date === dateKey()
        && ["FOCUS", "BREAK_PROMPT", "BREAK"].includes(stored.phase)
        && Number.isFinite(stored.remainingMs) && stored.remainingMs >= 0 && stored.remainingMs <= FOCUS_MS) {
        if (stored.phase === "BREAK" && (stored.breakEndsAt ?? 0) <= Date.now())
          restored = { ...initialState(taskKey), phase: "FOCUS" };
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
  }, [taskKey]);

  useEffect(() => {
    if (!hydrated.current || !taskKey || state.taskKey !== taskKey) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, taskKey]);

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
        if (!hydrated.current || !taskKey || current.taskKey !== taskKey) return current;
        if (current.date !== dateKey()) return initialState(taskKey);
        if (current.phase === "FOCUS") {
          if (document.hidden) return current;
          const remainingMs = Math.max(0, current.remainingMs - elapsed);
          if (remainingMs === 0)
            return { ...current, phase: "BREAK_PROMPT", remainingMs: 0 };
          return { ...current, remainingMs };
        }
        if (current.phase === "BREAK") {
          const remainingMs = Math.max(0, (current.breakEndsAt ?? now) - now);
          if (remainingMs === 0)
            return { ...initialState(taskKey), phase: "FOCUS" };
          return { ...current, remainingMs };
        }
        return current;
      });
    }, 1_000);
    return () => {
      document.removeEventListener("visibilitychange", resetTick);
      window.clearInterval(timer);
    };
  }, [taskKey]);

  const startBreak = useCallback(() => {
    const breakEndsAt = Date.now() + BREAK_MS;
    setState({ ...initialState(taskKey), phase: "BREAK", remainingMs: BREAK_MS, breakEndsAt });
  }, [taskKey]);
  const skipBreak = useCallback(() => {
    lastTick.current = Date.now();
    setState({ ...initialState(taskKey), phase: "FOCUS" });
  }, [taskKey]);
  const value = useMemo(
    () => ({ ...(state.taskKey === taskKey ? state : initialState(taskKey)), startBreak, skipBreak }),
    [skipBreak, startBreak, state, taskKey],
  );
  return (
    <FocusContext.Provider value={value}>
      {children}
      <AlertDialog open={Boolean(taskKey && state.taskKey === taskKey && state.phase === "BREAK_PROMPT")}>
        <AlertDialogContent onEscapeKeyDown={(event) => event.preventDefault()} onKeyDown={(event) => event.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("已经专注 5 分钟，休息一下吧")}</AlertDialogTitle>
            <AlertDialogDescription>{t("休息 5 分钟，让注意力恢复后再继续。")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={skipBreak}>{t("暂时跳过")}</AlertDialogCancel>
            <AlertDialogAction onClick={startBreak}>{t("开始休息")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

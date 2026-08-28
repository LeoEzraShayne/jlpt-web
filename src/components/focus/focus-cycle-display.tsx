"use client";

import { Hourglass } from "lucide-react";
import { useFocusCycle, formatFocusTime, FOCUS_MINUTES, BREAK_MINUTES } from "./focus-cycle-provider";

export function FocusCycleCompact() {
  const focus = useFocusCycle();
  if (focus.phase === "IDLE" || focus.phase === "BREAK_PROMPT") return null;
  const phaseLabel = focus.phase === "BREAK" ? "休息" : "专注";
  return (
    <span
      className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1.5 text-xs font-semibold text-secondary-foreground sm:gap-1.5 sm:px-3"
      aria-label={`${phaseLabel}剩余 ${formatFocusTime(focus.remainingMs)}`}
      aria-live="polite"
    >
      <Hourglass className="size-3.5" />
      <span className="hidden md:inline">{phaseLabel}</span>
      <span className="tabular-nums">{formatFocusTime(focus.remainingMs)}</span>
    </span>
  );
}

export function FocusCycleCard() {
  const focus = useFocusCycle();
  const isBreak = focus.phase === "BREAK";
  const remaining = focus.phase === "IDLE" ? FOCUS_MINUTES * 60_000 : focus.remainingMs;
  const total = (isBreak ? BREAK_MINUTES : FOCUS_MINUTES) * 60_000;
  const progress = Math.max(0, Math.min(100, (remaining / total) * 100));
  return (
    <section className="mt-5 min-w-0 rounded-2xl border bg-card p-4 warm-shadow sm:p-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground"><Hourglass className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold">{isBreak ? "休息时间" : "整段专注"}</p>
            <time className="font-mono text-2xl font-bold tabular-nums">{formatFocusTime(remaining)}</time>
          </div>
        </div>
      </div>
      <p className="mt-3 whitespace-nowrap text-[clamp(10px,3.2vw,14px)] text-muted-foreground">{isBreak ? "休息结束后自动开始下一轮专注" : "跨任务累计专注 30 分钟，再休息 5 分钟"}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="本轮剩余时间" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-primary transition-[width] duration-1000" style={{ width: `${progress}%` }} />
      </div>
    </section>
  );
}

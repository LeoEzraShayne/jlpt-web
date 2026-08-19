"use client";

import { Hourglass } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api/client";
import type { StudyTimer } from "@/lib/api/types";

export function StudyTimerCard({
  sessionId,
  initialTimer,
}: {
  sessionId: string;
  initialTimer: StudyTimer;
}) {
  const [timer, setTimer] = useState(initialTimer);
  const [remainingMs, setRemainingMs] = useState(() =>
    remainingForTimer(initialTimer),
  );
  const advancing = useRef(false);

  useEffect(() => {
    let active = true;

    async function tick() {
      const remaining = remainingForTimer(timer);
      if (remaining > 0) {
        setRemainingMs(remaining);
        return;
      }
      setRemainingMs(0);
      if (advancing.current) return;
      advancing.current = true;
      try {
        const { data } = await apiRequest<StudyTimer>(
          `/study-sessions/${sessionId}/timer/advance`,
          { method: "POST" },
        );
        if (active) {
          setTimer(data);
          setRemainingMs(remainingForTimer(data));
        }
      } catch {
        // Keep the displayed timer at zero and retry on the next tick.
      } finally {
        advancing.current = false;
      }
    }

    void tick();
    const interval = window.setInterval(() => void tick(), 1_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [sessionId, timer]);

  const isFocus = timer.phase === "FOCUS";
  const totalMinutes = isFocus ? timer.focusMinutes : timer.breakMinutes;
  const progress = Math.max(
    0,
    Math.min(100, (remainingMs / (totalMinutes * 60_000)) * 100),
  );

  return (
    <section className="mt-5 min-w-0 rounded-2xl border bg-card p-4 warm-shadow sm:p-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <Hourglass className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold" aria-live="polite">
              {isFocus ? "专注学习" : "休息时间"}
            </p>
            <time className="font-mono text-2xl font-bold tabular-nums">
              {formatRemaining(remainingMs)}
            </time>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFocus
              ? `专注 ${timer.focusMinutes} 分钟后休息 ${timer.breakMinutes} 分钟`
              : `${timer.breakMinutes} 分钟后自动开始下一轮学习`}
          </p>
        </div>
      </div>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={isFocus ? "本轮专注剩余时间" : "本轮休息剩余时间"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
    </section>
  );
}

function formatRemaining(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function remainingForTimer(timer: StudyTimer) {
  const phaseMinutes =
    timer.phase === "FOCUS" ? timer.focusMinutes : timer.breakMinutes;
  const configuredMaximum = phaseMinutes * 60_000;
  const serverRemaining = Date.parse(timer.phaseEndsAt) - Date.now();
  return Math.min(configuredMaximum, Math.max(0, serverRemaining));
}

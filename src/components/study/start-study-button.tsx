"use client";

import { LoaderCircle, Play } from "lucide-react";
import { useRef, useState } from "react";
import { useDefaultEnter } from "@/hooks/use-default-enter";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useFocusCycle } from "@/components/focus/focus-cycle-provider";
import { apiRequest, ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { SessionMode, StudySession } from "@/lib/api/types";

export function StartStudyButton({
  grammarId,
  taskId,
  mode,
  label,
  className,
  buttonClassName,
  variant = "default",
  disabled = false,
  defaultEnter = false,
}: {
  grammarId: string;
  taskId?: string;
  mode: SessionMode;
  label: string;
  className?: string;
  buttonClassName?: string;
  variant?: "default" | "outline";
  disabled?: boolean;
  defaultEnter?: boolean;
}) {
  const router = useRouter();
  const focus = useFocusCycle();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const starting = useRef(false);
  useDefaultEnter(buttonRef, defaultEnter);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    if (starting.current || disabled) return;
    starting.current = true;
    setPending(true);
    setError("");
    try {
      const { data } = await apiRequest<{ session: StudySession }>(
        "/study-sessions",
        {
          method: "POST",
          body: JSON.stringify({ grammarId, taskId, mode }),
        },
      );
      focus.startFocus();
      router.push(`/study/${data.session.id}`);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "无法开始学习");
      setPending(false);
      starting.current = false;
    }
  }

  return (
    <div className={cn("min-w-0", className)}>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      <Button
        ref={buttonRef}
        aria-keyshortcuts={defaultEnter ? "Enter" : undefined}
        title={defaultEnter ? `${label}（Enter）` : undefined}
        onClick={start}
        disabled={pending || disabled}
        variant={variant}
        className={cn("w-full", buttonClassName)}
      >
        {pending ? <LoaderCircle className="animate-spin" /> : <Play />}
        {label}
      </Button>
    </div>
  );
}

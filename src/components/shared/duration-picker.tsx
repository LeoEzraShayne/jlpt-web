"use client";

import { ChevronDown } from "lucide-react";

const hourOptions = Array.from({ length: 9 }, (_, index) => index);
const minuteOptions = Array.from({ length: 12 }, (_, index) => index * 5);

export function DurationPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (minutes: number) => void;
}) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  function update(nextHours: number, nextMinutes: number) {
    const total = Math.min(480, Math.max(5, nextHours * 60 + nextMinutes));
    onChange(total);
  }

  return (
    <div className="min-w-0">
      <div className="grid min-w-0 grid-cols-2 gap-3">
        <label className="min-w-0">
          <span className="mb-2 block text-xs text-muted-foreground">小时</span>
          <span className="relative block min-w-0">
            <select
              aria-label="每日学习小时"
              value={hours}
              onChange={(event) => update(Number(event.target.value), minutes)}
              className="h-11 min-w-0 w-full appearance-none rounded-xl border bg-background px-3 pr-11 outline-none focus:ring-2 focus:ring-ring/40"
            >
              {hourOptions.map((hour) => (
                <option key={hour} value={hour}>
                  {hour} 小时
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2"
            />
          </span>
        </label>
        <label className="min-w-0">
          <span className="mb-2 block text-xs text-muted-foreground">分钟</span>
          <span className="relative block min-w-0">
            <select
              aria-label="每日学习分钟"
              value={minutes}
              onChange={(event) => update(hours, Number(event.target.value))}
              disabled={hours === 8}
              className="h-11 min-w-0 w-full appearance-none rounded-xl border bg-background px-3 pr-11 outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-60"
            >
              {minuteOptions.map((minute) => (
                <option key={minute} value={minute}>
                  {minute} 分钟
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2"
            />
          </span>
        </label>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        每天计划学习 {formatDuration(value)}
      </p>
    </div>
  );
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} 分钟`;
  if (!minutes) return `${hours} 小时`;
  return `${hours} 小时 ${minutes} 分钟`;
}

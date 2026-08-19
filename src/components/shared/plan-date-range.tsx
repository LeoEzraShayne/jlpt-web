"use client";

export function PlanDateRange({
  startDate,
  endDate,
  minimumStart,
  onStartDateChange,
  onEndDateChange,
}: {
  startDate: string;
  endDate: string;
  minimumStart?: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}) {
  function updateStart(value: string) {
    onStartDateChange(value);
    if (endDate && value > endDate) onEndDateChange(value);
  }

  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
      <label className="min-w-0 text-sm">
        <span className="mb-2 block text-muted-foreground">计划开始</span>
        <input
          aria-label="计划开始日期"
          type="date"
          min={minimumStart}
          max={endDate || undefined}
          required
          value={startDate}
          onChange={(event) => updateStart(event.target.value)}
          className="h-11 min-w-0 w-full rounded-xl border bg-background px-3 outline-none focus:ring-2 focus:ring-ring/40"
        />
      </label>
      <label className="min-w-0 text-sm">
        <span className="mb-2 block text-muted-foreground">计划截止</span>
        <input
          aria-label="计划截止日期"
          type="date"
          min={startDate || minimumStart}
          required
          value={endDate}
          onChange={(event) => onEndDateChange(event.target.value)}
          className="h-11 min-w-0 w-full rounded-xl border bg-background px-3 outline-none focus:ring-2 focus:ring-ring/40"
        />
      </label>
    </div>
  );
}

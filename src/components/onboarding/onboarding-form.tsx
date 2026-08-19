"use client";

import { CalendarDays, Clock3, LoaderCircle, Sparkles } from "lucide-react";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { LevelSelector } from "@/components/shared/level-selector";
import { DurationPicker } from "@/components/shared/duration-picker";
import { PlanDateRange } from "@/components/shared/plan-date-range";
import { useCurrentPlan } from "@/hooks/use-api";
import { apiRequest, ApiError } from "@/lib/api/client";
import { fallbackGrammarLevels } from "@/lib/jlpt";
import type { JlptLevel, StudyPlan } from "@/lib/api/types";

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
}).format(new Date());

export function OnboardingForm() {
  const router = useRouter();
  const currentPlan = useCurrentPlan();
  const [level, setLevel] = useState<JlptLevel>("N1");
  const [startDate, setStartDate] = useState(today);
  const [targetDate, setTargetDate] = useState("2026-12-06");
  const [dailyMinutes, setDailyMinutes] = useState(20);
  const [dailyNewLimit, setDailyNewLimit] = useState(2);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (currentPlan.data) router.replace("/today");
  }, [currentPlan.data, router]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await apiRequest<StudyPlan>("/study-plans", {
        method: "POST",
        body: JSON.stringify({
          level,
          startDate: new Date(`${startDate}T12:00:00Z`).toISOString(),
          targetDate: new Date(`${targetDate}T12:00:00Z`).toISOString(),
          dailyMinutes,
          dailyNewLimit,
        }),
      });
      await currentPlan.mutate(response.data, { revalidate: false });
      router.replace("/today");
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "计划生成失败，请重试",
      );
      setSubmitting(false);
    }
  }
  if (currentPlan.isLoading || currentPlan.data)
    return (
      <main className="soft-grid min-h-screen overflow-x-clip px-4 py-8 sm:py-14">
        <LoadingState label="正在确认学习计划…" />
      </main>
    );
  if (
    currentPlan.error &&
    !(
      currentPlan.error instanceof ApiError &&
      currentPlan.error.code === "PLAN_NOT_INITIALIZED"
    )
  )
    return (
      <main className="soft-grid min-h-screen overflow-x-clip px-4 py-8 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <ErrorState
            message={currentPlan.error.message}
            onRetry={() => void currentPlan.mutate()}
          />
        </div>
      </main>
    );
  return (
    <main className="soft-grid min-h-screen overflow-x-clip px-4 py-8 sm:py-14">
      <form onSubmit={submit} className="mx-auto min-w-0 max-w-3xl">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <Image
              src="/logo.svg"
              width={48}
              height={48}
              alt="文法トレーニング"
              className="size-10 shrink-0 sm:size-12"
            />
            <h1 className="whitespace-nowrap text-2xl font-bold sm:text-3xl">生成你的 {level} 学习计划</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            先设定一个轻松可持续的节奏，之后随时可以调整。
          </p>
        </div>
        <div className="mt-8 grid gap-5">
          <Card className="min-w-0 warm-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                目标等级
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LevelSelector
                value={level}
                levels={fallbackGrammarLevels}
                onChange={setLevel}
              />
              <p className="mt-3 text-sm text-muted-foreground">
                已收录 N1～N4 共 223 条语法。
              </p>
            </CardContent>
          </Card>
          <Card className="min-w-0 warm-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-5 text-primary" />
                计划日期
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PlanDateRange
                startDate={startDate}
                endDate={targetDate}
                minimumStart={today}
                onStartDateChange={setStartDate}
                onEndDateChange={setTargetDate}
              />
            </CardContent>
          </Card>
          <Card className="min-w-0 warm-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock3 className="size-5 text-primary" />
                每日学习时间
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <DurationPicker value={dailyMinutes} onChange={setDailyMinutes} />
              <label className="block text-sm">
                <span className="mb-2 block text-muted-foreground">
                  每天学习新语法上限：{dailyNewLimit} 个
                </span>
                <input
                  aria-label="每日新语法数量"
                  type="range"
                  min="1"
                  max="10"
                  value={dailyNewLimit}
                  onChange={(event) =>
                    setDailyNewLimit(Number(event.target.value))
                  }
                  className="w-full accent-[color:var(--primary)]"
                />
              </label>
            </CardContent>
          </Card>
        </div>
        {error && (
          <p className="mt-5 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="mt-6 h-12 w-full text-base"
        >
          {submitting && <LoaderCircle className="animate-spin" />}
          生成我的学习计划
        </Button>
      </form>
    </main>
  );
}

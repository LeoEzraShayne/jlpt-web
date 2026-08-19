"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  LogOut,
  Pause,
  Play,
  Settings2,
  TriangleAlert,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemePicker } from "@/components/theme/theme-picker";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { LevelSelector } from "@/components/shared/level-selector";
import { DurationPicker } from "@/components/shared/duration-picker";
import { PlanDateRange } from "@/components/shared/plan-date-range";
import { PageHeading } from "@/components/shared/page-heading";
import { useCurrentPlan, useMe, useStudyPlanForecast } from "@/hooks/use-api";
import { apiRequest, ApiError } from "@/lib/api/client";
import { apiKeys } from "@/lib/api/keys";
import { fallbackGrammarLevels } from "@/lib/jlpt";
import type { JlptLevel, StudyPlan, User } from "@/lib/api/types";
import { formatStudyDate } from "@/lib/study-display";

export function ProfileSettings() {
  const me = useMe();
  const plan = useCurrentPlan();
  if (me.isLoading || plan.isLoading) return <LoadingState />;
  if (me.error || plan.error || !me.data || !plan.data)
    return (
      <ErrorState
        message={me.error?.message || plan.error?.message}
        onRetry={() => {
          void me.mutate();
          void plan.mutate();
        }}
      />
    );
  return (
    <ProfileContent
      key={`${plan.data.id}-${plan.data.startDate}-${plan.data.targetDate}-${plan.data.dailyMinutes}-${plan.data.dailyNewLimit}-${plan.data.status}`}
      user={me.data}
      plan={plan.data}
      refreshPlan={() => plan.mutate()}
    />
  );
}

function ProfileContent({
  user,
  plan,
  refreshPlan,
}: {
  user: User;
  plan: StudyPlan;
  refreshPlan: () => Promise<StudyPlan | undefined>;
}) {
  const router = useRouter();
  const { cache, mutate } = useSWRConfig();
  const [level, setLevel] = useState<JlptLevel>(plan.level);
  const [dailyMinutes, setDailyMinutes] = useState(plan.dailyMinutes);
  const [dailyNewLimit, setDailyNewLimit] = useState(plan.dailyNewLimit);
  const [startDate, setStartDate] = useState(plan.startDate.slice(0, 10));
  const [targetDate, setTargetDate] = useState(plan.targetDate.slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingPlan, setEditingPlan] = useState(false);
  function resetPlanDraft() {
    setLevel(plan.level);
    setDailyMinutes(plan.dailyMinutes);
    setDailyNewLimit(plan.dailyNewLimit);
    setStartDate(plan.startDate.slice(0, 10));
    setTargetDate(plan.targetDate.slice(0, 10));
  }
  function openPlanEditor() {
    resetPlanDraft();
    setMessage("");
    setEditingPlan(true);
  }
  function cancelPlanEditor() {
    resetPlanDraft();
    setMessage("");
    setEditingPlan(false);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const body = {
        startDate: new Date(`${startDate}T12:00:00Z`).toISOString(),
        targetDate: new Date(`${targetDate}T12:00:00Z`).toISOString(),
        dailyMinutes,
        dailyNewLimit,
      };
      await apiRequest(
        level === plan.level ? "/study-plans/current" : "/study-plans",
        {
          method: level === plan.level ? "PATCH" : "POST",
          body: JSON.stringify(
            level === plan.level ? body : { ...body, level },
          ),
        },
      );
      await Promise.all([
        refreshPlan(),
        mutate(apiKeys.me),
        mutate(apiKeys.today),
        mutate(apiKeys.forecast(7)),
      ]);
      setMessage(
        level === plan.level ? "学习计划已保存" : `已切换到 ${level} 学习计划`,
      );
      setEditingPlan(false);
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }
  async function togglePlan() {
    await apiRequest("/study-plans/current", {
      method: "PATCH",
      body: JSON.stringify({
        status: plan.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
      }),
    });
    await refreshPlan();
  }
  async function logout() {
    await apiRequest("/auth/logout", { method: "POST" });
    for (const key of Array.from(cache.keys())) cache.delete(key);
    router.replace("/login");
  }
  return (
    <div className="min-w-0 max-w-full">
      <PageHeading
        title="我的学习"
        description="查看当前计划和跨设备同步的个人偏好。"
      />
      <div className="grid min-w-0 gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <div className="min-w-0 space-y-5">
          <Card className="min-w-0 warm-shadow">
            <CardContent className="flex min-w-0 items-center gap-4">
              <Avatar className="size-14 shrink-0 sm:size-16">
                {user.avatarUrl && (
                  <AvatarImage
                    src={user.avatarUrl}
                    alt={`${user.displayName} 的 Google 头像`}
                    referrerPolicy="no-referrer"
                  />
                )}
                <AvatarFallback className="bg-secondary text-xl text-secondary-foreground">
                  {user.displayName.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">{user.displayName}</h2>
                <p className="break-all text-sm text-muted-foreground">
                  {user.email}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  目标等级：JLPT {plan.level}
                </p>
              </div>
            </CardContent>
          </Card>
          <PlanForecastCard />
          <Card className="min-w-0 warm-shadow">
            <CardContent className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <h2 className="shrink-0 text-base font-semibold">界面主题</h2>
              <p className="min-w-0 flex-1 whitespace-nowrap text-sm text-muted-foreground">
                选择喜欢的颜色，登录设备会自动同步。
              </p>
              <div className="shrink-0">
                <ThemePicker />
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="min-w-0 self-start warm-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="size-5" />
              {editingPlan ? "调整学习计划" : "当前学习计划"}
              {!editingPlan && (
                <span className="ml-auto rounded-full bg-secondary px-2.5 py-1 text-xs font-normal text-secondary-foreground">
                  {formatPlanStatus(plan.status)}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editingPlan ? (
              <form onSubmit={save} className="min-w-0 space-y-5">
                <div>
                  <p className="mb-2 text-sm">目标等级</p>
                  <LevelSelector
                    value={level}
                    levels={fallbackGrammarLevels}
                    onChange={setLevel}
                  />
                </div>
                <div className="min-w-0 text-sm">
                  <p className="mb-2 flex items-center gap-2">
                    <CalendarDays className="size-4" />
                    计划日期
                  </p>
                  <PlanDateRange
                    startDate={startDate}
                    endDate={targetDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setTargetDate}
                  />
                </div>
                <div className="block min-w-0 text-sm">
                  <p className="mb-2 flex items-center gap-2">
                    <Clock3 className="size-4" />
                    每日学习时间
                  </p>
                  <DurationPicker
                    value={dailyMinutes}
                    onChange={setDailyMinutes}
                  />
                </div>
                <label className="block min-w-0 text-sm">
                  <span className="mb-2 block">
                    每天新语法上限：{dailyNewLimit} 个
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
                {message && (
                  <p className="rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
                    {message}
                  </p>
                )}
                <div className="grid min-w-0 grid-cols-2 gap-3">
                  <Button type="submit" disabled={saving}>
                    {saving && <LoaderCircle className="animate-spin" />}
                    保存调整
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelPlanEditor}
                  >
                    取消
                  </Button>
                </div>
              </form>
            ) : (
              <div className="min-w-0 space-y-5">
                <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                  <PlanSummaryItem
                    label="目标等级"
                    value={`JLPT ${plan.level}`}
                  />
                  <PlanSummaryItem
                    label="计划日期"
                    value={`${formatStudyDate(plan.startDate.slice(0, 10), true)} 至 ${formatStudyDate(plan.targetDate.slice(0, 10), true)}`}
                  />
                  <PlanSummaryItem
                    label="每日学习时间"
                    value={formatDuration(plan.dailyMinutes)}
                  />
                  <PlanSummaryItem
                    label="每天新语法上限"
                    value={`${plan.dailyNewLimit} 个`}
                  />
                </div>
                {message && (
                  <p className="rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
                    {message}
                  </p>
                )}
                <div
                  className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3"
                  aria-label="学习计划操作"
                >
                  <Button
                    type="button"
                    className="min-w-0 px-1.5 sm:px-2.5"
                    onClick={openPlanEditor}
                  >
                    <Settings2 className="hidden sm:block" />
                    调整计划
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-w-0 px-1.5 sm:px-2.5"
                    onClick={() => void togglePlan()}
                  >
                    {plan.status === "ACTIVE" ? (
                      <Pause className="hidden sm:block" />
                    ) : (
                      <Play className="hidden sm:block" />
                    )}
                    {plan.status === "ACTIVE" ? "暂停计划" : "恢复计划"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="min-w-0 px-1.5 sm:px-2.5"
                    onClick={() => void logout()}
                  >
                    <LogOut className="hidden sm:block" />
                    退出登录
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PlanSummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-secondary/50 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
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

function formatPlanStatus(status: StudyPlan["status"]) {
  if (status === "ACTIVE") return "进行中";
  if (status === "PAUSED") return "已暂停";
  return "已完成";
}

function PlanForecastCard() {
  const forecast = useStudyPlanForecast(7);
  if (forecast.isLoading)
    return (
      <Card className="min-w-0 warm-shadow">
        <CardContent className="text-sm text-muted-foreground">
          正在计算计划预估…
        </CardContent>
      </Card>
    );
  if (forecast.error || !forecast.data)
    return (
      <Card className="min-w-0 warm-shadow">
        <CardContent>
          <p className="text-sm text-muted-foreground">暂时无法生成计划预估。</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => void forecast.mutate()}
          >
            重新计算
          </Button>
        </CardContent>
      </Card>
    );
  const { days, meta } = forecast.data;
  return (
    <Card className="min-w-0 warm-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="size-5" />计划预估
        </CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        <div className="flex items-start gap-3 rounded-xl bg-secondary/60 p-3">
          {meta.planAtRisk ? (
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-orange-600" />
          ) : (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
          )}
          <div className="min-w-0 text-sm">
            <p className="font-medium">
              {meta.projectedCompletionDate
                ? `预计 ${formatStudyDate(meta.projectedCompletionDate, true)} 完成`
                : "按当前时间暂时无法完成全部新语法"}
            </p>
            <p className="mt-1 text-muted-foreground">
              目标日期：{formatStudyDate(meta.targetDate, true)}
              {meta.planAtRisk ? " · 当前节奏可能延期" : " · 当前节奏可行"}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[360px] text-sm">
            <div className="grid grid-cols-[1.3fr_repeat(3,1fr)] border-b pb-2 text-xs text-muted-foreground">
              <span>日期</span><span>复习</span><span>新学</span><span>预计</span>
            </div>
            {days.map((day) => (
              <div
                key={day.date}
                className="grid grid-cols-[1.3fr_repeat(3,1fr)] border-b py-2 last:border-0"
              >
                <span>{formatStudyDate(day.date)}</span>
                <span>{day.reviewCount} 项</span>
                <span>{day.newCount} 项</span>
                <span>{day.estimatedMinutes} 分钟</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          根据当前状态估算，假设每次复习均能记住；实际安排会持续调整。
        </p>
      </CardContent>
    </Card>
  );
}

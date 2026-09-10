"use client";
import { FormEvent, useState } from "react";
import { useSWRConfig } from "swr";
import { useMe, usePlans } from "@/hooks/use-api";
import { apiRequest } from "@/lib/api/client";
import { apiKeys } from "@/lib/api/keys";
import type {
  JlptLevel,
  StudyPlan,
  StudyPlanMode,
  User,
} from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { DurationPicker } from "@/components/shared/duration-picker";
import { PlanDateRange } from "@/components/shared/plan-date-range";
import { PlanForecastCard } from "@/components/profile/plan-forecast-card";

const levels: JlptLevel[] = ["N1", "N2", "N3", "N4"];
export const currentPlan = (plan: StudyPlan) =>
  ["ACTIVE", "PAUSED"].includes(plan.status);
const selectClass = "mt-2 w-full rounded-lg border bg-background p-2 text-sm";

export function PlansManager() {
  const me = useMe();
  const plans = usePlans();
  const { mutate } = useSWRConfig();
  async function refresh() {
    await mutate(
      (key) =>
        typeof key === "string" &&
        ["/study-plans", "/dashboard", "/review-queue", "/me"].some((prefix) =>
          key.startsWith(prefix),
        ),
    );
  }
  if (me.isLoading || plans.isLoading) return <LoadingState />;
  if (me.error || plans.error || !me.data || !plans.data)
    return (
      <ErrorState
        message={me.error?.message || plans.error?.message}
        onRetry={() => void refresh()}
      />
    );
  const user = me.data;
  const items = plans.data.items;
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">学习计划</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          每级别一个当前计划，共享每日时间。暂停后可随时恢复。
        </p>
      </div>
      <Preferences
        key={`${user.targetLevel}-${user.dailyMinutes}-${user.primaryShare}`}
        user={user}
        onSaved={refresh}
      />
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        {levels.map((level) => {
          const plan = items.find(
            (item) => item.level === level && currentPlan(item),
          );
          return (
            <LevelPlan
              key={`${level}-${JSON.stringify(plan)}`}
              level={level}
              plan={plan}
              user={user}
              onSaved={refresh}
            />
          );
        })}
      </div>
      {items.some((item) => !currentPlan(item)) && (
        <details className="rounded-xl border p-4">
          <summary>历史计划</summary>
          <ul className="mt-3 flex flex-col gap-2">
            {items
              .filter((item) => !currentPlan(item))
              .map((item) => (
                <li key={item.id}>
                  {item.level} ·{" "}
                  {item.status === "ARCHIVED" ? "已归档" : "已完成"} ·{" "}
                  {item.startDate.slice(0, 10)} ～{" "}
                  {item.targetDate.slice(0, 10)}
                </li>
              ))}
          </ul>
        </details>
      )}
    </div>
  );
}
function Preferences({
  user,
  onSaved,
}: {
  user: User;
  onSaved: () => Promise<void>;
}) {
  const [target, setTarget] = useState(user.targetLevel);
  const [minutes, setMinutes] = useState(user.dailyMinutes ?? 20);
  const [share, setShare] = useState(user.primaryShare ?? 80);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await apiRequest(apiKeys.me + "/preferences", {
        method: "PUT",
        body: JSON.stringify({
          targetLevel: target,
          dailyMinutes: minutes,
          primaryShare: share,
        }),
      });
      await onSaved();
      setMessage("每日安排已保存，今天已使用的时间继续计入总量。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>统一每日安排</CardTitle>
        <CardDescription>
          主目标优先推进，基础级别合计分享剩余份额，空余时间可互借。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="flex flex-col gap-5">
          <label className="text-sm">
            主目标
            <select
              aria-label="主目标"
              value={target}
              onChange={(e) => setTarget(e.target.value as JlptLevel)}
              className={selectClass}
            >
              {levels.map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </label>
          <div>
            <p className="mb-2 text-sm">每日总时间</p>
            <DurationPicker value={minutes} onChange={setMinutes} />
          </div>
          <label className="text-sm">
            主目标 {share}% · 基础合计 {100 - share}%
            <input
              aria-label="主目标时间份额"
              className="mt-2 w-full accent-primary"
              type="range"
              min="0"
              max="100"
              step="5"
              value={share}
              onChange={(e) => setShare(Number(e.target.value))}
            />
          </label>
          <Button disabled={busy} type="submit">
            保存每日安排
          </Button>
          {message && (
            <p role="status" className="text-sm">
              {message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
function LevelPlan({
  level,
  plan,
  user,
  onSaved,
}: {
  level: JlptLevel;
  plan?: StudyPlan;
  user: User;
  onSaved: () => Promise<void>;
}) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: user.timezone,
  }).format(new Date());
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<StudyPlanMode>(
    plan?.mode ?? (level === user.targetLevel ? "SYSTEM" : "GAP_FILL"),
  );
  const [start, setStart] = useState(plan?.startDate.slice(0, 10) ?? today);
  const [end, setEnd] = useState(
    () =>
      plan?.targetDate.slice(0, 10) ??
      new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
  );
  const [limit, setLimit] = useState(plan?.dailyNewLimit ?? 2);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [forecast, setForecast] = useState(false);
  async function save(status?: "ACTIVE" | "PAUSED") {
    setBusy(true);
    setError("");
    try {
      const body = status
        ? { status }
        : {
            mode,
            startDate: `${start}T12:00:00.000Z`,
            targetDate: `${end}T12:00:00.000Z`,
            dailyNewLimit: limit,
            ...(!plan ? { level, dailyMinutes: user.dailyMinutes ?? 20 } : {}),
          };
      await apiRequest(plan ? apiKeys.planDetail(plan.id) : apiKeys.plans, {
        method: plan ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      await onSaved();
      setEditing(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="min-w-0 self-start" aria-label={`${level} 学习计划`}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {level} {level === user.targetLevel && <Badge>主目标</Badge>}
          <Badge variant="secondary">
            {!plan ? "未建立" : plan.status === "ACTIVE" ? "进行中" : "已暂停"}
          </Badge>
        </CardTitle>
        <CardDescription>
          {plan?.mode === "SYSTEM"
            ? "系统学习"
            : plan
              ? "查漏补缺"
              : "新增计划不会切换主目标"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-4">
        {plan && !editing && (
          <p className="text-sm text-muted-foreground">
            {plan.startDate.slice(0, 10)} ～ {plan.targetDate.slice(0, 10)}
            <br />
            已学 {plan.learnedGrammar ?? 0} / {plan.totalGrammar ?? 0} ·
            每日新学上限 {plan.dailyNewLimit}
          </p>
        )}
        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
            className="flex min-w-0 flex-col gap-4"
          >
            <label className="text-sm">
              学习方式
              <select
                aria-label={`${level} 学习方式`}
                className={selectClass}
                value={mode}
                onChange={(e) => setMode(e.target.value as StudyPlanMode)}
              >
                <option value="SYSTEM">系统学习</option>
                <option value="GAP_FILL">查漏补缺</option>
              </select>
            </label>
            <p className="text-xs text-muted-foreground">
              查漏补缺只安排已学内容和你标记“需加强”的语法。
            </p>
            <PlanDateRange
              startDate={start}
              endDate={end}
              onStartDateChange={setStart}
              onEndDateChange={setEnd}
            />
            <label className="text-sm">
              每日新语法上限：{limit}
              <input
                aria-label={`${level} 每日新语法上限`}
                className="mt-2 w-full accent-primary"
                type="range"
                min="1"
                max="10"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy} type="submit">
                {plan ? "保存调整" : `创建 ${level} 计划`}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(false)}
              >
                取消
              </Button>
            </div>
          </form>
        )}
        {!editing && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setEditing(true)}>
              {plan ? "调整计划" : `建立 ${level} 计划`}
            </Button>
            {plan && (
              <>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void save(plan.status === "ACTIVE" ? "PAUSED" : "ACTIVE")
                  }
                >
                  {plan.status === "ACTIVE" ? "暂停计划" : "恢复计划"}
                </Button>
                <Button variant="ghost" onClick={() => setForecast(!forecast)}>
                  {forecast ? "收起预估" : "计划预估"}
                </Button>
              </>
            )}
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {forecast && plan && <PlanForecastCard planId={plan.id} />}
      </CardContent>
    </Card>
  );
}

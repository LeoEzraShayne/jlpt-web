"use client";

import {
  BookOpen,
  CheckCircle2,
  Clock3,
  ClockAlert,
  Info,
  RefreshCcw,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StartStudyButton } from "@/components/study/start-study-button";
import { useCurrentPlan, useMe, useToday } from "@/hooks/use-api";
import type { Dashboard, StudyTask } from "@/lib/api/types";
import {
  consumeCompletionNotice,
  formatStudyDate,
  getNewGrammarDescription,
  recallLabels,
} from "@/lib/study-display";

export function TodayDashboard() {
  const [completionNotice, setCompletionNotice] = useState<ReturnType<
    typeof consumeCompletionNotice
  >>(null);
  useEffect(() => {
    const timer = window.setTimeout(
      () => setCompletionNotice(consumeCompletionNotice()),
      0,
    );
    return () => window.clearTimeout(timer);
  }, []);
  const { data: user } = useMe();
  const planSWR = useCurrentPlan();
  const todaySWR = useToday();
  if (todaySWR.isLoading || planSWR.isLoading)
    return <LoadingState label="正在安排今日任务…" />;
  if (todaySWR.error || planSWR.error || !todaySWR.data || !planSWR.data)
    return (
      <ErrorState
        message={todaySWR.error?.message || planSWR.error?.message}
        onRetry={() => {
          void todaySWR.mutate();
          void planSWR.mutate();
        }}
      />
    );
  const data = todaySWR.data;
  const plan = planSWR.data;
  const pending = data.tasks.filter((task) => task.status !== "COMPLETED");
  const reviews = pending.filter((task) => task.type === "REVIEW");
  const newGrammar = pending.filter((task) => task.type === "LEARN");
  const nextTask = data.nextTaskId
    ? pending.find((task) => task.id === data.nextTaskId)
    : undefined;
  return (
    <div className="min-w-0 max-w-full">
      <div className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          你好，{user?.displayName}
        </h1>
        <p className="mt-2 text-muted-foreground">
          今天还有{" "}
          <strong className="text-foreground">
            {pending.length} 个学习任务
          </strong>
          ，预计{" "}
          <strong className="text-foreground">
            {data.estimatedMinutes} 分钟
          </strong>
          <span className="text-muted-foreground">
            {` · 今日预算 ${data.planning.budgetMinutes} 分钟`}
          </span>
        </p>
      </div>
      {completionNotice && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-primary/25 bg-secondary/50 p-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
          <p className="min-w-0 flex-1 text-sm leading-6">
            {completionNotice.submittedRating ===
            completionNotice.effectiveRating
              ? `已记录为“${recallLabels[completionNotice.effectiveRating]}”`
              : `你选择了“${recallLabels[completionNotice.submittedRating]}”，系统按“${recallLabels[completionNotice.effectiveRating]}”安排`}
            <span className="text-muted-foreground">
              {` · 预计 ${formatStudyDate(completionNotice.nextReviewOn)} 再次复习`}
            </span>
          </p>
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground hover:bg-background"
            aria-label="关闭完成提示"
            onClick={() => setCompletionNotice(null)}
          >
            <X className="size-4" />
          </button>
        </div>
      )}
      {data.planning.dueUnscheduledCount > 0 && (
        <PlanningWarning planning={data.planning} />
      )}
      <section
        className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(240px,.85fr)_minmax(280px,1fr)]"
        aria-label="今日学习概览"
      >
        <div className="order-1 min-w-0">
          <RecommendedTask task={nextTask} allDone={pending.length === 0} />
        </div>
        <div
          className="order-2 grid min-w-0 grid-cols-2 gap-3 sm:gap-4 xl:gap-3"
          aria-label="今日数据"
        >
          <Metric
            icon={BookOpen}
            label="今日新学"
            value={data.summary.newCount}
          />
          <Metric
            icon={RefreshCcw}
            label="待复习"
            value={data.summary.reviewCount}
          />
          <Metric
            icon={CheckCircle2}
            label="今日完成"
            value={data.summary.completedCount}
          />
          <Metric
            icon={ClockAlert}
            label="已逾期复习"
            value={data.summary.overdueReviewCount}
          />
        </div>
        <div className="order-3 min-w-0">
          <MasteryProgressCard level={plan.level} summary={data.summary} />
        </div>
      </section>
      <section className="mt-9 min-w-0">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">今日任务</h2>
          <span className="shrink-0 text-sm text-muted-foreground">
            {data.summary.completedCount} / {data.tasks.length} 完成
          </span>
        </div>
        {pending.length ? (
          <div className="space-y-8">
            {reviews.length > 0 && (
              <TaskGroup
                title="先完成复习"
                description={`完成这 ${data.requiredReviewRemaining} 项后解锁今日新语法`}
                tasks={reviews}
              />
            )}
            {newGrammar.length > 0 && (
              <TaskGroup
                title="今日新语法"
                description={getNewGrammarDescription(data)}
                tasks={newGrammar}
              />
            )}
          </div>
        ) : (
          <EmptyState
            title="今天的任务完成了"
            description="做得很好，明天继续保持这个节奏。"
          />
        )}
      </section>
    </div>
  );
}

function RecommendedTask({
  task,
  allDone,
}: {
  task?: StudyTask;
  allDone: boolean;
}) {
  if (!task)
    return allDone ? (
      <Card className="h-full border-primary/30 bg-secondary/40 warm-shadow">
        <CardContent className="flex flex-1 items-center gap-3">
          <CheckCircle2 className="size-6 text-success" />
          <div>
            <h2 className="font-semibold">今日任务全部完成</h2>
            <p className="text-sm text-muted-foreground">
              今天的学习闭环已经完成。
            </p>
          </div>
        </CardContent>
      </Card>
    ) : null;
  const isReview = task.type === "REVIEW";
  const Icon = isReview ? RefreshCcw : Sparkles;
  return (
    <Card className="h-full border-primary/40 warm-shadow">
      <CardContent className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">
            {isReview
              ? task.overdueDays > 0
                ? `最优先 · 已逾期 ${task.overdueDays} 天`
                : "最优先 · 今天到期"
              : "开始今天的新语法"}
          </p>
          <h2
            className={`${isReview ? "mt-5 sm:mt-7" : "mt-1"} break-words text-2xl font-bold`}
          >
            {task.grammar.title}
          </h2>
          {!isReview && (
            <p className="mt-1 text-sm text-muted-foreground">
              用造句检验自己是否真正掌握
            </p>
          )}
        </div>
        <TaskAction className="col-span-2 mt-auto w-full" task={task} />
      </CardContent>
    </Card>
  );
}

function MasteryProgressCard({
  level,
  summary,
}: {
  level: string;
  summary: Dashboard["summary"];
}) {
  const percent = Math.max(0, Math.min(100, summary.masteryPercent));
  return (
    <Card className="h-full min-w-0 warm-shadow">
      <CardHeader>
        <CardTitle>{level} 学习进度</CardTitle>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-1 items-center justify-center gap-4 xl:gap-3">
        <div
          className="relative size-[120px] shrink-0 xl:size-[104px]"
          role="img"
          aria-label={`${level} 达标进度 ${percent}%`}
        >
          <svg
            className="size-full -rotate-90"
            viewBox="0 0 120 120"
            aria-hidden="true"
          >
            <circle
              className="fill-none stroke-muted"
              cx="60"
              cy="60"
              r="48"
              strokeWidth="11"
            />
            <circle
              className="fill-none stroke-primary"
              cx="60"
              cy="60"
              r="48"
              pathLength="100"
              strokeDasharray={`${percent} ${100 - percent}`}
              strokeLinecap="round"
              strokeWidth="11"
            />
          </svg>
          <div className="absolute inset-0 grid place-content-center text-center">
            <strong className="text-2xl leading-none tabular-nums">
              {percent}%
            </strong>
            <span className="mt-1.5 text-[11px] leading-none text-muted-foreground">
              当前达标估计
            </span>
          </div>
        </div>
        <dl className="grid shrink-0 gap-1.5">
          <ProgressCount label="较稳定" value={summary.masteredGrammar} />
          <ProgressCount label="未掌握" value={summary.unmasteredGrammar} />
          <ProgressCount label="已学习" value={summary.learnedGrammar} />
        </dl>
      </CardContent>
    </Card>
  );
}

function PlanningWarning({ planning }: { planning: Dashboard["planning"] }) {
  return (
    <div className="mb-5 flex items-start gap-1.5 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0" />
      <span>
        还有 {planning.dueUnscheduledCount} 项到期复习顺延，新语法已自动减少。
        <Link className="ml-1 font-medium text-primary hover:underline" href="/review">
          查看队列
        </Link>
      </span>
    </div>
  );
}

function ProgressCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-[max-content_3.5rem] items-baseline gap-x-4 border-b pb-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold tabular-nums">{value} 个</dd>
    </div>
  );
}

function TaskGroup({
  title,
  description,
  tasks,
}: {
  title: string;
  description: string;
  tasks: StudyTask[];
}) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div
        className="grid min-w-0 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3"
        aria-label={`${title}任务列表`}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </section>
  );
}

function TaskCard({ task }: { task: StudyTask }) {
  return (
    <Card className="h-auto min-w-0 warm-shadow md:h-full md:min-h-56">
      <CardContent className="flex min-w-0 flex-col md:h-full">
        <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          {task.type === "LEARN"
            ? "新语法"
            : task.priorityGroup === "OVERDUE"
              ? "逾期复习"
              : "今日复习"}
        </span>
        <h3 className="mt-4 break-words text-xl font-semibold">
          {task.grammar.title}
        </h3>
        <p className="mt-2 line-clamp-2 break-words text-sm text-muted-foreground">
          {task.grammar.chineseExplanation}
        </p>
        <TaskAction className="mt-4 md:mt-auto md:pt-5" task={task} />
      </CardContent>
    </Card>
  );
}

function TaskAction({
  task,
  className,
}: {
  task: StudyTask;
  className?: string;
}) {
  return (
    <div
      className={`flex min-w-0 items-center justify-between gap-3 ${className ?? ""}`}
    >
      <span className="flex min-w-0 items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
        <Clock3 className="size-3.5 shrink-0" />
        预计 {task.estimatedMinutes} 分钟
      </span>
      <StartStudyButton
        className="shrink-0"
        buttonClassName="w-auto min-w-28 px-4 sm:min-w-32"
        grammarId={task.grammarId}
        taskId={task.id}
        mode={task.type === "LEARN" ? "LEARN" : "REVIEW"}
        label={
          task.locked
            ? "先完成复习"
            : task.type === "LEARN"
              ? "开始学习"
              : "开始复习"
        }
        disabled={task.locked}
      />
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="h-full min-w-0 [--card-spacing:--spacing(3)] warm-shadow sm:[--card-spacing:--spacing(4)] xl:[--card-spacing:--spacing(3)]">
      <CardContent className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4 xl:gap-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground sm:size-11 xl:size-9">
          <Icon className="size-4 sm:size-5 xl:size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground sm:text-sm xl:text-xs">
            {label}
          </p>
          <strong className="text-xl sm:text-2xl xl:text-xl">{value}</strong>
        </div>
      </CardContent>
    </Card>
  );
}

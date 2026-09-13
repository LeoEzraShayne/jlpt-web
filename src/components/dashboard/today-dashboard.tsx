"use client";
import { localizedText } from "@/lib/i18n/content";
import { useExplanationLocale } from "@/hooks/use-explanation-locale";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import {
  CheckCircle2,
  Clock3,
  Info,
  RefreshCcw,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { QuotaSummary } from "@/components/membership/quota-notice";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StartStudyButton } from "@/components/study/start-study-button";
import { VocabularyTodaySummary } from "@/components/vocabulary-learning/today-summary";
import { DashboardActionCard } from "@/components/dashboard/dashboard-action-card";
import { DashboardStatsCards } from "@/components/dashboard/dashboard-stats-cards";
import { usePlans, useMe, useToday } from "@/hooks/use-api";
import type { StudyTask } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { getDashboardStats, type DashboardStats } from "@/lib/dashboard-stats";
import {
  consumeCompletionNotice,
  formatStudyDate,
  recallLabels,
} from "@/lib/study-display";

export function TodayDashboard() {
  useLocale();
  return <div className="grid gap-4 md:block"><div className="order-last md:mb-4"><QuotaSummary /></div><GrammarTodayDashboard /></div>;
}

function GrammarTodayDashboard() {
  useLocale();
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
  const planSWR = usePlans();
  const todaySWR = useToday();
  if (todaySWR.isLoading || planSWR.isLoading)
    return <LoadingState label={t("正在安排今日任务…")} />;
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
  const plan = planSWR.data.items.find(item => item.level === user?.targetLevel);
  const stats = getDashboardStats(data);
  const pending = data.tasks.filter((task) => !["COMPLETED", "SKIPPED"].includes(task.status));
  const reviews = pending.filter((task) => task.type === "REVIEW");
  const newGrammar = pending.filter((task) => task.type === "LEARN");
  const nextTask = data.nextTaskId
    ? pending.find((task) => task.id === data.nextTaskId)
    : undefined;
  return (
    <div className="contents md:block md:min-w-0 md:max-w-full">
      <div className="order-first mb-2 flex flex-wrap items-end justify-between gap-4 md:order-none md:mb-6">
        <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {t("你好，")}{user?.displayName}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("今天还有")}{" "}
          <strong className="text-foreground">
            {pending.length} {t("个学习任务")}</strong>
          {t("，预计")}{" "}
          <strong className="text-foreground">
            {data.estimatedMinutes} {t("分钟")}</strong>
        </p>
        </div>
        <nav aria-label={t("学习管理")} className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link href="/plans" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">{t("管理各级别计划")}</Link>
          <Link href="/library" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">{t("词汇与表达库")}</Link>
        </nav>
      </div>
      {completionNotice && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-primary/25 bg-secondary/50 p-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
          <p className="min-w-0 flex-1 text-sm leading-6">
            {t(completionNotice.submittedRating ===
            completionNotice.effectiveRating
              ? `已记录为“${t(recallLabels[completionNotice.effectiveRating])}”`
              : `你选择了“${t(recallLabels[completionNotice.submittedRating])}”，系统按“${t(recallLabels[completionNotice.effectiveRating])}”安排`)}
            <span className="text-muted-foreground">
              {t(completionNotice.nextReviewStillDue
                ? " · 下次复习日期保持不变，内容仍待复习"
                : ` · 预计 ${formatStudyDate(completionNotice.nextReviewOn)} 再次复习`)}
              {t(completionNotice.assessmentAvailable === false && " · 本次缺少合格评分，未增加掌握证据")}
            </span>
          </p>
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground hover:bg-background"
            aria-label={t("关闭完成提示")}
            onClick={() => setCompletionNotice(null)}
          >
            <X className="size-4" />
          </button>
        </div>
      )}
      {stats.totalUnscheduled > 0 && <PlanningWarning stats={stats} />}
      <DashboardStatsCards
        level={plan?.level ?? user?.targetLevel ?? "N1"}
        stats={stats}
        estimatedMinutes={data.estimatedMinutes}
        allocation={data.allocation}
        levels={data.levels}
        recommendedTask={nextTask ? <RecommendedTask task={nextTask} /> : undefined}
        vocabularyCard={<VocabularyTodaySummary />}
      />
      <section className="mt-9 min-w-0">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{t("今日任务")}</h2>
          <span className="shrink-0 text-sm text-muted-foreground">
            {data.tasks.filter((task) => task.status === "COMPLETED").length} / {data.tasks.length} {t("完成")}</span>
        </div>
        {pending.length ? (
          <div className="space-y-8">
            {reviews.length > 0 && (
              <TaskGroup
                title={t("先完成复习")}
                description={t("各组完成今日安排的必做复习后，解锁组内新语法")}
                tasks={reviews}
              />
            )}
            {newGrammar.length > 0 && (
              <TaskGroup
                title={t("今日新语法")}
                description={t("先完成本组复习，再学习新语法")}
                tasks={newGrammar}
              />
            )}
          </div>
        ) : (
          <EmptyState
            title={planSWR.data.items.some(item => item.status === "ACTIVE") ? t("今天的任务完成了") : t("当前没有进行中的计划")}
            description={t("你仍可查看历史、手动练习，或在计划页调整安排。")}
          />
        )}
      </section>
    </div>
  );
}

function RecommendedTask({ task }: { task: StudyTask }) {
  const explanationLocale = useExplanationLocale();
  useLocale();
  const isReview = task.type === "REVIEW";
  const Icon = isReview ? RefreshCcw : Sparkles;
  return (
    <DashboardActionCard
      icon={Icon}
      ariaLabel={t("最优先复习")}
      label={isReview
        ? task.overdueDays > 0 ? t(`最优先 · 已逾期 ${task.overdueDays} 天`) : t("最优先 · 今天到期")
        : t("开始今天的新语法")}
      footer={<TaskAction className="items-end" task={task} defaultEnter />}
    >
      <h2 className="break-words text-2xl font-bold leading-snug">
        {explanationLocale === "en" ? task.grammar.displayTitle ?? task.grammar.title : task.grammar.title}
      </h2>
      {!isReview && <p className="mt-1 text-sm text-muted-foreground">{t("用造句检验自己是否真正掌握")}</p>}
    </DashboardActionCard>
  );
}

function PlanningWarning({ stats }: { stats: DashboardStats }) {
  useLocale();
  const splitCounts = [
    stats.overdueUnscheduled > 0
      ? t(`${stats.overdueUnscheduled} 项逾期`)
      : null,
    stats.dueTodayUnscheduled > 0
      ? t(`${stats.dueTodayUnscheduled} 项今日到期`)
      : null,
  ].filter(Boolean);
  const countLabel = splitCounts.length
    ? splitCounts.join("、")
    : t(`${stats.totalUnscheduled} 项到期`);
  return (
    <div className="mb-5 flex items-start gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0" />
      <span>
        {t("还有")}{countLabel} {t("复习尚未完成，可在复习队列中查看。")}<Link className="ml-1 font-medium text-primary hover:underline" href="/review">
          {t("查看队列")}</Link>
      </span>
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
  useLocale();
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-lg font-bold">{t(title)}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div
        className="grid min-w-0 grid-cols-1 items-stretch gap-3 min-[37.5rem]:grid-cols-2 lg:gap-4 xl:grid-cols-3"
        aria-label={t(`${title}任务列表`)}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </section>
  );
}

function TaskCard({ task }: { task: StudyTask }) {
  const explanationLocale = useExplanationLocale();
  useLocale();
  return (
    <Card className={cn("h-full min-w-0 warm-shadow max-lg:[--card-spacing:--spacing(3)]", task.type === "LEARN" ? "md:min-h-51" : "md:min-h-56")}>
      <CardContent className="flex h-full min-w-0 flex-col">
        <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          {task.grammar.level} · {t(task.type === "LEARN"
            ? "新语法"
            : task.priorityGroup === "OVERDUE"
              ? "逾期复习"
              : "今日复习")}
        </span>
        <h3 className="mt-4 break-words text-xl font-semibold">
          {explanationLocale === "en" ? task.grammar.displayTitle ?? task.grammar.title : task.grammar.title}
        </h3>
        <p className="mt-2 line-clamp-2 break-words text-sm text-muted-foreground">
          {localizedText(task.grammar.localized, "explanation", task.grammar.chineseExplanation, explanationLocale)}
        </p>
        <TaskAction className="mt-auto pt-4 lg:pt-5" task={task} compact />
      </CardContent>
    </Card>
  );
}

function TaskAction({
  task,
  className,
  defaultEnter = false,
  compact = false,
}: {
  task: StudyTask;
  className?: string;
  defaultEnter?: boolean;
  compact?: boolean;
}) {
  useLocale();
  return (
    <div
      className={cn("flex min-w-0 items-center justify-between gap-3", !compact && "flex-wrap gap-2", className)}
    >
      <span className={cn("flex min-w-0 items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground", !compact && "shrink-0 whitespace-nowrap px-2")}>
        <Clock3 className="size-3.5 shrink-0" />
        {t("预计")}{task.estimatedMinutes} {t("分钟")}</span>
      <StartStudyButton
        defaultEnter={defaultEnter}
        className={compact ? "ml-auto min-w-0 max-w-[60%]" : "max-w-full shrink-0"}
        buttonClassName={compact ? "h-auto max-lg:min-h-11 w-auto max-w-full whitespace-normal px-4 lg:min-w-32" : "w-auto max-w-full whitespace-nowrap px-2.5"}
        grammarId={task.grammarId}
        taskId={task.id}
        mode={task.type === "LEARN" ? "LEARN" : "REVIEW"}
        label={
          task.locked
            ? t("先完成复习")
            : task.type === "LEARN"
              ? t("开始学习")
              : t("开始复习")
        }
        disabled={task.locked}
      />
    </div>
  );
}

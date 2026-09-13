"use client";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import { BookOpen, CheckCircle2, ChevronDown, GraduationCap, RefreshCcw, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useState, type ReactNode } from "react";
import { Tooltip } from "radix-ui";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/dashboard-stats";
import type { Dashboard } from "@/lib/api/types";

const minutes = (value: number) => t(`${Number(value.toFixed(1))} 分钟`);

interface DashboardStatsCardsProps {
  level: string;
  stats: DashboardStats;
  estimatedMinutes: number;
  recommendedTask?: ReactNode;
  vocabularyCard?: ReactNode;
  allocation?: Dashboard["allocation"];
  levels?: Dashboard["levels"];
}

export function DashboardStatsCards({
  level,
  stats,
  estimatedMinutes,
  recommendedTask,
  vocabularyCard,
  allocation,
  levels,
}: DashboardStatsCardsProps) {
  useLocale();
  return (
    <section aria-label={t("今日学习概览")} className="grid min-w-0 gap-4">
      {(recommendedTask || vocabularyCard) && <div className={cn("grid min-w-0 gap-4", recommendedTask && vocabularyCard && "min-[37.5rem]:grid-cols-2")}>
        {recommendedTask && <div className="min-w-0">{recommendedTask}</div>}
        {vocabularyCard}
      </div>}
      <div className="grid min-w-0 gap-4 min-[37.5rem]:auto-rows-fr min-[37.5rem]:grid-cols-2 xl:grid-cols-4 [&:has(details[open])]:auto-rows-auto [&:has(details[open])]:items-start">
      <StatsCard
        title={t("今日剩余")}
        mobileTwoColumns
        icon={BookOpen}
        columns={2}
        items={[
          { label: "待开始复习", value: stats.pendingReview },
          { label: "待开始新语法", value: stats.pendingNew },
          {
            label: "进行中",
            value: stats.inProgressReview + stats.inProgressNew,
            detail: `复习 ${stats.inProgressReview} · 新学 ${stats.inProgressNew}`,
          },
          { label: "剩余任务用时", value: minutes(estimatedMinutes) },
        ]}
      >
        <AllocationDetails levels={levels} />
      </StatsCard>
      <StatsCard
        title={t("今日完成")}
        icon={CheckCircle2}
        completedLayout
        items={[
          { label: "完成总数", value: stats.completedTotal },
          { label: "完成复习", value: stats.completedReview },
          { label: "完成新学", value: stats.completedNew },
          {
            label: "今日实际用时",
            value: minutes(allocation?.spentMinutes ?? stats.studyMinutesToday),
            hint: "实际用时包含已完成、进行中及额外练习。",
          },
          {
            label: "其中补充逾期",
            value: stats.caughtUpOverdue,
            hint: "已包含在完成复习中",
          },
        ]}
      />
      <StatsCard
        title={t("复习总账")}
        icon={RefreshCcw}
        meta={t("启用计划合计")}
        items={[
          {
            label: "逾期待复习",
            value: stats.overdueReview,
          },
          {
            label: "今日到期复习",
            value: stats.dueTodayReview,
          },
          { label: "未来 7 天复习", value: stats.upcomingReview },
          { label: "未排入今日", value: stats.totalUnscheduled, detail: "保留在积压中，后续安排" },
        ]}
      />
      <StatsCard
        title={t(`${level} 总体进度`)}
        icon={GraduationCap}
        meta={t(`共 ${stats.progress.total} 个语法`)}
        progress={stats.progress}
        items={[
          { label: "较稳定", value: stats.progress.mastered, color: "bg-success" },
          { label: "巩固中", value: stats.progress.learning, color: "bg-primary" },
          { label: "需要加强", value: stats.progress.needsWork, color: "bg-primary/35" },
          { label: "尚未学习", value: stats.progress.notStarted, color: "bg-muted-foreground/25" },
        ]}
      />
      </div>
    </section>
  );
}

function AllocationDetails({ levels }: Pick<Dashboard, "levels">) {
  useLocale();
  if (!levels?.length) return null;
  return <details className="group mt-2 border-t border-border/60 pt-2">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
      {t("各级别今日安排")}<ChevronDown className="size-4 transition-transform group-open:rotate-180" />
    </summary>
    <div className="mt-3 space-y-3 text-xs leading-5">
      {levels?.map(item => <div key={item.planId} className="border-t border-border/60 pt-2">
        <div className="flex flex-wrap justify-between gap-x-3"><strong>{item.level} · {t(item.isPrimary ? "主目标" : "基础")}</strong><span className="text-muted-foreground">{t(item.reviewCount + item.newCount + item.completedCount === 0 ? "今日未安排" : `待办约 ${minutes(item.estimatedMinutes)}`)}</span></div>
        {item.reviewCount + item.newCount + item.completedCount > 0 && <p className="text-muted-foreground">{t("待复习")}{item.reviewCount} {t("· 待新学")}{item.newCount} {t("· 已完成")}{item.completedCount}</p>}
      </div>)}
    </div>
  </details>;
}

interface StatItem {
  label: string;
  value: number | string;
  detail?: string;
  hint?: string;
  color?: string;
}

export function StatsCard({
  title,
  icon: Icon,
  className,
  meta,
  items,
  columns = 2,
  mobileTwoColumns = false,
  completedLayout = false,
  progress,
  children,
}: {
  title: string;
  icon: LucideIcon;
  className?: string;
  meta?: string;
  items: StatItem[];
  columns?: 2 | 3;
  mobileTwoColumns?: boolean;
  completedLayout?: boolean;
  progress?: DashboardStats["progress"];
  children?: ReactNode;
}) {
  useLocale();
  return (
    <Card aria-label={title} className={cn("min-w-0 border border-border/60 shadow-none ring-0 [--card-spacing:--spacing(4)]", className)}>
      <CardContent>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2.5 text-base font-semibold">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
              <Icon className="size-4" />
            </span>
            {t(title)}
          </h2>
          {meta && <span className="text-xs leading-5 text-muted-foreground">{t(meta)}</span>}
        </div>
        {progress && progress.total > 0 && (
          <div aria-hidden="true" className="mb-3 flex h-1.5 overflow-hidden rounded-full bg-muted">
            {[
              [progress.mastered, "bg-success"],
              [progress.learning, "bg-primary"],
              [progress.needsWork, "bg-primary/35"],
              [progress.notStarted, "bg-muted-foreground/25"],
            ].map(([count, color], index) => (
              <span key={index} className={String(color)} style={{ width: `${Number(count) / progress.total * 100}%` }} />
            ))}
          </div>
        )}
        <dl className={cn("grid grid-cols-2 gap-x-4 gap-y-3", columns === 3 && (mobileTwoColumns ? "xl:grid-cols-3" : "sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-3"), completedLayout && "grid-cols-6 gap-x-3")}>
          {items.map((item, index) => (
            <div key={t(item.label)} className={cn("min-w-0 border-t border-border/60 pt-2", completedLayout && (index < 3 ? "col-span-2" : "col-span-3"))}>
              <dt className="flex items-center gap-1.5 text-xs leading-5 text-muted-foreground sm:text-sm">
                {item.color && <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${item.color}`} />}
                {item.hint ? <StatHint label={t(item.label)} hint={t(item.hint)} /> : t(item.label)}
              </dt>
              <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{item.value}</dd>
              {item.detail && <p className="mt-1 text-xs leading-5 text-muted-foreground">{t(item.detail)}</p>}
            </div>
          ))}
        </dl>
        {children}
      </CardContent>
    </Card>
  );
}

function StatHint({ label, hint }: { label: string; hint: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            ref={triggerRef}
            className="cursor-help rounded text-left underline decoration-border decoration-dotted underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
            onPointerDown={event => event.preventDefault()}
            onClick={event => {
              event.preventDefault();
              setOpen(value => !value);
            }}
          >
            {label}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={6}
            collisionPadding={12}
            onPointerDownOutside={event => {
              if (triggerRef.current?.contains(event.target as Node)) event.preventDefault();
            }}
            className="max-w-[min(16rem,calc(100vw-24px))] rounded-md bg-foreground px-3 py-2 text-xs leading-5 text-background shadow-md"
          >
            {hint}
            <Tooltip.Arrow className="fill-foreground" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

import { BookOpen, CheckCircle2, ChevronDown, GraduationCap, RefreshCcw, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/dashboard-stats";
import type { Dashboard } from "@/lib/api/types";

const minutes = (value: number) => `${Number(value.toFixed(1))} 分钟`;

interface DashboardStatsCardsProps {
  level: string;
  stats: DashboardStats;
  estimatedMinutes: number;
  recommendedTask?: ReactNode;
  budgetMinutes: number;
  allocation?: Dashboard["allocation"];
  levels?: Dashboard["levels"];
}

export function DashboardStatsCards({
  level,
  stats,
  estimatedMinutes,
  recommendedTask,
  budgetMinutes,
  allocation,
  levels,
}: DashboardStatsCardsProps) {
  return (
    <section aria-label="今日学习概览" className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-6">
      <StatsCard
        title="今日剩余"
        icon={BookOpen}
        className="xl:col-span-3"
        meta={`今日预算 ${minutes(budgetMinutes)}`}
        items={[
          { label: "待开始复习", value: stats.pendingReview },
          { label: "待开始新语法", value: stats.pendingNew },
          {
            label: "进行中",
            value: stats.inProgressReview + stats.inProgressNew,
            detail: `复习 ${stats.inProgressReview} · 新学 ${stats.inProgressNew}`,
          },
          { label: "剩余任务用时", value: minutes(estimatedMinutes) },
          { label: "可再安排时间", value: allocation ? minutes(allocation.remainingMinutes) : "—" },
          { label: "练习预留", value: allocation ? minutes(allocation.reservedMinutes ?? 0) : "—" },
        ]}
      >
        {allocation && <p className="mt-3 text-xs leading-5 text-muted-foreground">可再安排时间已扣除实际用时、练习预留及待办安排。</p>}
        <AllocationDetails allocation={allocation} levels={levels} />
      </StatsCard>
      <StatsCard
        title="今日完成"
        icon={CheckCircle2}
        className="xl:col-span-3"
        items={[
          { label: "完成总数", value: stats.completedTotal },
          { label: "完成复习", value: stats.completedReview },
          { label: "完成新学", value: stats.completedNew },
          {
            label: "其中补完逾期",
            value: stats.caughtUpOverdue,
            detail: "已包含在完成复习中",
          },
          { label: "今日实际用时", value: minutes(allocation?.spentMinutes ?? stats.studyMinutesToday) },
          { label: "超出今日预算", value: minutes(allocation?.overrunMinutes ?? Math.max(0, stats.studyMinutesToday - budgetMinutes)) },
        ]}
      >
        <p className="mt-3 text-xs leading-5 text-muted-foreground">实际用时包含已完成、进行中及额外练习。</p>
        {allocation && allocation.overrunMinutes > 0 && <p role="status" className="mt-2 text-xs font-medium text-destructive">实际已超出今日预算 {minutes(allocation.overrunMinutes)}</p>}
      </StatsCard>
      {recommendedTask && <div className="min-w-0 md:col-span-2 xl:col-span-2">{recommendedTask}</div>}
      <StatsCard
        title="复习总账"
        icon={RefreshCcw}
        className={recommendedTask ? "xl:col-span-2" : "xl:col-span-3"}
        meta="启用计划合计"
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
        title={`${level} 总体进度`}
        icon={GraduationCap}
        className={recommendedTask ? "xl:col-span-2" : "xl:col-span-3"}
        meta={`共 ${stats.progress.total} 个语法`}
        progress={stats.progress}
        items={[
          { label: "较稳定", value: stats.progress.mastered, color: "bg-success" },
          { label: "巩固中", value: stats.progress.learning, color: "bg-primary" },
          { label: "需要加强", value: stats.progress.needsWork, color: "bg-primary/35" },
          { label: "尚未学习", value: stats.progress.notStarted, color: "bg-muted-foreground/25" },
        ]}
      />
    </section>
  );
}

function AllocationDetails({ allocation, levels }: Pick<Dashboard, "allocation" | "levels">) {
  if (!allocation && !levels?.length) return null;
  return <details className="group mt-3 border-t border-border/60 pt-3">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
      级别与时间分配<ChevronDown className="size-4 transition-transform group-open:rotate-180" />
    </summary>
    <div className="mt-3 space-y-3 text-xs leading-5">
      {allocation && <div className="space-y-1 text-muted-foreground">
        <p>主目标：份额 {minutes(allocation.primaryMinutes)} · 已安排 {minutes(allocation.primaryPlannedMinutes)}</p>
        <p>基础合计：份额 {minutes(allocation.foundationMinutes)} · 已安排 {minutes(allocation.foundationPlannedMinutes)}</p>
        <p>空余份额可互借，安排时间可超过原份额。</p>
      </div>}
      {levels?.map(item => <div key={item.planId} className="border-t border-border/60 pt-2">
        <div className="flex flex-wrap justify-between gap-x-3"><strong>{item.level} · {item.isPrimary ? "主目标" : "基础"}</strong><span className="text-muted-foreground">{item.reviewCount + item.newCount + item.completedCount === 0 ? "今日未安排" : `待办约 ${minutes(item.estimatedMinutes)}`}</span></div>
        {item.reviewCount + item.newCount + item.completedCount > 0 && <p className="text-muted-foreground">待复习 {item.reviewCount} · 待新学 {item.newCount} · 已完成 {item.completedCount}</p>}
      </div>)}
    </div>
  </details>;
}

interface StatItem {
  label: string;
  value: number | string;
  detail?: string;
  color?: string;
}

function StatsCard({
  title,
  icon: Icon,
  className,
  meta,
  items,
  progress,
  children,
}: {
  title: string;
  icon: LucideIcon;
  className?: string;
  meta?: string;
  items: StatItem[];
  progress?: DashboardStats["progress"];
  children?: ReactNode;
}) {
  return (
    <Card aria-label={title} className={`min-w-0 border border-border/60 shadow-none ring-0 [--card-spacing:--spacing(5)] ${className ?? ""}`}>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2.5 text-base font-semibold">
            <span className="grid size-9 place-items-center rounded-full bg-secondary text-secondary-foreground">
              <Icon className="size-4" />
            </span>
            {title}
          </h2>
          {meta && <span className="text-xs leading-5 text-muted-foreground">{meta}</span>}
        </div>
        {progress && progress.total > 0 && (
          <div aria-hidden="true" className="mb-4 flex h-1.5 overflow-hidden rounded-full bg-muted">
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
        <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
          {items.map((item) => (
            <div key={item.label} className="min-w-0 border-t border-border/60 pt-2.5">
              <dt className="flex items-center gap-1.5 text-xs leading-5 text-muted-foreground sm:text-sm">
                {item.color && <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${item.color}`} />}
                {item.label}
              </dt>
              <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{item.value}</dd>
              {item.detail && <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>}
            </div>
          ))}
        </dl>
        {children}
      </CardContent>
    </Card>
  );
}

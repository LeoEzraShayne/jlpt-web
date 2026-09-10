import { BookOpen, CheckCircle2, GraduationCap, RefreshCcw, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/dashboard-stats";

interface DashboardStatsCardsProps {
  level: string;
  stats: DashboardStats;
  estimatedMinutes: number;
  recommendedTask?: ReactNode;
}

export function DashboardStatsCards({
  level,
  stats,
  estimatedMinutes,
  recommendedTask,
}: DashboardStatsCardsProps) {
  return (
    <section aria-label="今日学习概览" className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-6">
      {recommendedTask && <div className="min-w-0 md:col-span-2 xl:col-span-2">{recommendedTask}</div>}
      <StatsCard
        title="今日剩余"
        icon={BookOpen}
        className={recommendedTask ? "xl:col-span-2" : "xl:col-span-3"}
        meta={`计划内复习共剩 ${stats.plannedReviewRemaining} 项`}
        items={[
          { label: "待开始复习", value: stats.pendingReview },
          { label: "待开始新语法", value: stats.pendingNew },
          {
            label: "进行中",
            value: stats.inProgressReview + stats.inProgressNew,
            detail: `复习 ${stats.inProgressReview} · 新学 ${stats.inProgressNew}`,
          },
          { label: "剩余预计时间", value: `${estimatedMinutes} 分钟` },
        ]}
      />
      <StatsCard
        title="今日完成"
        icon={CheckCircle2}
        className={recommendedTask ? "xl:col-span-2" : "xl:col-span-3"}
        meta={`已完成用时 ${stats.studyMinutesToday} 分钟`}
        items={[
          { label: "完成总数", value: stats.completedTotal },
          { label: "完成复习", value: stats.completedReview },
          { label: "完成新学", value: stats.completedNew },
          {
            label: "其中补完逾期",
            value: stats.caughtUpOverdue,
            detail: "已包含在完成复习中",
          },
        ]}
      />
      <StatsCard
        title="复习总账"
        icon={RefreshCcw}
        className="xl:col-span-3"
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
        ]}
      />
      <StatsCard
        title={`${level} 总体进度`}
        icon={GraduationCap}
        className="xl:col-span-3"
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
}: {
  title: string;
  icon: LucideIcon;
  className?: string;
  meta?: string;
  items: StatItem[];
  progress?: DashboardStats["progress"];
}) {
  return (
    <Card className={`min-w-0 border border-border/60 shadow-none ring-0 [--card-spacing:--spacing(5)] ${className ?? ""}`}>
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
      </CardContent>
    </Card>
  );
}

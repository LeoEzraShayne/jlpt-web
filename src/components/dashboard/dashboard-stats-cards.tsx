import { BookOpen, CheckCircle2, GraduationCap, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/dashboard-stats";

interface DashboardStatsCardsProps {
  level: string;
  stats: DashboardStats;
  estimatedMinutes: number;
  hasRecommendedTask?: boolean;
}

export function DashboardStatsCards({
  level,
  stats,
  estimatedMinutes,
  hasRecommendedTask = false,
}: DashboardStatsCardsProps) {
  const summaryColumns = hasRecommendedTask
    ? "md:col-span-1 xl:col-span-2"
    : "md:col-span-1 xl:col-span-3";
  return (
    <>
      <StatsCard
        className={summaryColumns}
        icon={BookOpen}
        title="今日剩余"
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
        className={summaryColumns}
        icon={CheckCircle2}
        title="今日完成"
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
        className="md:col-span-1 xl:col-span-3"
        icon={RefreshCcw}
        title="复习总账"
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
        className="md:col-span-1 xl:col-span-3"
        icon={GraduationCap}
        title={`${level} 总体进度`}
        meta={`共 ${stats.progress.total} 个语法`}
        items={[
          { label: "较稳定", value: stats.progress.mastered },
          { label: "巩固中", value: stats.progress.learning },
          { label: "需要加强", value: stats.progress.needsWork },
          { label: "尚未学习", value: stats.progress.notStarted },
        ]}
      />
    </>
  );
}

interface StatItem {
  label: string;
  value: number | string;
  detail?: string;
}

function StatsCard({
  className,
  icon: Icon,
  title,
  meta,
  items,
}: {
  className?: string;
  icon: typeof BookOpen;
  title: string;
  meta?: string;
  items: StatItem[];
}) {
  return (
    <Card className={`min-w-0 warm-shadow ${className ?? ""}`}>
      <CardHeader className="flex flex-row items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
          <Icon className="size-4" />
        </span>
        <CardTitle>{title}</CardTitle>
        {meta ? (
          <span className="ml-auto text-xs text-muted-foreground">{meta}</span>
        ) : null}
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          {items.map((item) => (
            <div key={item.label} className="min-w-0 border-t pt-2">
              <dt className="text-xs leading-5 text-muted-foreground">
                {item.label}
              </dt>
              <dd className="mt-0.5 text-xl font-semibold tabular-nums">
                {item.value}
              </dd>
              {item.detail ? (
                <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                  {item.detail}
                </p>
              ) : null}
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

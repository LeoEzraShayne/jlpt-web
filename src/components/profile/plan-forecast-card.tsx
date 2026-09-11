"use client";
import { CalendarDays, CheckCircle2, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStudyPlanForecast } from "@/hooks/use-api";
import { formatStudyDate } from "@/lib/study-display";
export function PlanForecastCard({ planId }: { planId: string }) {
  const forecast = useStudyPlanForecast(7, planId);
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
                : "按当前节奏暂时无法完成全部新语法"}
            </p>
            <p className="mt-1 text-muted-foreground">
              目标日期：{formatStudyDate(meta.targetDate, true)}
              {meta.planAtRisk ? " · 当前节奏可能延期" : " · 当前节奏可行"}
            </p>
          </div>
        </div>
        <div className="min-w-0 text-sm tabular-nums">
          <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1.2fr] gap-x-1 border-b pb-2 text-xs text-muted-foreground">
            <span>日期</span><span>复习</span><span>新学</span><span className="text-right">预计</span>
          </div>
          {days.map((day) => (
            <div
              key={day.date}
              className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1.2fr] gap-x-1 border-b py-2 last:border-0"
            >
              <span>{formatStudyDate(day.date)}</span>
              <span>{day.reviewCount} 项</span>
              <span>{day.newCount} 项</span>
              <span className="text-right">{day.estimatedMinutes} 分钟</span>
            </div>
          ))}
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          根据当前状态估算，假设每次复习均能记住；实际安排会持续调整。
        </p>
      </CardContent>
    </Card>
  );
}

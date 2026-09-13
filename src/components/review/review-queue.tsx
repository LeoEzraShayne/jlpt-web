"use client";
import { localizedText } from "@/lib/i18n/content";
import { useExplanationLocale } from "@/hooks/use-explanation-locale";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import { ChevronDown, ChevronUp, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import useSWRInfinite from "swr/infinite";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GrammarSummaryCard } from "@/components/shared/grammar-summary-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeading } from "@/components/shared/page-heading";
import { StartStudyButton } from "@/components/study/start-study-button";
import { apiRequest, type ApiMeta } from "@/lib/api/client";
import type { ReviewSchedule } from "@/lib/api/types";

interface QueuePage {
  items: ReviewSchedule[];
  meta: ApiMeta;
}

const groups: Array<{
  key: ReviewSchedule["group"];
  title: string;
  tone: string;
}> = [
  { key: "OVERDUE", title: "已逾期", tone: "bg-red-50 text-red-700" },
  { key: "DUE_TODAY", title: "今天复习", tone: "bg-orange-50 text-orange-700" },
  { key: "UPCOMING", title: "未来 7 天", tone: "bg-yellow-50 text-yellow-700" },
];

const getKey = (index: number, previous: QueuePage | null, level: string) => {
  if (previous && !previous.meta.nextCursor) return null;
  const params = new URLSearchParams({ limit: "50", upcomingDays: "7" });
  if (level) params.set("level", level);
  if (index > 0 && previous?.meta.nextCursor)
    params.set("cursor", previous.meta.nextCursor);
  return `/review-queue?${params.toString()}`;
};

async function fetchQueue(path: string): Promise<QueuePage> {
  const response = await apiRequest<ReviewSchedule[]>(path);
  return { items: response.data, meta: response.meta ?? {} };
}

export function ReviewQueue() {
  const explanationLocale = useExplanationLocale();
  useLocale();
  const [level, setLevel] = useState("");
  const [showUpcoming, setShowUpcoming] = useState(false);
  const swr = useSWRInfinite<QueuePage>((index, previous) => getKey(index, previous, level), fetchQueue);
  const items = swr.data?.flatMap((page) => page.items) ?? [];
  const meta = swr.data?.[0]?.meta;
  const counts = meta?.counts ?? { overdue: 0, dueToday: 0, upcoming: 0 };
  const dueCount = counts.overdue + counts.dueToday;
  const priority = items.find((item) => item.group !== "UPCOMING");
  const hasMore = Boolean(swr.data?.at(-1)?.meta.nextCursor);
  if (swr.isLoading) return <LoadingState />;
  if (swr.error)
    return (
      <ErrorState
        message={swr.error.message}
        onRetry={() => void swr.mutate()}
      />
    );
  return (
    <div className="min-w-0 max-w-full">
      <PageHeading
        title={t("复习队列")}
        description={t(`当前有 ${dueCount} 个到期语法，系统已按逾期和薄弱程度排好顺序。`)}
      />
      <label className="mb-5 block text-sm">{t("级别筛选")}<select aria-label={t("复习级别")} className="ml-3 rounded-lg border bg-background p-2" value={level} onChange={event => setLevel(event.target.value)}><option value="">{t("全部启用计划")}</option>{["N1", "N2", "N3", "N4"].map(value => <option key={value}>{value}</option>)}</select></label>
      {priority && (
        <Card className="mb-7 border-primary/40 warm-shadow">
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">{t("最优先复习")}</p>
              <h2 className="mt-1 break-words text-xl font-bold">
                {explanationLocale === "en" ? priority.progress.grammar.displayTitle ?? priority.progress.grammar.title : priority.progress.grammar.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {priority.overdueDays > 0
                  ? t(`逾期 ${priority.overdueDays} 天`)
                  : t("今天到期")}
                {t(` · 预计 ${priority.estimatedMinutes} 分钟`)}
              </p>
            </div>
            <StartStudyButton
              className="w-full shrink-0 sm:w-auto"
              buttonClassName="sm:min-w-36"
              grammarId={priority.progress.grammar.id}
              mode="REVIEW"
              label={t("开始最优先复习")}
            />
          </CardContent>
        </Card>
      )}
      {!items.length ? (
        <EmptyState
          title={t("未来 7 天没有复习任务")}
          description={t("完成新语法学习后，系统会根据实际表现继续安排。")}
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => {
            const grouped = items.filter((item) => item.group === group.key);
            if (!grouped.length) return null;
            if (group.key === "UPCOMING" && !showUpcoming)
              return (
                <Button
                  key={group.key}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setShowUpcoming(true)}
                >
                  {t("未来 7 天还有")}{counts.upcoming} {t("项复习")}<ChevronDown />
                </Button>
              );
            return (
              <Group
                key={group.key}
                title={group.title}
                tone={group.tone}
                items={grouped}
                onCollapse={
                  group.key === "UPCOMING"
                    ? () => setShowUpcoming(false)
                    : undefined
                }
              />
            );
          })}
          {hasMore && (
            <Button
              variant="outline"
              className="w-full"
              disabled={swr.isValidating}
              onClick={() => void swr.setSize(swr.size + 1)}
            >
              {t(swr.isValidating ? "加载中…" : "加载更多")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function Group({
  title,
  tone,
  items,
  onCollapse,
}: {
  title: string;
  tone: string;
  items: ReviewSchedule[];
  onCollapse?: () => void;
}) {
  const explanationLocale = useExplanationLocale();
  useLocale();
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{t(title)}</h2>
        {onCollapse && (
          <Button size="sm" variant="ghost" onClick={onCollapse}>
            {t("收起")}<ChevronUp />
          </Button>
        )}
      </div>
      <div
        className={cn("grid min-w-0 grid-cols-1 items-stretch gap-3 md:grid-cols-2 2xl:grid-cols-3", !onCollapse && "min-[37.5rem]:grid-cols-2")}
        aria-label={t(`${title}复习列表`)}
      >
        {items.map((item) => (
          <GrammarSummaryCard
            key={item.id}
            headingLevel="h3"
            metadata={
              <span className={`max-w-full rounded-full px-2 py-1 ${tone}`}>
                {item.overdueDays > 0 ? t(`逾期 ${item.overdueDays} 天`) : t(title)}
              </span>
            }
            title={explanationLocale === "en" ? item.progress.grammar.displayTitle ?? item.progress.grammar.title : item.progress.grammar.title}
            description={localizedText(item.progress.grammar.localized, "explanation", item.progress.grammar.chineseExplanation, explanationLocale)}
            footerInfo={
              <span className="flex min-w-0 items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Clock3 className="size-3.5 shrink-0" />{t("预计")}{item.estimatedMinutes} {t("分钟")}
              </span>
            }
            action={
              <StartStudyButton
                className="ml-auto min-w-0 max-w-[60%]"
                buttonClassName="h-auto w-auto max-w-full whitespace-normal rounded-full px-3"
                grammarId={item.progress.grammar.id}
                mode="REVIEW" label={t("开始复习")} variant="outline"
              />
            }
          />
        ))}
      </div>
    </section>
  );
}

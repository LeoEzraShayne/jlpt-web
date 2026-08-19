"use client";

import { ChevronDown, ChevronUp, Clock3, RefreshCcw } from "lucide-react";
import { useState } from "react";
import useSWRInfinite from "swr/infinite";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

const getKey = (index: number, previous: QueuePage | null) => {
  if (previous && !previous.meta.nextCursor) return null;
  const params = new URLSearchParams({ limit: "50", upcomingDays: "7" });
  if (index > 0 && previous?.meta.nextCursor)
    params.set("cursor", previous.meta.nextCursor);
  return `/review-queue?${params.toString()}`;
};

async function fetchQueue(path: string): Promise<QueuePage> {
  const response = await apiRequest<ReviewSchedule[]>(path);
  return { items: response.data, meta: response.meta ?? {} };
}

export function ReviewQueue() {
  const [showUpcoming, setShowUpcoming] = useState(false);
  const swr = useSWRInfinite<QueuePage>(getKey, fetchQueue);
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
        title="复习队列"
        description={`当前有 ${dueCount} 个到期语法，系统已按逾期和薄弱程度排好顺序。`}
      />
      {priority && (
        <Card className="mb-7 border-primary/40 warm-shadow">
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">最优先复习</p>
              <h2 className="mt-1 break-words text-xl font-bold">
                {priority.progress.grammar.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {priority.overdueDays > 0
                  ? `逾期 ${priority.overdueDays} 天`
                  : "今天到期"}
                {` · 预计 ${priority.estimatedMinutes} 分钟`}
              </p>
            </div>
            <StartStudyButton
              className="w-full shrink-0 sm:w-auto"
              buttonClassName="sm:min-w-36"
              grammarId={priority.progress.grammar.id}
              mode="REVIEW"
              label="开始最优先复习"
            />
          </CardContent>
        </Card>
      )}
      {!items.length ? (
        <EmptyState
          title="未来 7 天没有复习任务"
          description="完成新语法学习后，系统会根据实际表现继续安排。"
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
                  未来 7 天还有 {counts.upcoming} 项复习
                  <ChevronDown />
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
              {swr.isValidating ? "加载中…" : "加载更多"}
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
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        {onCollapse && (
          <Button size="sm" variant="ghost" onClick={onCollapse}>
            收起 <ChevronUp />
          </Button>
        )}
      </div>
      <div
        className="grid min-w-0 items-stretch gap-3 md:grid-cols-2 2xl:grid-cols-3"
        aria-label={`${title}复习列表`}
      >
        {items.map((item) => (
          <Card key={item.id} className="h-full min-w-0 warm-shadow">
            <CardContent className="flex h-full min-w-0 flex-col gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
                  <RefreshCcw className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="break-words font-semibold leading-7">
                    {item.progress.grammar.title}
                    <span
                      className={`ml-1 inline-flex whitespace-nowrap rounded-full px-2 py-0.5 align-middle text-xs font-normal leading-5 ${tone}`}
                    >
                      {item.overdueDays > 0
                        ? `逾期 ${item.overdueDays} 天`
                        : title}
                    </span>
                  </h3>
                  <p className="mt-1 line-clamp-2 break-words text-sm text-muted-foreground">
                    {item.progress.grammar.chineseExplanation}
                  </p>
                </div>
              </div>
              <div className="mt-auto flex min-w-0 items-center justify-between gap-3 pt-2">
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Clock3 className="size-4" />预计 {item.estimatedMinutes} 分钟
                </span>
                <StartStudyButton
                  buttonClassName="w-auto min-w-24 px-4"
                  grammarId={item.progress.grammar.id}
                  mode="REVIEW"
                  label="开始复习"
                  variant="outline"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

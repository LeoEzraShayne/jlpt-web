"use client";
import { currentLocale, t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import { RotateCcw } from "lucide-react";
import Link from "next/link";
import useSWRInfinite from "swr/infinite";
import { Button } from "@/components/ui/button";
import { GrammarSummaryCard } from "@/components/shared/grammar-summary-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeading } from "@/components/shared/page-heading";
import { fetchHistoryPage, type HistoryPage } from "./history-page";
import { historyScoreTone } from "./history-score";

const getKey = (index: number, previous: HistoryPage | null) =>
  previous && !previous.nextCursor
    ? null
    : index === 0
      ? "/sentence-attempts"
      : `/sentence-attempts?cursor=${encodeURIComponent(previous?.nextCursor ?? "")}`;
export function HistoryList() {
  useLocale();
  const swr = useSWRInfinite<HistoryPage>(getKey, fetchHistoryPage, {
    refreshInterval: pages => pages?.some(page => page.hasPending) ? 5000 : 0,
  });
  const items = swr.data?.flatMap((page) => page.items) ?? [];
  const hasMore = Boolean(swr.data?.at(-1)?.nextCursor);
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
        title={t("学习记录")}
        description={t("回看自己的表达和每一次进步。")}
      />
      {items.length ? (
        <div
          className="grid min-w-0 items-stretch grid-cols-1 gap-3 min-[37.5rem]:grid-cols-2 lg:gap-4 xl:grid-cols-3"
          aria-label={t("学习记录列表")}
        >
          {items.map((attempt) => (
            <GrammarSummaryCard
              key={attempt.id}
              metadata={
                <span className="py-1 text-muted-foreground">
                  {new Date(attempt.createdAt).toLocaleString(currentLocale() === "en" ? "en-US" : "zh-CN")}
                </span>
              }
              title={attempt.grammar?.title}
              description={attempt.sentence}
              footerInfo={attempt.aiJob?.result && (
                <strong className={`text-2xl ${historyScoreTone(attempt.aiJob.result.totalScore)}`}>
                  {attempt.aiJob.result.totalScore}
                  <span className="ml-0.5 text-sm">{t("分")}</span>
                </strong>
              )}
              action={
                <Button asChild variant="outline" size="sm"
                  className="ml-auto h-auto min-w-0 max-w-[60%] rounded-full px-3 whitespace-normal max-lg:min-h-11">
                  <Link href={`/history/${attempt.id}`}><RotateCcw />{t("查看详情")}</Link>
                </Button>
              }
            />
          ))}
          {hasMore && (
            <Button
              variant="outline"
              className="col-span-full w-full max-lg:min-h-11"
              disabled={swr.isValidating}
              onClick={() => void swr.setSize(swr.size + 1)}
            >
              {t("加载更多")}</Button>
          )}
        </div>
      ) : (
        <EmptyState
          title={t("还没有已评分的记录")}
          description={t("完成一次学习任务后，AI 批改会保存在这里。")}
        />
      )}
    </div>
  );
}

"use client";

import { History, RotateCcw } from "lucide-react";
import Link from "next/link";
import useSWRInfinite from "swr/infinite";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeading } from "@/components/shared/page-heading";
import { apiRequest } from "@/lib/api/client";
import type { SentenceAttempt } from "@/lib/api/types";
import { historyScoreTone } from "./history-score";

interface Page {
  items: SentenceAttempt[];
  nextCursor?: string | null;
}
const getKey = (index: number, previous: Page | null) =>
  previous && !previous.nextCursor
    ? null
    : index === 0
      ? "/sentence-attempts"
      : `/sentence-attempts?cursor=${previous?.nextCursor}`;
async function fetchPage(path: string): Promise<Page> {
  const response = await apiRequest<SentenceAttempt[]>(path);
  return { items: response.data, nextCursor: response.meta?.nextCursor };
}

export function HistoryList() {
  const swr = useSWRInfinite<Page>(getKey, fetchPage);
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
        title="学习记录"
        description="回看自己的表达和每一次进步。"
      />
      {items.length ? (
        <div
          className="grid min-w-0 items-stretch gap-4 md:grid-cols-2 2xl:grid-cols-3"
          aria-label="学习记录列表"
        >
          {items.map((attempt) => (
            <Card key={attempt.id} className="h-full min-w-0 warm-shadow">
              <CardContent className="flex h-full min-w-0 flex-col gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
                    <History className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words font-semibold">
                      {attempt.grammar?.title}
                    </h2>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {new Date(attempt.createdAt).toLocaleString("zh-CN")}
                    </span>
                  </div>
                </div>
                <p className="line-clamp-2 break-words text-sm text-muted-foreground">
                  {attempt.sentence}
                </p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                  {attempt.aiJob?.result && (
                    <strong
                      className={`text-2xl ${historyScoreTone(attempt.aiJob.result.totalScore)}`}
                    >
                      {attempt.aiJob.result.totalScore}
                      <span className="ml-0.5 text-sm">分</span>
                    </strong>
                  )}
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                  >
                    <Link href={`/history/${attempt.id}`}>
                      <RotateCcw />
                      查看详情
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {hasMore && (
            <Button
              variant="outline"
              className="w-full md:col-span-2 2xl:col-span-3"
              disabled={swr.isValidating}
              onClick={() => void swr.setSize(swr.size + 1)}
            >
              加载更多
            </Button>
          )}
        </div>
      ) : (
        <EmptyState
          title="还没有造句记录"
          description="完成一次学习任务后，AI 批改会保存在这里。"
        />
      )}
    </div>
  );
}

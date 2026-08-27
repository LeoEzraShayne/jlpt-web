"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { LevelSelector } from "@/components/shared/level-selector";
import { PageHeading } from "@/components/shared/page-heading";
import { GrammarStatus, learningStatus } from "./grammar-status";
import { formatStudyDate } from "@/lib/study-display";
import { apiRequest } from "@/lib/api/client";
import { useGrammarLevels } from "@/hooks/use-api";
import { fallbackGrammarLevels } from "@/lib/jlpt";
import type { GrammarPoint, JlptLevel, Progress as GrammarProgress } from "@/lib/api/types";

const filters = [
  "ALL",
  "NOT_STARTED",
  "LEARNING",
  "DUE",
  "MASTERED",
  "NEEDS_WORK",
] as const;
const filterLabels = {
  ALL: "全部",
  NOT_STARTED: "未学习",
  LEARNING: "学习中",
  DUE: "待复习",
  MASTERED: "较稳定",
  NEEDS_WORK: "需加强",
};

interface GrammarPage {
  items: GrammarPoint[];
  nextCursor?: string | null;
}

function grammarKey(level: JlptLevel, query: string) {
  return (index: number, previous: GrammarPage | null) => {
    if (previous && !previous.nextCursor) return null;
    const params = new URLSearchParams({ level, limit: "30" });
    if (query) params.set("query", query);
    if (index > 0 && previous?.nextCursor)
      params.set("cursor", previous.nextCursor);
    return `/grammar-points?${params.toString()}`;
  };
}

async function fetchGrammarPage(path: string): Promise<GrammarPage> {
  const response = await apiRequest<GrammarPoint[]>(path);
  return { items: response.data, nextCursor: response.meta?.nextCursor };
}

export function GrammarLibrary() {
  const [level, setLevel] = useState<JlptLevel>("N1");
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const [filter, setFilter] = useState<(typeof filters)[number]>("ALL");
  const levels = useGrammarLevels();
  const levelItems = levels.data ?? fallbackGrammarLevels;
  const levelSummary =
    levelItems.find((item) => item.level === level) ?? fallbackGrammarLevels[0];
  const swr = useSWRInfinite<GrammarPage>(
    grammarKey(level, deferred.trim()),
    fetchGrammarPage,
  );
  const items = useMemo(
    () =>
      (swr.data?.flatMap((page) => page.items) ?? []).filter(
        (item) =>
          filter === "ALL" ||
          learningStatus(item.progress?.[0]) === filter,
      ),
    [filter, swr.data],
  );
  const hasMore = Boolean(swr.data?.at(-1)?.nextCursor);
  const emptyTitle =
    levelSummary.contentStatus === "PENDING"
      ? `${level} 内容待补充`
      : "没有找到语法";
  const emptyDescription =
    levelSummary.contentStatus === "PENDING"
      ? "该等级内容暂未开放。"
      : "换个关键词或清除筛选条件试试。";
  return (
    <div className="min-w-0 max-w-full">
      <PageHeading
        title={`${level} 语法库`}
        description={`${levelSummary.grammarCount} 个正式语法，按自己的节奏学习和巩固。`}
      />
      <div className="mb-5">
        <LevelSelector
          value={level}
          levels={levelItems}
          allowPending
          onChange={(next) => {
            setLevel(next);
            setFilter("ALL");
          }}
        />
      </div>
      <div className="mb-4 flex min-w-0 gap-3">
        <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border bg-card px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 w-full bg-transparent text-sm outline-none"
            placeholder={`搜索 ${level} 语法或中文解释`}
          />
        </label>
      </div>
      <div className="mb-6 flex max-w-full gap-2 overflow-x-auto pb-1">
        {filters.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
          >
            {filterLabels[value]}
          </Button>
        ))}
      </div>
      {swr.isLoading ? (
        <LoadingState />
      ) : swr.error ? (
        <ErrorState
          message={swr.error.message}
          onRetry={() => void swr.mutate()}
        />
      ) : items.length ? (
        <>
          <div
            className="grid min-w-0 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3"
            aria-label="语法卡片列表"
          >
            {items.map((item) => {
              const progress = item.progress?.[0];
              return (
                <Card
                  key={item.id}
                  className="min-w-0 warm-shadow md:h-full md:min-h-44"
                >
                  <CardContent className="flex min-w-0 flex-col md:h-full">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <h2 className="min-w-0 text-lg font-semibold">
                        {item.title}
                      </h2>
                      <GrammarStatus progress={progress} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {item.chineseExplanation}
                    </p>
                    <div className="mt-4 md:mt-auto md:pt-3">
                      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1 text-[11px] sm:gap-2 sm:text-xs">
                        <span className="truncate whitespace-nowrap rounded-full bg-secondary px-2 py-1 font-medium text-secondary-foreground sm:px-3">
                          {statusSummary(progress)}
                        </span>
                        <span className="whitespace-nowrap rounded-full bg-primary/10 px-2 py-1 font-medium text-primary sm:px-3">
                          {progress?.lastScore != null
                            ? `最近 ${progress.lastScore} 分`
                            : "尚未练习"}
                        </span>
                        <Button
                          asChild
                          size="sm"
                          variant={progress ? "outline" : "default"}
                          className="rounded-full px-2 text-[11px] sm:px-4 sm:text-xs"
                        >
                          <Link href={`/grammar/${item.id}`}>
                            {progress ? "查看并练习" : "开始学习"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {hasMore && (
            <Button
              variant="outline"
              className="mt-5 w-full"
              disabled={swr.isValidating}
              onClick={() => void swr.setSize(swr.size + 1)}
            >
              {swr.isValidating ? "加载中…" : "加载更多语法"}
            </Button>
          )}
        </>
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </div>
  );
}

function statusSummary(progress?: GrammarProgress) {
  const nextReviewOn = progress?.learningState?.nextReviewOn;
  if (nextReviewOn)
    return `预计 ${formatStudyDate(nextReviewOn)} 复习`;
  return progress ? "排期会随练习调整" : "尚未安排复习";
}

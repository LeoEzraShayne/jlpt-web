"use client";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { StatsCard } from "@/components/dashboard/dashboard-stats-cards";
import useSWR from "swr";
import { apiFetcher } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { StartVocabularyPractice } from "./start-practice-button";
import type { LearningSummary } from "./types";

export function VocabularyTodaySummary() {
  useLocale();
  const { data, error, mutate } = useSWR<LearningSummary>("/vocabulary-learning/summary", apiFetcher);
  return (
    <StatsCard
      title={t("今日词汇")}
      icon={BookOpen}
      completedLayout
      items={data && !error ? [
        { label: "根本不会", value: data.unknownCount },
        { label: "想练熟", value: data.practiceCount },
        { label: "已记住", value: data.rememberedCount },
        { label: "待复习", value: data.dueCount },
        { label: "今日已完成", value: data.completedTodayCount },
      ] : []}
    >
      {error ? <div role="alert" className="text-sm">{t("词汇安排暂时无法加载")}<Button size="sm" variant="ghost" onClick={() => void mutate()}>{t("重试")}</Button></div>
        : !data && <p role="status" className="text-sm text-muted-foreground">{t("正在加载词汇安排…")}</p>}
      <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-2">
        <Link href="/vocabulary-learning" className="shrink-0 whitespace-nowrap rounded-full bg-muted px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">{t("学习清单")}</Link>
        <div className="min-w-0 max-w-full">
          <StartVocabularyPractice disabled={!data || !data.dueCount || !!error}
            showPlayIcon buttonClassName="h-auto w-auto max-w-full rounded-full px-2.5 whitespace-nowrap max-lg:min-h-11" />
        </div>
      </div>
    </StatsCard>
  );
}

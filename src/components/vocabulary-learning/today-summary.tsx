"use client";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { DashboardActionCard } from "@/components/dashboard/dashboard-action-card";
import useSWR from "swr";
import { apiFetcher } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { StartVocabularyPractice } from "./start-practice-button";
import type { LearningSummary } from "./types";

export function VocabularyTodaySummary() {
  useLocale();
  const { data, error, mutate } = useSWR<LearningSummary>("/vocabulary-learning/summary", apiFetcher);
  return (
    <DashboardActionCard icon={BookOpen} label={t("今日词汇")} ariaLabel={t("今日词汇")}
      footer={
        <div className="flex min-w-0 items-center justify-between gap-3">
          <Link href="/vocabulary-learning" className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">{t("学习清单")}</Link>
          <div className="min-w-0 max-w-[65%]">
            <StartVocabularyPractice disabled={!data || !data.dueCount || !!error}
              showPlayIcon buttonClassName="h-auto w-auto max-w-full rounded-full px-4 whitespace-normal max-lg:min-h-11" />
          </div>
        </div>
      }
    >
      {error ? <div role="alert" className="mt-5 text-sm">{t("词汇安排暂时无法加载")}<Button size="sm" variant="ghost" onClick={() => void mutate()}>{t("重试")}</Button></div>
        : data ? <>
          <h2 className="mt-5 break-words text-2xl font-bold sm:mt-7">{t("待复习")}{data.dueCount}</h2>
          <p className="mt-2 text-sm">{t("今日已完成")}{data.completedTodayCount}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{t("根本不会")}{data.unknownCount} {t("· 想练熟")}{data.practiceCount} {t("· 已记住")}{data.rememberedCount}</p>
        </>
          : <p role="status" className="mt-5 text-sm text-muted-foreground">{t("正在加载词汇安排…")}</p>}
    </DashboardActionCard>
  );
}

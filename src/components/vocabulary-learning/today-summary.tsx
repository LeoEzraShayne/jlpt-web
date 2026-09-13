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
  const actions = {
    label: "学习清单",
    labelContent: <Link href="/vocabulary-learning" className="text-xs leading-5 underline underline-offset-4 hover:text-foreground">{t("学习清单")}</Link>,
    value: <StartVocabularyPractice disabled={!data || !data.dueCount || !!error}
      buttonClassName="h-auto min-h-8 min-w-max w-full max-w-full whitespace-nowrap rounded-full px-1.5! py-1 text-xs leading-4" />,
  };
  return (
    <StatsCard
      title={t("今日词汇")}
      icon={BookOpen}
      columns={3}
      className="[&_dl]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(max-content,1fr)]"
      items={data && !error ? [
        { label: "根本不会", value: data.unknownCount },
        { label: "想练熟", value: data.practiceCount },
        { label: "已记住", value: data.rememberedCount },
        { label: "待复习", value: data.dueCount },
        { label: "今日已完成", value: data.completedTodayCount },
        actions,
      ] : []}
    >
      {error ? <div role="alert" className="text-sm">{t("词汇安排暂时无法加载")}<Button size="sm" variant="ghost" onClick={() => void mutate()}>{t("重试")}</Button></div>
        : !data && <p role="status" className="text-sm text-muted-foreground">{t("正在加载词汇安排…")}</p>}
      {(!data || error) && <div className="mt-3 grid max-w-full gap-2">
        {actions.labelContent}
        {actions.value}
      </div>}
    </StatsCard>
  );
}

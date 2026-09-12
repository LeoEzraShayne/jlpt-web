"use client";
import Link from "next/link";
import useSWR from "swr";
import { apiFetcher } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { StartVocabularyPractice } from "./start-practice-button";
import type { LearningSummary } from "./types";

export function VocabularyTodaySummary() {
  const { data, error, mutate } = useSWR<LearningSummary>("/vocabulary-learning/summary", apiFetcher);
  return <section aria-label="今日词汇" className="my-5 flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-4 warm-shadow">
    <div className="min-w-0">
      <h2 className="font-semibold">今日词汇</h2>
      {error ? <div role="alert" className="text-sm">词汇安排暂时无法加载 <Button size="sm" variant="ghost" onClick={() => void mutate()}>重试</Button></div>
        : data ? <><p className="mt-1 text-sm">待复习 {data.dueCount} · 今日已完成 {data.completedTodayCount}</p><p className="mt-1 text-xs text-muted-foreground">根本不会 {data.unknownCount} · 想练熟 {data.practiceCount} · 已记住 {data.rememberedCount}</p></>
          : <p role="status" className="text-sm text-muted-foreground">正在加载词汇安排…</p>}
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <Link href="/vocabulary-learning" className="text-sm underline underline-offset-4">学习清单</Link>
      <StartVocabularyPractice disabled={!data || !data.dueCount || !!error} />
    </div>
  </section>;
}

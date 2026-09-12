"use client";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import Link from "next/link";
import useSWRInfinite from "swr/infinite";
import { apiRequest } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { LoadStatus } from "@/components/library/load-status";
import { PracticeFeedback } from "./practice-feedback";
import { outcomeLabels, reviewDate, type VocabularyPractice } from "./types";

export function VocabularyLearningHistory({ vocabularyId }: { vocabularyId: string }) {
  useLocale();
  const swr = useSWRInfinite<{ items: VocabularyPractice[]; nextCursor?: string | null }>((index, previous) => {
    if (previous && !previous.nextCursor) return null;
    return `/vocabulary/${encodeURIComponent(vocabularyId)}/learning-history?limit=20${index && previous?.nextCursor ? `&cursor=${encodeURIComponent(previous.nextCursor)}` : ""}`;
  }, async path => {
    const { data, meta } = await apiRequest<VocabularyPractice[]>(path);
    return { items: data, nextCursor: meta?.nextCursor };
  });
  const items = swr.data?.flatMap(page => page.items) ?? [];
  return <div className="mx-auto min-w-0 max-w-3xl space-y-5">
    <Link href="/vocabulary-learning" className="text-sm underline">{t("返回学习清单")}</Link>
    <h1 className="text-2xl font-bold">{t("此释义的学习历史")}</h1>
    <p className="text-sm text-muted-foreground">{t("保留每次已完成练习的原句、提示记录与词汇反馈。修改标签或停止练习不会删除历史。")}</p>
    <LoadStatus loading={swr.isLoading} error={swr.error} retry={() => void swr.mutate()} />
    {!swr.isLoading && !swr.error && !items.length && <p className="rounded-xl border p-5 text-sm">{t("此释义还没有已完成的练习。")}</p>}
    {items.map(practice => <details key={practice.id} className="min-w-0 rounded-xl border p-4">
      <summary className="cursor-pointer text-sm leading-7">{reviewDate(practice.completedAt ?? practice.createdAt)} · {t(practice.result ? outcomeLabels[practice.result.outcome] : "暂无有效评估")} · {t(practice.unknownAtStart ? "初学预览" : "无初学预览")} {t("· 提示")}{practice.hintLevel}/4</summary>
      <div className="mt-4 space-y-3"><p className="text-sm">{practice.promptZh}</p>{practice.grammar && <p className="text-xs text-muted-foreground">{t("关联语法：")}{practice.grammar.title}</p>}<PracticeFeedback practice={practice} /></div>
    </details>)}
    {swr.data?.at(-1)?.nextCursor && <Button variant="outline" disabled={swr.isValidating} onClick={() => void swr.setSize(swr.size + 1)}>{t("加载更多历史")}</Button>}
  </div>;
}

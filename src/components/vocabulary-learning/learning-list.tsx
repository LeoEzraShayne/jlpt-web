"use client";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import { useState } from "react";
import { usePaged } from "@/hooks/use-paged";
import { WordCard } from "@/components/library/word-card";
import { LoadStatus } from "@/components/library/load-status";
import { LibraryCardGrid } from "@/components/shared/library-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { listLabels, type LearningList, type LearningVocabulary } from "./types";

export function VocabularyLearningList() {
  useLocale();
  const [list, setList] = useState<LearningList>("DUE");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const swr = usePaged<LearningVocabulary>(`/vocabulary-learning?list=${list}&query=${encodeURIComponent(search)}${level ? `&level=${level}` : ""}`);
  return <div className="min-w-0 space-y-4">
    <p className="text-sm text-muted-foreground">{t("只收录你手动标记的释义。收藏不会自动加入学习清单；暂停的词汇不进入今日复习。")}</p>
    <div role="group" aria-label={t("词汇学习清单")} className="flex flex-wrap gap-2">
      {(Object.keys(listLabels) as LearningList[]).map(key => <Button key={key} size="sm" aria-pressed={list === key} variant={list === key ? "default" : "outline"} onClick={() => setList(key)}>{t(listLabels[key])}</Button>)}
    </div>
    <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); setSearch(query); }}>
      <input aria-label={t("搜索学习词汇")} placeholder={t("词形、读音或中文释义")} maxLength={100} className="min-w-0 basis-full flex-1 rounded-lg border bg-background p-2 sm:basis-auto" value={query} onChange={e => setQuery(e.target.value)} />
      <select aria-label={t("学习词汇参考级别")} className="rounded-lg border bg-background p-2" value={level} onChange={e => setLevel(e.target.value)}>
        <option value="">{t("全部级别")}</option>{["N1", "N2", "N3", "N4"].map(item => <option key={item}>{item}</option>)}
      </select>
      <Button type="submit">{t("搜索")}</Button>
    </form>
    <LoadStatus loading={swr.isLoading} error={swr.error} retry={() => void swr.mutate()} />
    {!swr.isLoading && !swr.error && !swr.items.length && <EmptyState title={t("这个清单暂时没有词汇")} description={t("可调整筛选，或在词汇查询中标记需要学习的释义。")} />}
    <LibraryCardGrid aria-label={t("学习词汇卡片列表")}>
      {swr.items.map(word => <WordCard key={word.id} word={word} refresh={() => swr.mutate()} />)}
    </LibraryCardGrid>
    {swr.more && <Button variant="outline" disabled={swr.isValidating} onClick={() => void swr.setSize(swr.size + 1)}>{t("加载更多词汇")}</Button>}
  </div>;
}

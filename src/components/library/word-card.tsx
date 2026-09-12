"use client";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import { useState } from "react";
import { apiRequest } from "@/lib/api/client";
import type { LearningVocabulary as VocabularyEntry } from "@/components/vocabulary-learning/types";
import { LearningControls } from "@/components/vocabulary-learning/learning-controls";
import { useExplanationLocale } from "@/hooks/use-explanation-locale";
import { vocabularyMeaning } from "@/lib/i18n/content";
import { chineseParts } from "@/lib/vocabulary-display";
import { LibraryCard } from "@/components/shared/library-card";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
export type Bookmark = { id: string; note: string; vocabulary: VocabularyEntry };
export function WordCard({word, bookmark, refresh}: {word: VocabularyEntry; bookmark?: Bookmark; refresh: () => Promise<unknown>}) {
  useLocale();
  const [note, setNote] = useState(bookmark?.note ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function update(remove = false) {
    setBusy(true);
    try {
      await apiRequest(`/vocabulary/${encodeURIComponent(word.id)}/bookmark`, {
        method: remove ? "DELETE" : "PUT",
        ...(!remove ? { body: JSON.stringify({ note }) } : {}),
      });
      await refresh();
      setMessage(remove ? t("已取消收藏") : t("已保存生词收藏"));
    } catch (error) { setMessage(error instanceof Error ? error.message : t("保存失败")); }
    finally { setBusy(false); }
  }
  const explanationLocale = useExplanationLocale();
  const meaning = vocabularyMeaning(word, explanationLocale);
  return <LibraryCard>
    <CardContent className="flex min-w-0 flex-col md:h-full">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <h2 className="min-w-0 text-lg font-semibold">{word.word}<span className="ml-2 inline-block text-sm font-normal text-muted-foreground">{word.reading}</span></h2>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">{t(word.level ?? "未分级")}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{explanationLocale === "en" ? word.partOfSpeech.join(", ") : chineseParts(word.partOfSpeech)}</p>
      <p className="mt-2 line-clamp-2 text-sm leading-6" title={meaning}>{meaning}</p>
      <LearningControls word={word} refresh={refresh} />
      <div className="mt-4 md:mt-auto md:pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{t(bookmark ? "已收藏" : "参考词汇")}</span>
          <div className="flex flex-wrap justify-end gap-2">
            {bookmark && <Button size="sm" variant="outline" disabled={busy} onClick={()=>void update(true)}>{t("取消收藏")}</Button>}
            <Button size="sm" className="rounded-full" disabled={busy} onClick={()=>void update()}>{t(bookmark ? "保存备注" : "收藏生词")}</Button>
          </div>
        </div>
        <details className="mt-3 text-xs text-muted-foreground">
          <summary className="cursor-pointer">{t("释义详情、备注与来源")}</summary>
          <div className="mt-3 flex min-w-0 flex-col gap-3 break-words">
            <p className="text-sm leading-6 text-foreground">{meaning}</p>
            <label>{t("个人备注")}<input aria-label={t(`${word.word} 备注`)} maxLength={2000} className="mt-1 w-full rounded-lg border bg-background p-2 text-sm" value={note} onChange={e=>setNote(e.target.value)} /></label>
            <p>{t("词典：")}{word.sourceName} · {word.sourceVersion}</p>
            <p>{t("分级依据：")}{t(word.levelSource ?? "暂无")}</p>
            {word.chineseGloss && <p>{t("中文释义来源：")}{t(word.chineseGlossSource ?? "个人补充")}</p>}
            <p>{t("许可：")}{t(word.license ?? "私人资料")} {word.sourceUrl && /^https?:\/\//.test(word.sourceUrl) && <a className="underline" href={word.sourceUrl} target="_blank" rel="noreferrer">{t("查看来源")}</a>}</p>
            <div><p className="mb-1">{t("词典原文")}</p><ul>{word.glosses.map((g,i)=><li key={i}>[{g.language}] {g.text}</li>)}</ul></div>
          </div>
        </details>
        {message && <p role="status" className="mt-2 text-xs">{t(message)}</p>}
      </div>
    </CardContent>
  </LibraryCard>;
}

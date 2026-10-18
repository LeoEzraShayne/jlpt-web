"use client";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import Link from "next/link";
import { type ReactNode, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import { apiRequest } from "@/lib/api/client";
import { refreshVocabularyLists } from "@/lib/vocabulary-cache";
import { Button } from "@/components/ui/button";
import { StartVocabularyPractice } from "./start-practice-button";
import { listLabels, reviewDate, type LearningAction, type LearningVocabulary, type VocabularyLearning } from "./types";

export function LearningControls({ word, refresh, compact = false, trailingAction }: { word: LearningVocabulary; refresh: () => Promise<unknown>; compact?: boolean; trailingAction?: ReactNode }) {
  const { locale } = useLocale();
  const { cache, mutate } = useSWRConfig();
  const [saved, setSaved] = useState<VocabularyLearning>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  // Prefer fresh server props, including changes made on another device.
  const learning = saved && (!word.learning || saved.manualRevision > word.learning.manualRevision) ? saved : word.learning;
  async function update(action: LearningAction) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage("");
    try {
      const { data } = await apiRequest<VocabularyLearning>(`/vocabulary/${encodeURIComponent(word.id)}/learning`, {
        method: "PATCH", body: JSON.stringify({ action }),
      });
      setSaved(data); setMessage(t("已更新此释义的学习状态"));
      await Promise.all([refreshVocabularyLists(cache, mutate, refresh), mutate("/vocabulary-learning/summary")]);
    } catch (e) { setMessage(e instanceof Error ? e.message : t("更新失败，请重试")); }
    finally { lock.current = false; setBusy(false); }
  }
  const active = (action: LearningAction) => action === "PRACTICE" ? !!learning?.practiceEnabled
    : learning?.knowledge === action;
  const additionalControls = <>
    <p className="text-xs text-muted-foreground">{t("按当前释义记录；标记已记住后仍可继续练习。")}</p>
    {learning && <p className="text-xs text-muted-foreground">{t(learning.paused ? "已暂停" : learning.knowledge === "UNKNOWN" ? "词义学习中" : learning.practiceEnabled ? "造句练习中" : "已退出复习")} {t("· 下次复习：")}{reviewDate(learning.nextReviewAt)}</p>}
    <div className="flex flex-wrap items-center gap-2">
      {learning && (learning.practiceEnabled || learning.knowledge === "UNKNOWN") && <>
        <StartVocabularyPractice vocabularyId={word.id} disabled={busy || learning.paused} label={learning.knowledge === "UNKNOWN" ? t("学习并练习") : t("练习此释义")} />
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => void update(learning.paused ? "RESUME" : "PAUSE")}>{t(learning.paused ? "恢复练习" : "暂停练习")}</Button>
      </>}
      {learning?.practiceEnabled && <Button size="sm" variant="ghost" disabled={busy} onClick={() => void update("STOP_PRACTICE")}>{t("停止练习")}</Button>}
      <Link className="text-xs underline underline-offset-4" href={`/vocabulary-learning/${encodeURIComponent(word.id)}/history`}>{t("学习历史")}</Link>
    </div>
  </>;
  return <div className="mt-4 flex flex-col gap-3">
    <div role="group" aria-label={t("此释义的学习状态")} className={compact ? `grid ${locale === "en" ? "grid-cols-2" : "grid-cols-4"} gap-1.5` : "flex flex-wrap gap-2"}>
      {(["UNKNOWN", "PRACTICE", "REMEMBERED"] as const).map(action => <Button className={compact ? "min-w-0 rounded-full px-1 text-xs" : undefined} key={action} size="sm" variant={active(action) ? "secondary" : "outline"} aria-pressed={active(action)} disabled={busy} onClick={() => void update(action)}>{t(listLabels[action])}</Button>)}
      {trailingAction}
    </div>
    {compact ? <details className="text-xs text-muted-foreground">
      <summary className="cursor-pointer">{t("学习安排与历史")}</summary>
      <div className="mt-3 flex flex-col gap-3">{additionalControls}</div>
    </details> : additionalControls}
    {message && <p role="status" className="text-xs">{t(message)}</p>}
  </div>;
}

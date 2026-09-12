"use client";
import { QuotaNotice } from "@/components/membership/quota-notice";
import { quotaErrorCode, billingError } from "@/components/membership/use-membership";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import Link from "next/link";
import { useRef, useState } from "react";
import useSWR from "swr";
import { ApiError, apiFetcher, apiRequest } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { FuriganaText } from "@/components/shared/furigana-text";
import { ChunkScaffold } from "./chunk-scaffold";
import { PracticeFeedback } from "./practice-feedback";
import { StartVocabularyPractice } from "./start-practice-button";
import { isPracticePending, type VocabularyPractice } from "./types";

const terminalFailureMessages: Record<string, string> = {
  LEARNING_CHANGED: "词汇标记已更新，请从清单重新开始练习",
  RETRY_LIMIT: "这次练习已达到重试次数上限，请返回清单稍后重新开始。",
};
const hintLabels = ["查看词义提示", "查看读音提示", "查看目标词", "查看打乱词块"];
export function VocabularyPracticeWorkspace({ id }: { id: string }) {
  useLocale();
  const path = `/vocabulary-practices/${encodeURIComponent(id)}`;
  const swr = useSWR<VocabularyPractice>(path, apiFetcher, {
    refreshInterval: data => isPracticePending(data) ? 1_000 : 0,
    dedupingInterval: 500,
  });
  const [sentence, setSentence] = useState("");
  const [revising, setRevising] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [quotaCode, setQuotaCode] = useState("");
  const [actionErrorCode, setActionErrorCode] = useState("");
  const [submission, setSubmission] = useState<{ sentence: string; requestKey: string }>();
  const lock = useRef(false);
  async function act(action: "hint" | "answer" | "retry") {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setActionErrorCode("");
    let body: object = {};
    if (action === "answer") {
      // Retain the immutable answer and UUID after an uncertain network response.
      const pending = submission ?? { sentence: sentence.trim(), requestKey: crypto.randomUUID() };
      setSubmission(pending); body = pending;
    }
    try {
      await swr.mutate(async () => (await apiRequest<VocabularyPractice>(`${path}/${action}`, {
        method: "POST", body: JSON.stringify(body),
      })).data, { revalidate: false });
      setRevising(false);
    } catch (e) {
      setQuotaCode(quotaErrorCode(e));
      setError(billingError(e, t));
      setActionErrorCode(e instanceof ApiError ? e.code : "");
      // Fetch persisted evidence after a timeout/conflict before showing another action.
      await swr.mutate().catch(() => undefined);
    } finally { lock.current = false; setBusy(false); }
  }
  if (swr.isLoading) return <LoadingState label={t("正在恢复词汇练习…")} />;
  if (!swr.data) return <ErrorState message={swr.error?.message} onRetry={() => void swr.mutate()} />;
  const practice = swr.data;
  const terminalMessage = terminalFailureMessages[actionErrorCode || practice.errorCode || ""];
  const ready = (practice.status === "READY" || (practice.status === "COMPLETED" && revising)) && !terminalMessage;
  const complete = practice.status === "COMPLETED" && !revising;
  const preview = practice.unknownAtStart ? practice.learningPreview : undefined;
  const lockedAnswer = revising ? submission?.sentence : practice.answer ?? submission?.sentence;
  const editingDisabled = !ready || busy || lockedAnswer !== undefined;
  return <div className="mx-auto min-w-0 max-w-3xl space-y-5 break-words">
    <QuotaNotice code={quotaCode} /><nav className="flex flex-wrap gap-4 text-sm"><Link href="/today" className="underline">{t("返回今日")}</Link><Link href="/vocabulary-learning" className="underline">{t("学习清单")}</Link>{practice.linkedStudySessionId && <Link href={`/study/${encodeURIComponent(practice.linkedStudySessionId)}`} className="underline">{t("返回关联语法练习")}</Link>}</nav>
    <div><h1 className="text-2xl font-bold">{t("词汇造句练习")}</h1><p className="mt-2 text-sm text-muted-foreground">{t("根据中文场景写一句自然的日语，逐步练习这个释义。")}</p></div>
    {!terminalMessage && (error || swr.error) && <div role="alert" className="rounded-xl border p-3 text-sm"><p>{t(error || swr.error.message)}</p><Button size="sm" variant="outline" className="mt-2" disabled={busy} onClick={() => void swr.mutate()}>{t("刷新练习状态")}</Button></div>}
    {!terminalMessage && isPracticePending(practice) && <div role="status" className="rounded-xl bg-secondary p-4 text-sm">{t(practice.status === "ASSESSING" ? "句子已保存，正在批改…" : "正在准备场景…")} {t("可以离开，稍后会恢复进度。")}</div>}
    {terminalMessage && <div role="alert" className="space-y-3 rounded-xl border p-4 text-sm"><p>{t(terminalMessage)}</p><Link href="/vocabulary-learning" className="inline-block underline underline-offset-4">{t("返回词汇学习清单")}</Link></div>}
    {!terminalMessage && practice.status === "FAILED" && <Card><CardContent className="space-y-3"><p role="alert">{t(practice.answer ? "批改暂时失败，已保留原句。" : "场景生成暂时失败。")}{t("本次未完成，请稍后重试。")}</p><Button disabled={busy} onClick={() => void act("retry")}>{t("重试")}{t(practice.answer ? "批改" : "生成")}</Button></CardContent></Card>}
    {preview && !complete && <Card><CardHeader><CardTitle>{t("先认识这个词")}</CardTitle></CardHeader><CardContent className="space-y-3"><p lang="ja" className="text-xl font-semibold">{preview.word} <span className="text-sm font-normal">{preview.reading}</span></p><p>{preview.chineseGloss}</p><p lang="ja" className="leading-9"><FuriganaText annotated={preview.exampleFurigana} fallback={preview.exampleSentence} /></p><p className="text-sm text-muted-foreground">{preview.exampleTranslationZh}</p><p className="text-xs text-muted-foreground">{t("初学预览已提供词义与例句，本次属于辅助学习，不计为独立回忆。")}</p></CardContent></Card>}
    {practice.promptZh && <Card><CardHeader><CardTitle>{t("表达场景")}</CardTitle></CardHeader><CardContent className="space-y-3"><p className="leading-7">{practice.promptZh}</p>{practice.grammar && <p className="text-sm text-muted-foreground">{t("可练习语法：")}{practice.grammar.title}{t("（自然时使用）")}</p>}</CardContent></Card>}
    {!complete && <Card><CardHeader><CardTitle>{t("写出你的句子")}</CardTitle></CardHeader><CardContent className="space-y-4">
      {practice.hintLevel >= 1 && practice.hints.meaning && <p className="text-sm">{t("词义提示：")}{practice.hints.meaning}</p>}
      {practice.hintLevel >= 2 && practice.hints.reading && <p className="text-sm">{t("读音提示：")}<span lang="ja">{practice.hints.reading}</span></p>}
      {practice.hintLevel >= 3 && practice.hints.word && <p className="text-sm">{t("目标词：")}<span lang="ja">{practice.hints.word}</span></p>}
      {ready && practice.hintLevel < 4 && <div><Button variant="outline" size="sm" disabled={busy || !!submission || !!practice.answer} onClick={() => void act("hint")}>{t(hintLabels[practice.hintLevel])}</Button><p className="mt-2 text-xs text-muted-foreground">{t("提示按词义 → 读音 → 目标词 → 词块依次展开。打开后会保留记录，本次不再计为独立回忆。")}</p></div>}
      {practice.hintLevel >= 4 && !!practice.hints.chunks?.length && <ChunkScaffold chunks={practice.hints.chunks} disabled={editingDisabled} onCompose={text => setSentence(text.slice(0, 300))} />}
      <form className="space-y-3" onSubmit={e => { e.preventDefault(); if (ready && (lockedAnswer || sentence.trim()) && !busy) void act("answer"); }}>
        <label htmlFor="vocabulary-sentence" className="text-sm font-medium">{t("日语句子")}</label>
        <Textarea id="vocabulary-sentence" lang="ja" maxLength={300} rows={4} disabled={editingDisabled} value={lockedAnswer ?? sentence} onChange={e => setSentence(e.target.value)} placeholder={t("用日语表达这个场景…")} />
        <p className="text-xs text-muted-foreground">{(lockedAnswer ?? sentence).length}{t("/300 字")}{t(submission && ready ? " · 提交内容已锁定；重试会发送同一句子。" : "")}</p>
        {ready && <Button type="submit" disabled={busy || !(lockedAnswer ?? sentence).trim()}>{t(busy ? "正在保存…" : submission ? "重试提交原句" : "提交句子")}</Button>}
      </form>
    </CardContent></Card>}
    {complete && <><PracticeFeedback practice={practice} /><Button variant="outline" onClick={() => { setSentence(practice.answer ?? ""); setSubmission(undefined); setRevising(true); setError(""); setQuotaCode(""); }}>{t("修改后重新提交")}</Button><p className="text-xs text-muted-foreground">{t("首次结果仍会保留")}</p><div className="flex flex-wrap items-center gap-4"><StartVocabularyPractice label={t("练习下一个到期词")} /><Link href={`/vocabulary-learning/${encodeURIComponent(practice.vocabularyId)}/history`} className="text-sm underline">{t("查看此释义历史")}</Link></div></>}
  </div>;
}

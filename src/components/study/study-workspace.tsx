"use client";
import { QuotaNotice } from "@/components/membership/quota-notice";
import { quotaErrorCode, billingError } from "@/components/membership/use-membership";
import { feedbackSnapshot, localizeGrammar } from "@/lib/i18n/content";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  RefreshCcw,
  Send,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/shared/error-state";
import { FuriganaText } from "@/components/shared/furigana-text";
import { LoadingState } from "@/components/shared/loading-state";
import { TrainingPanel } from "./training-panel";
import { ReviewResultCard } from "./review-result-card";
import { RecallPolicyMessage } from "./recall-policy-message";
import { DefaultStudyButton } from "./default-study-button";
import { FocusCycleCard } from "@/components/focus/focus-cycle-display";
import { apiFetcher, apiRequest, ApiError } from "@/lib/api/client";
import { apiKeys } from "@/lib/api/keys";
import { recoverableReviewError, useReviewStatus } from "@/hooks/use-review-status";
import type { AiReviewJob, RecallRating, ReviewResult, StudySession } from "@/lib/api/types";
import { saveCompletionNotice } from "@/lib/study-display";

export function StudyWorkspace({ sessionId }: { sessionId: string }) {
  useLocale();
  const router = useRouter();
  const { mutate: mutateGlobal } = useSWRConfig();
  const sessionSWR = useSWR<StudySession>(
    apiKeys.session(sessionId),
    apiFetcher,
  );
  const [showHint, setShowHint] = useState(false);
  const [sentence, setSentence] = useState("");
  const [sentenceRequired, setSentenceRequired] = useState(false);
  const sentenceInput = useRef<HTMLTextAreaElement>(null);
  const [previousCorrection, setPreviousCorrection] = useState<ReviewResult | null>(null);
  const [submittedReviewId, setSubmittedReviewId] = useState<string | null>();
  const [pollInterval, setPollInterval] = useState(1_000);
  const [submitting, setSubmitting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryRevision, setRetryRevision] = useState(0);
  const retryPending = useRef(false);
  const [completing, setCompleting] = useState(false);
  const completionPending = useRef(false);
  const submissionKey = useRef<{ sentence: string; key: string } | null>(null);
  const [message, setMessage] = useState("");
  const [quotaCode, setQuotaCode] = useState("");
  const reviewId =
    submittedReviewId === undefined
      ? sessionSWR.data?.attempts?.[0]?.aiJob?.id
      : (submittedReviewId ?? undefined);
  useEffect(() => {
    if (!reviewId) return;
    const timer = window.setTimeout(() => setPollInterval(2_000), 30_000);
    return () => window.clearTimeout(timer);
  }, [reviewId, retryRevision]);
  useEffect(() => {
    if (sessionSWR.data?.status !== "ACTIVE") return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void apiRequest(`/study-sessions/${sessionId}/activity`, {
        method: "POST",
      }).catch(() => undefined);
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [sessionId, sessionSWR.data?.status]);
  const reviewSWR = useReviewStatus(reviewId, pollInterval);
  if (sessionSWR.isLoading) return <LoadingState label={t("正在恢复学习进度…")} />;
  if (sessionSWR.error || !sessionSWR.data)
    return (
      <div className="mx-auto max-w-4xl p-5">
        <ErrorState
          message={sessionSWR.error?.message}
          onRetry={() => void sessionSWR.mutate()}
        />
      </div>
    );
  const session = sessionSWR.data;
  const grammar = localizeGrammar(session.grammar, session.explanationLocale ?? "zh");
  const hintVisible = session.mode === "REVIEW" && session.trainingContext?.referenceHidden ? false : showHint;
  const job = reviewSWR.data;
  const result = job?.result ? feedbackSnapshot(job.result) : undefined;
  const correction = result ?? previousCorrection;
  const reviewing = Boolean(
    reviewId && (!job || ["QUEUED", "PROCESSING"].includes(job.status)),
  );
  const permanentReadError = reviewSWR.error && !recoverableReviewError(reviewSWR.error);
  const submitDisabled = submitting || retrying || reviewing || Boolean(result);
  const allowedRatings = result?.recallPolicy?.allowedRatings ?? [];
  const revisionRecommended = Boolean(result && (
    result.totalScore < 80 || (result.scorePolicyVersion === "sentence-quality-v1" && (
      result.usedTargetGrammar !== true || result.targetGrammarCorrect !== true ||
      !result.isCorrect || !allowedRatings.includes("REMEMBERED")
    ))));
  async function reveal() {
    if (session.mode !== "REVIEW" && session.revealedAt) { setShowHint(true); return; }
    try {
      const { data } = await apiRequest<Partial<StudySession>>(
        `/study-sessions/${sessionId}/reveal`, {
        method: "POST",
      });
      // Only the explicit reveal response may expose review reference content.
      await sessionSWR.mutate(
        (current) => ({ ...(current ?? session), ...data }),
        { revalidate: false },
      );
      setShowHint(true);
    } catch (cause) {
      setQuotaCode(quotaErrorCode(cause));
      setShowHint(false);
      setMessage(
        cause instanceof ApiError ? cause.message : t("提示打开失败，请重试"),
      );
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitDisabled) return;
    if (!sentence.trim()) {
      setSentenceRequired(true);
      sentenceInput.current?.focus();
      return;
    }
    setSentenceRequired(false);
    setSubmitting(true);
    setQuotaCode("");
    setMessage("");
    const pending = submissionKey.current?.sentence === sentence.trim() ? submissionKey.current : { sentence: sentence.trim(), key: crypto.randomUUID() };
    submissionKey.current = pending;
    try {
      const { data } = await apiRequest<{ reviewId: string }>(
        "/sentence-reviews",
        {
          method: "POST",
          body: JSON.stringify({ sessionId, sentence: pending.sentence, requestKey: pending.key }),
        },
      );
      setPollInterval(1_000);
      setSubmittedReviewId(data.reviewId);
    } catch (cause) {
      setQuotaCode(quotaErrorCode(cause));
      setMessage(
        billingError(cause, t),
      );
    } finally {
      setSubmitting(false);
    }
  }
  async function retryJob() {
    if (!reviewId || retryPending.current || job?.canRetry === false) return;
    retryPending.current = true;
    setRetrying(true);
    setMessage("");
    try {
      const { data } = await apiRequest<AiReviewJob>(`/sentence-reviews/${reviewId}/retry`, { method: "POST" });
      setPollInterval(1_000);
      setRetryRevision(value => value + 1);
      await reviewSWR.mutate(data, { revalidate: true });
    } catch (cause) { setQuotaCode(quotaErrorCode(cause)); setMessage(billingError(cause, t)); }
    finally { retryPending.current = false; setRetrying(false); }
  }
  async function complete(rating: RecallRating, includeAiResult = true) {
    if (completionPending.current) return;
    completionPending.current = true;
    setCompleting(true);
    setMessage("");
    try {
      const { data: completed } = await apiRequest<StudySession>(
        `/study-sessions/${sessionId}/complete`, {
        method: "POST",
        body: JSON.stringify({
          recallRating: rating,
          ...(includeAiResult && result ? { sentenceReviewId: reviewId } : {}),
        }),
        },
      );
      if (completed.reviewOutcome)
        saveCompletionNotice(completed.reviewOutcome);
      await Promise.all([
        mutateGlobal(apiKeys.today),
        mutateGlobal(apiKeys.reviewQueue),
        mutateGlobal(apiKeys.history()),
        mutateGlobal(apiKeys.grammarDetail(grammar.id)),
        mutateGlobal(apiKeys.forecast(7)),
      ]);
      router.replace("/today");
    } catch (cause) {
      setQuotaCode(quotaErrorCode(cause));
      setMessage(
        cause instanceof ApiError ? cause.message : t("完成失败，请重试"),
      );
      setCompleting(false);
      completionPending.current = false;
    }
  }
  function revise() {
    submissionKey.current = null;
    setQuotaCode("");
    setPreviousCorrection(result ?? null);
    setSubmittedReviewId(null);
    setMessage(t("请重新写一句，再提交批改。"));
  }
  return (
    <main className="page-canvas min-h-screen min-w-0 max-w-full overflow-x-clip bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 min-w-0 max-w-5xl items-center gap-2 px-2 sm:px-4">
          <Button asChild variant="ghost" className="shrink-0 px-2 sm:px-4">
            <Link href="/today">
              <ArrowLeft />
              {t("退出练习")}</Link>
          </Button>
          <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
            <span className="text-sm font-medium">
              {t(session.mode === "LEARN"
                ? "新语法学习"
                : session.mode === "REVIEW"
                  ? "复习"
                  : "自由练习")}
            </span>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              {grammar.level}
            </span>
          </div>
        </div>
      </header>
      <div className="mx-auto min-w-0 max-w-4xl px-4 py-7 sm:py-10">
        <div className="min-w-0 text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">{grammar.title}</h1>
          <p className="mt-2 whitespace-nowrap text-[clamp(11px,3.45vw,16px)] text-muted-foreground">
            {t("请先回忆含义和接续，再用它造一个自己的句子。")}</p>
        </div>
        <QuotaNotice code={quotaCode} /><FocusCycleCard />
        <TrainingPanel session={session} hintVisible={hintVisible} reveal={reveal} />
        <Card className="mt-7 min-w-0 warm-shadow" size={hintVisible ? "default" : "sm"}>
          <CardHeader>
            <CardTitle className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <span>{t("语法提示")}</span>
              <Button
                variant="ghost"
                size="sm"
                aria-expanded={hintVisible}
                aria-controls="grammar-hint-content"
                onClick={() =>
                  hintVisible ? setShowHint(false) : void reveal()
                }
              >
                {hintVisible ? <EyeOff /> : <Eye />}
                {t(hintVisible ? "隐藏提示" : "查看提示")}
              </Button>
            </CardTitle>
          </CardHeader>
          {hintVisible && (
            <CardContent id="grammar-hint-content">
              <div className="flex min-w-0 flex-col gap-4">
                <Hint label={t("中文解释")} value={grammar.chineseExplanation} />
                <Hint
                  label={t("接续方式")}
                  value={grammar.connectionRule || t("资料暂未标注")}
                />
                {grammar.examples[0] && (
                  <Hint
                    label={t("参考例句")}
                    value={`${grammar.examples[0].sentence}（${grammar.examples[0].translation}）`}
                  />
                )}
              </div>
            </CardContent>
          )}
        </Card>
        <Card className="mt-6 min-w-0 warm-shadow">
          <CardHeader>
            <CardTitle>{t("造一个日语句子")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="min-w-0" onSubmit={submit}>
              {correction && (
                <div className="mb-4 min-w-0" role="status">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t(result ? "AI 修改后的句子" : "上次 AI 修改后的句子")}
                  </p>
                  <p
                    lang="ja"
                    className="mt-2 whitespace-pre-wrap break-words text-base leading-8"
                  >
                    <FuriganaText annotated={correction.correctedSentenceFurigana} fallback={correction.correctedSentence} />
                  </p>
                  {correction.correctedSentenceTranslationZh && (
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {t("中文：")}{correction.correctedSentenceTranslationZh}
                    </p>
                  )}
                </div>
              )}
              {!result && (
                <>
                  <Textarea
                    ref={sentenceInput}
                    aria-label={t("日语句子")}
                    aria-invalid={sentenceRequired}
                    aria-describedby={sentenceRequired ? "sentence-required" : undefined}
                    value={sentence}
                    onKeyDown={(event) => {
                      if (
                        event.key !== "Enter" ||
                        event.shiftKey ||
                        event.nativeEvent.isComposing ||
                        event.nativeEvent.keyCode === 229
                      )
                        return;
                      event.preventDefault();
                      if (!event.repeat && !submitDisabled)
                        event.currentTarget.form?.requestSubmit();
                    }}
                    onChange={(event) => {
                      const value = event.target.value.slice(0, 150);
                      setSentence(value);
                      if (value.trim()) setSentenceRequired(false);
                    }}
                    rows={6}
                    placeholder={t(`请使用「${grammar.title}」造句`)}
                  />
                  {sentenceRequired && (
                    <p id="sentence-required" role="alert" className="mt-2 text-sm text-destructive">
                      {t("请先输入日语句子，再提交批改。")}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                    <span>{t("Enter 提交 · Shift+Enter 换行")}</span>
                    <span>{sentence.length}/150</span>
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitDisabled}
                    className="mt-4 h-11 w-full"
                  >
                    {submitting || (reviewing && !permanentReadError) ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      permanentReadError ? <TriangleAlert /> : <Send />
                    )}
                    {t(reviewing
                      ? permanentReadError ? "无法获取批改结果" : reviewSWR.error ? "正在获取批改结果…" : "AI 正在批改…"
                      : "提交给 AI 批改")}
                  </Button>
                  {reviewSWR.error && reviewing && <p role="status" className="mt-3 text-sm text-muted-foreground">{t(reviewSWR.error.status === 429 ? "结果查询过于频繁，等待限流解除后会自动恢复，请勿重复提交。" : recoverableReviewError(reviewSWR.error) ? "连接暂时中断，正在恢复批改状态…" : reviewSWR.error.status === 401 ? "登录已失效，请重新登录后查看批改结果。" : "无法读取批改结果，请刷新页面确认登录状态；无需重复提交句子。")}</p>}
                  {job?.status === "FAILED" && (
                    <div className="mt-4 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
                      <p className="flex items-start gap-2">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                        {t(reviewFailureMessage(job))}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        disabled={retrying || !(job.canRetry ?? job.retryCount < 4)}
                        onClick={() => void retryJob()}
                      >
                        {t(retrying ? "正在重新批改…" : "重新批改")}</Button>
                      {!(job.canRetry ?? job.retryCount < 4) && <p className="mt-2">{t("本次批改已达到重试次数上限。")}</p>}
                      <p className="mt-3 text-xs text-muted-foreground">
                        {t("也可以按真实回忆情况完成。缺少合格评分时，本次不增加掌握证据或延长间隔。")}</p>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {[
                          ["FORGOT", t("忘记了")],
                          ["FUZZY", t("有些模糊")],
                          ["REMEMBERED", t("记住了")],
                        ].map(([rating, label]) => (
                          <Button
                            key={rating}
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={completing}
                            onClick={() =>
                              void complete(rating as RecallRating, false)
                            }
                          >
                            {t(label)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </form>
          </CardContent>
        </Card>
        {result && (
          <div className="mt-6 min-w-0">
            <ReviewResultCard result={result} showCorrection={false} />
            <div className="mt-6 min-w-0">
              <div className="flex min-w-0 flex-col rounded-2xl border bg-card p-5">
                <h2 className="font-semibold">{t("这次记得怎么样？")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("系统会结合你的真实回忆和本次目标语法表现安排复习。")}</p>
                {result.recallPolicy &&
                  result.recallPolicy.reason !== "NONE" && (
                    <RecallPolicyMessage reason={result.recallPolicy.reason} scorePolicyVersion={result.scorePolicyVersion} />
                  )}
                {allowedRatings.length === 0 ? (
                  <div className="mt-auto pt-4">
                    <DefaultStudyButton disabled={completing} onClick={revise} title={t("修改后重新提交")}>
                      <RefreshCcw />
                      {t("修改后重新提交")}</DefaultStudyButton>
                  </div>
                ) : (
                  <div className="mt-auto grid auto-cols-fr grid-flow-col gap-2 pt-4 sm:gap-3">
                    {allowedRatings.includes("FORGOT") && <Button
                      className="min-w-0 px-2 text-xs sm:text-sm"
                      variant="outline"
                      disabled={completing}
                      onClick={() => void complete("FORGOT")}
                    >
                      {t("忘记了")}</Button>}
                    {allowedRatings.includes("FUZZY") && <Button
                      className="min-w-0 px-2 text-xs sm:text-sm"
                      variant="outline"
                      disabled={completing}
                      onClick={() => void complete("FUZZY")}
                    >
                      {t("有些模糊")}</Button>}
                    {allowedRatings.includes("REMEMBERED") && (
                      revisionRecommended ? (
                        <Button variant="outline" disabled={completing}
                          onClick={() => void complete("REMEMBERED")}>
                          {t("记住了")}</Button>
                      ) : (
                        <DefaultStudyButton disabled={completing}
                          onClick={() => void complete("REMEMBERED")} title={t("记住了")}>
                          {t("记住了")}</DefaultStudyButton>
                      )
                    )}
                    {revisionRecommended && (
                      <DefaultStudyButton disabled={completing} onClick={revise} title={t("修改后重试")}>
                        <RefreshCcw className="hidden sm:block" />
                        {t("修改后重试")}</DefaultStudyButton>
                    )}
                  </div>
                )}
                {revisionRecommended && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("首次结果仍会保留")}</p>
                )}
              </div>
            </div>
          </div>
        )}
        {message && (
          <p className="mt-4 rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
            {t(message)}
          </p>
        )}
      </div>
    </main>
  );
}

function reviewFailureMessage(job: AiReviewJob) {
  if (["AI_TIMEOUT", "AI_NETWORK_ERROR", "AI_REVIEW_DEADLINE"].includes(job.errorCode ?? ""))
    return t("AI 批改响应超时，请稍后重新批改。");
  return t("AI 批改服务暂时不可用，请稍后重新批改。");
}

function Hint({ label, value }: { label: string; value: string }) {
  useLocale();
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{t(label)}</p>
      <p className="mt-1 leading-7">{value}</p>
    </div>
  );
}

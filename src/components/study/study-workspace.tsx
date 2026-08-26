"use client";

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
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { ReviewResultCard } from "./review-result-card";
import { FocusCycleCard } from "@/components/focus/focus-cycle-display";
import { apiFetcher, apiRequest, ApiError } from "@/lib/api/client";
import { apiKeys } from "@/lib/api/keys";
import type { AiReviewJob, RecallRating, ReviewResult, StudySession } from "@/lib/api/types";
import { saveCompletionNotice } from "@/lib/study-display";

const scenes = ["生命安全", "工作责任", "社会问题", "自由造句"];

export function StudyWorkspace({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { mutate: mutateGlobal } = useSWRConfig();
  const sessionSWR = useSWR<StudySession>(
    apiKeys.session(sessionId),
    apiFetcher,
  );
  const [showHint, setShowHint] = useState(false);
  const [sentence, setSentence] = useState("");
  const [scene, setScene] = useState(scenes[3]);
  const [submittedReviewId, setSubmittedReviewId] = useState<string | null>();
  const [pollInterval, setPollInterval] = useState(500);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [message, setMessage] = useState("");
  const reviewId =
    submittedReviewId === undefined
      ? sessionSWR.data?.attempts?.[0]?.aiJob?.id
      : (submittedReviewId ?? undefined);
  useEffect(() => {
    if (!reviewId) return;
    const timer = window.setTimeout(() => setPollInterval(2_000), 30_000);
    return () => window.clearTimeout(timer);
  }, [reviewId]);
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
  const reviewSWR = useSWR<AiReviewJob>(
    reviewId ? apiKeys.review(reviewId) : null,
    apiFetcher,
    {
      refreshInterval: (job) =>
        !job || ["QUEUED", "PROCESSING"].includes(job.status)
          ? pollInterval
          : 0,
    },
  );
  if (sessionSWR.isLoading) return <LoadingState label="正在恢复学习进度…" />;
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
  const grammar = session.grammar;
  const job = reviewSWR.data;
  const result = job?.result;
  const allowedRatings = result?.recallPolicy?.allowedRatings ?? [];
  async function reveal() {
    setShowHint(true);
    if (!session.revealedAt) {
      await apiRequest(`/study-sessions/${sessionId}/reveal`, {
        method: "POST",
      });
      void sessionSWR.mutate();
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!sentence.trim() || submitting) return;
    setSubmitting(true);
    setMessage("");
    try {
      const { data } = await apiRequest<{ reviewId: string }>(
        "/sentence-reviews",
        {
          method: "POST",
          body: JSON.stringify({ sessionId, sentence: sentence.trim(), scene }),
        },
      );
      setPollInterval(500);
      setSubmittedReviewId(data.reviewId);
    } catch (cause) {
      setMessage(
        cause instanceof ApiError ? cause.message : "提交失败，请重试",
      );
    } finally {
      setSubmitting(false);
    }
  }
  async function retryJob() {
    if (!reviewId) return;
    await apiRequest(`/sentence-reviews/${reviewId}/retry`, { method: "POST" });
    setPollInterval(500);
    void reviewSWR.mutate();
  }
  async function complete(rating: RecallRating, includeAiResult = true) {
    if (completing) return;
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
      setMessage(
        cause instanceof ApiError ? cause.message : "完成失败，请重试",
      );
      setCompleting(false);
    }
  }
  function revise() {
    setSubmittedReviewId(null);
    setSentence(result?.correctedSentence ?? sentence);
    setMessage("请修改句子后再次提交批改。");
  }
  return (
    <main className="min-h-screen min-w-0 max-w-full overflow-x-clip bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 min-w-0 max-w-5xl items-center justify-between gap-2 px-2 sm:px-4">
          <Button asChild variant="ghost" className="shrink-0 px-2 sm:px-4">
            <Link href="/today">
              <ArrowLeft />
              退出练习
            </Link>
          </Button>
          <span className="min-w-0 truncate text-sm font-medium">
            {session.mode === "LEARN"
              ? "新语法学习"
              : session.mode === "REVIEW"
                ? "复习"
                : "自由练习"}
          </span>
          <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            {grammar.level}
          </span>
        </div>
      </header>
      <div className="mx-auto min-w-0 max-w-4xl px-4 py-7 sm:py-10">
        <div className="min-w-0 text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">{grammar.title}</h1>
          <p className="mt-2 text-muted-foreground">
            请先回忆含义和接续，再用它造一个自己的句子。
          </p>
        </div>
        <FocusCycleCard />
        <Card className="mt-7 min-w-0 warm-shadow">
          <CardHeader>
            <CardTitle className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <span>语法提示</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (showHint ? setShowHint(false) : void reveal())}
              >
                {showHint ? <EyeOff /> : <Eye />}
                {showHint ? "隐藏提示" : "查看提示"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showHint ? (
              <div className="min-w-0 space-y-4">
                <Hint label="中文解释" value={grammar.chineseExplanation} />
                <Hint
                  label="接续方式"
                  value={grammar.connectionRule || "资料暂未标注"}
                />
                {grammar.examples[0] && (
                  <Hint
                    label="参考例句"
                    value={`${grammar.examples[0].sentence}（${grammar.examples[0].translation}）`}
                  />
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground sm:p-7">
                尽量先凭记忆造句，需要时再查看提示。
              </div>
            )}
          </CardContent>
        </Card>
        {result ? (
          <div className="mt-6 min-w-0">
            <ReviewResultCard result={result} />
            <div className="mt-6 min-w-0 rounded-2xl border bg-card p-5">
              <h2 className="font-semibold">这次记得怎么样？</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                系统会结合你的真实回忆和本次目标语法表现安排复习。
              </p>
              {result.recallPolicy &&
                result.recallPolicy.reason !== "NONE" && (
                  <RecallPolicyMessage reason={result.recallPolicy.reason} />
                )}
              {allowedRatings.length === 0 ? (
                <Button className="mt-4 w-full" onClick={revise}>
                  <RefreshCcw />
                  修改后重新提交
                </Button>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Button
                    variant="outline"
                    disabled={completing}
                    onClick={() => void complete("FORGOT")}
                  >
                    忘记了
                  </Button>
                  <Button
                    variant="outline"
                    disabled={completing}
                    onClick={() => void complete("FUZZY")}
                  >
                    有些模糊
                  </Button>
                  {allowedRatings.includes("REMEMBERED") && (
                    <Button
                      disabled={completing}
                      onClick={() => void complete("REMEMBERED")}
                    >
                      {completing && <LoaderCircle className="animate-spin" />}
                      记住了
                    </Button>
                  )}
                </div>
              )}
              {result.totalScore < 80 && (
                <Button
                  className="mt-3 w-full"
                  variant="ghost"
                  disabled={completing}
                  onClick={revise}
                >
                  <RefreshCcw />
                  修改后重试（首次结果仍会保留）
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Card className="mt-6 min-w-0 warm-shadow">
            <CardHeader>
              <CardTitle>造一个日语句子</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="min-w-0" onSubmit={submit}>
                <div className="mb-3 flex flex-wrap gap-2">
                  {scenes.map((value) => (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={scene === value ? "secondary" : "outline"}
                      onClick={() => setScene(value)}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
                <Textarea
                  value={sentence}
                  onChange={(event) =>
                    setSentence(event.target.value.slice(0, 150))
                  }
                  rows={6}
                  placeholder={`请使用「${grammar.title}」造句`}
                />
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                  <span>AI 会检查语法、接续和自然度</span>
                  <span>{sentence.length}/150</span>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={
                    !sentence.trim() ||
                    submitting ||
                    Boolean(
                      job && ["QUEUED", "PROCESSING"].includes(job.status),
                    )
                  }
                  className="mt-4 h-11 w-full"
                >
                  {submitting ||
                  job?.status === "QUEUED" ||
                  job?.status === "PROCESSING" ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <Send />
                  )}
                  {job?.status === "QUEUED" || job?.status === "PROCESSING"
                    ? "AI 正在批改…"
                    : "提交给 AI 批改"}
                </Button>
                {job?.status === "FAILED" && (
                  <div className="mt-4 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
                    <p className="flex items-start gap-2">
                      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                      {reviewFailureMessage(job)}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => void retryJob()}
                    >
                      重新批改
                    </Button>
                    <p className="mt-3 text-xs text-muted-foreground">
                      也可以不等待 AI，按这次真实回忆情况完成。
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {[
                        ["FORGOT", "忘记了"],
                        ["FUZZY", "有些模糊"],
                        ["REMEMBERED", "记住了"],
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
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        )}
        {message && (
          <p className="mt-4 rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
function RecallPolicyMessage({
  reason,
}: {
  reason: NonNullable<ReviewResult["recallPolicy"]>["reason"] | undefined;
}) {
  const messages = {
    SCORE_BELOW_80: "本次造句质量低于 80 分，最高按“有些模糊”安排。",
    TARGET_GRAMMAR_MISSING: "句子没有使用目标语法，本次排期会按“忘记了”处理。",
    TARGET_GRAMMAR_INCORRECT: "目标语法使用不正确，本次排期会按“忘记了”处理。",
  } as const;
  if (!reason || reason === "NONE") return null;
  return (
    <p className="mt-3 rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
      {messages[reason]}
    </p>
  );
}

function reviewFailureMessage(job: AiReviewJob) {
  if (["AI_TIMEOUT", "AI_NETWORK_ERROR"].includes(job.errorCode ?? ""))
    return "AI 批改响应超时，请稍后重新批改。";
  return "AI 批改服务暂时不可用，请稍后重新批改。";
}

function Hint({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 leading-7">{value}</p>
    </div>
  );
}

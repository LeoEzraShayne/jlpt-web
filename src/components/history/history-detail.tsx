"use client";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import { ArrowLeft, LoaderCircle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { ReviewResultCard } from "@/components/study/review-result-card";
import { apiFetcher, apiRequest } from "@/lib/api/client";
import { apiKeys } from "@/lib/api/keys";
import type { SentenceAttempt, StudySession } from "@/lib/api/types";

export function HistoryDetail({ id }: { id: string }) {
  useLocale();
  const router = useRouter(); const [starting, setStarting] = useState(false); const swr = useSWR<SentenceAttempt>(apiKeys.historyDetail(id), apiFetcher);
  if (swr.isLoading) return <LoadingState />; if (swr.error || !swr.data) return <ErrorState message={swr.error?.message} onRetry={() => void swr.mutate()} />;
  const attempt = swr.data; async function practiceAgain() { setStarting(true); try { const { data } = await apiRequest<StudySession>(`/sentence-attempts/${id}/practice-again`, { method: "POST" }); router.push(`/study/${data.id}`); } finally { setStarting(false); } }
  return <div className="min-w-0 max-w-full"><Button asChild variant="ghost" className="mb-5"><Link href="/history"><ArrowLeft />{t("返回记录")}</Link></Button><div className="mb-6 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><p className="text-sm text-muted-foreground">{new Date(attempt.createdAt).toLocaleString("zh-CN")}</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">{attempt.grammar?.title}</h1></div><Button className="self-start sm:self-auto" onClick={() => void practiceAgain()} disabled={starting}>{starting ? <LoaderCircle className="animate-spin" /> : <RotateCcw />}{t("再练一次")}</Button></div><Card className="mb-5 min-w-0 warm-shadow"><CardHeader><CardTitle>{t("当时的造句")}</CardTitle></CardHeader><CardContent><p className="text-lg leading-8">{attempt.sentence}</p>{attempt.scene && <p className="mt-2 text-sm text-muted-foreground">{t("场景：")}{attempt.scene}</p>}</CardContent></Card>{attempt.aiJob?.result ? <ReviewResultCard result={attempt.aiJob.result} /> : <ErrorState message={t("这条记录暂时没有可用的批改结果")} />}</div>;
}

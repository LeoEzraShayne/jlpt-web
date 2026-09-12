"use client";
import { useLocale } from "@/components/locale/locale-provider";
import { PracticeFeedback } from "./practice-feedback";
import type { VocabularyPractice } from "./types";
export function PracticeAttemptHistory({ practice }: { practice: VocabularyPractice }) {
  const { t } = useLocale();
  if (!practice.reviewAttempts || practice.reviewAttempts.length < 2) return null;
  const labels = { QUEUED: "处理中", COMPLETED: "已完成", FAILED: "批改失败" };
  return <details className="rounded-xl border p-4"><summary className="cursor-pointer text-sm font-medium">{t("每次批改记录")} ({practice.reviewAttempts.length})</summary><p className="my-3 text-xs text-muted-foreground">{t("追加批改保留原始记忆证据，不重复更新复习安排。")}</p><div className="flex flex-col gap-3">{practice.reviewAttempts.map(attempt => <details key={attempt.id} className="rounded-lg border p-3"><summary className="cursor-pointer text-sm">#{attempt.ordinal} · {t(labels[attempt.status])}</summary><div className="mt-3">{attempt.result ? <PracticeFeedback practice={{ ...practice, answer: attempt.answer, result: attempt.result, reference: undefined }} showSchedule={false} /> : <p lang="ja" className="whitespace-pre-wrap leading-8">{attempt.answer}</p>}</div></details>)}</div></details>;
}

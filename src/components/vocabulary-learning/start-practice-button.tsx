"use client";
import { QuotaNotice } from "@/components/membership/quota-notice";
import { quotaErrorCode } from "@/components/membership/use-membership";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import type { VocabularyPractice } from "./types";

export function StartVocabularyPractice({ vocabularyId, grammarId, studySessionId, disabled, label = t("开始词汇练习") }: {
  vocabularyId?: string; grammarId?: string; studySessionId?: string; disabled?: boolean; label?: string;
}) {
  useLocale();
  const router = useRouter();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [quotaCode, setQuotaCode] = useState("");
  async function start() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const { data } = await apiRequest<VocabularyPractice>("/vocabulary-practices", {
        method: "POST", body: JSON.stringify({ vocabularyId, grammarId, studySessionId }),
      });
      router.push(`/vocabulary-practice/${encodeURIComponent(data.id)}`);
    } catch (e) {
      setQuotaCode(quotaErrorCode(e));
      setError(e instanceof ApiError && e.status === 404 && !vocabularyId ? t("当前没有到期词汇，可去学习清单选择词汇。") : e instanceof Error ? e.message : t("开始失败，请重试"));
    } finally { lock.current = false; setBusy(false); }
  }
  return <div className="min-w-0">
    <Button size="sm" disabled={disabled || busy} onClick={() => void start()}>{t(busy ? "正在准备…" : label)}</Button>
    <QuotaNotice code={quotaCode} />
    {error && <p role="alert" className="mt-2 text-xs text-destructive">{t(error)}</p>}
  </div>;
}

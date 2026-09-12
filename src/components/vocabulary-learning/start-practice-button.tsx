"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import type { VocabularyPractice } from "./types";

export function StartVocabularyPractice({ vocabularyId, grammarId, studySessionId, disabled, label = "开始词汇练习" }: {
  vocabularyId?: string; grammarId?: string; studySessionId?: string; disabled?: boolean; label?: string;
}) {
  const router = useRouter();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const { data } = await apiRequest<VocabularyPractice>("/vocabulary-practices", {
        method: "POST", body: JSON.stringify({ vocabularyId, grammarId, studySessionId }),
      });
      router.push(`/vocabulary-practice/${encodeURIComponent(data.id)}`);
    } catch (e) {
      setError(e instanceof ApiError && e.status === 404 && !vocabularyId ? "当前没有到期词汇，可去学习清单选择词汇。" : e instanceof Error ? e.message : "开始失败，请重试");
    } finally { lock.current = false; setBusy(false); }
  }
  return <div className="min-w-0">
    <Button size="sm" disabled={disabled || busy} onClick={() => void start()}>{busy ? "正在准备…" : label}</Button>
    {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
  </div>;
}

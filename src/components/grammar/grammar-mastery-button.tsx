"use client";
import { useRef, useState } from "react";
import { useSWRConfig } from "swr";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";

export function GrammarMasteryButton({ grammarId, mastered, refresh }: {
  grammarId: string; mastered: boolean; refresh: () => Promise<unknown>;
}) {
  useLocale();
  const { mutate } = useSWRConfig();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function update() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      await apiRequest(`/grammar-points/${encodeURIComponent(grammarId)}/mastery`, {
        method: "PUT", body: JSON.stringify({ mastered: !mastered }),
      });
      await refresh();
      await mutate(key => typeof key === "string" &&
        ["grammar-points", "/dashboard/", "/study-plans", "/review-queue"].some(part => key.includes(part)));
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("更新失败，请重试")); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div className="flex min-w-0 flex-col gap-1">
    <Button size="sm" variant={mastered ? "secondary" : "outline"} disabled={busy}
      aria-pressed={mastered} onClick={() => void update()}
      title={t(mastered ? "取消后恢复学习和复习安排" : "标记后不再安排学习和复习")}
      className="h-auto min-h-8 rounded-full px-2 py-1 text-xs">
      {mastered && <Check data-icon="inline-start" />}
      {t(mastered ? "取消已掌握" : "标为已掌握")}
    </Button>
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </div>;
}

"use client";
import { useSWRConfig } from "swr";
import { useState, type ReactNode } from "react";
import { useMe } from "@/hooks/use-api";
import { apiRequest } from "@/lib/api/client";
import { setLocale } from "@/lib/i18n/locale-store";
import type { AppLocale } from "@/lib/api/sentence-lab";
import { useLocale } from "./locale-provider";
export function LanguagePicker({ explanations = false, compact = false, showExplanationHint = true, explanationAction }: {
  explanations?: boolean;
  compact?: boolean;
  showExplanationHint?: boolean;
  explanationAction?: ReactNode;
}) {
  const { locale, t } = useLocale();
  const me = useMe();
  const { mutate } = useSWRConfig();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function change(field: "uiLocale" | "explanationLocale", value: AppLocale) {
    setBusy(true); setError("");
    try {
      if (me.data) {
        await apiRequest("/me/preferences", { method: "PUT", body: JSON.stringify({ [field]: value }) });
        await me.mutate({ ...me.data, [field]: value }, { revalidate: false });
      }
      if (field === "uiLocale") { setLocale(value); if (!me.data) { try { sessionStorage.setItem("jlpt-pending-ui-locale", value); } catch {} } }
      else await mutate(key => typeof key === "string" && (key.includes("grammar-points") || key.includes("training-scenarios")), undefined, { revalidate: true });
    } catch { setError(t("语言保存失败，请重试")); }
    finally { setBusy(false); }
  }
  const labelClass = explanationAction ? "contents text-[11px] sm:text-sm" : "flex items-center gap-2 text-sm";
  const selectClass = explanationAction ? "min-w-0 w-full border bg-background px-1 py-2 text-xs sm:px-2 sm:text-sm" : "rounded-lg border bg-background p-2";
  return <div className={explanationAction ? "grid grid-cols-[max-content_minmax(0,1fr)_max-content] items-center gap-x-2 gap-y-3" : "flex flex-wrap items-center gap-3"}>
    <label className={labelClass}><span className={compact ? "sr-only shrink-0 sm:not-sr-only" : "shrink-0"}>{t("界面语言")}</span><select aria-label={t("界面语言")} disabled={busy} className={selectClass} value={locale} onChange={event => void change("uiLocale", event.target.value as AppLocale)}><option value="zh">中文</option><option value="en">English</option></select></label>{explanationAction && <span aria-hidden="true" />}
    {explanations && <><label className={labelClass}><span className="shrink-0">{t("讲解语言")}</span><select aria-label={t("讲解语言")} disabled={busy} className={selectClass} value={me.data?.explanationLocale ?? "zh"} onChange={event => void change("explanationLocale", event.target.value as AppLocale)}><option value="zh">中文</option><option value="en">English</option></select></label>{explanationAction}{showExplanationHint && <p className="col-span-3 w-full text-xs text-muted-foreground">{t("讲解语言用于新练习，已有练习和历史保持原来的语言。")}</p>}</>}
    {error && <p role="alert" className="col-span-3 w-full text-sm text-destructive">{error}</p>}
  </div>;
}

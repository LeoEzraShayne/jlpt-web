"use client";
import { useSWRConfig } from "swr";
import { useState } from "react";
import { useMe } from "@/hooks/use-api";
import { apiRequest } from "@/lib/api/client";
import { setLocale } from "@/lib/i18n/locale-store";
import type { AppLocale } from "@/lib/api/sentence-lab";
import { useLocale } from "./locale-provider";
export function LanguagePicker({ explanations = false }: { explanations?: boolean }) {
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
      if (field === "uiLocale") setLocale(value);
      else await mutate(key => typeof key === "string" && (key.includes("grammar-points") || key.includes("training-scenarios")), undefined, { revalidate: true });
    } catch { setError(t("语言保存失败，请重试")); }
    finally { setBusy(false); }
  }
  return <div className="flex flex-wrap items-center gap-3">
    <label className="flex items-center gap-2 text-sm"><span>{t("界面语言")}</span><select aria-label={t("界面语言")} disabled={busy} className="rounded-lg border bg-background p-2" value={locale} onChange={event => void change("uiLocale", event.target.value as AppLocale)}><option value="zh">中文</option><option value="en">English</option></select></label>
    {explanations && <><label className="flex items-center gap-2 text-sm"><span>{t("讲解语言")}</span><select aria-label={t("讲解语言")} disabled={busy} className="rounded-lg border bg-background p-2" value={me.data?.explanationLocale ?? "zh"} onChange={event => void change("explanationLocale", event.target.value as AppLocale)}><option value="zh">中文</option><option value="en">English</option></select></label><p className="w-full text-xs text-muted-foreground">{t("讲解语言用于新练习，已有练习和历史保持原来的语言。")}</p></>}
    {error && <p role="alert" className="w-full text-sm text-destructive">{error}</p>}
  </div>;
}

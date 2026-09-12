"use client";
import { useEffect, useSyncExternalStore } from "react";
import { apiRequest } from "@/lib/api/client";
import { useMe } from "@/hooks/use-api";
import { currentLocale, setLocale, subscribeLocale, translate } from "@/lib/i18n/locale-store";
import type { AppLocale } from "@/lib/api/sentence-lab";
export function useLocale() {
  const locale = useSyncExternalStore(subscribeLocale, currentLocale, () => "zh" as const);
  return { locale, t: <T,>(source: T) => translate(source, locale) };
}
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { data: me, mutate } = useMe();
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem("jlpt-ui-locale"); } catch {}
    let pending: string | null = null;
    try { pending = sessionStorage.getItem("jlpt-pending-ui-locale"); } catch {}
    if (me && (pending === "en" || pending === "zh")) {
      const selected = pending;
      setLocale(selected);
      void apiRequest("/me/preferences", { method: "PUT", body: JSON.stringify({ uiLocale: selected }) }).then(async () => {
        try { sessionStorage.removeItem("jlpt-pending-ui-locale"); } catch {}
        await mutate(current => current?.id === me.id ? { ...current, uiLocale: selected } : current, { revalidate: false });
      }).catch(() => undefined);
    } else setLocale(me?.uiLocale ?? (saved === "en" ? "en" : "zh"));
  }, [me, mutate]);
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === "jlpt-ui-locale" && (event.newValue === "en" || event.newValue === "zh")) setLocale(event.newValue as AppLocale); };
    window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync);
  }, []);
  return children;
}

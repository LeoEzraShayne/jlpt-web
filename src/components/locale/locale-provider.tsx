"use client";
import { useEffect, useSyncExternalStore } from "react";
import { useMe } from "@/hooks/use-api";
import { currentLocale, setLocale, subscribeLocale, translate } from "@/lib/i18n/locale-store";
import type { AppLocale } from "@/lib/api/sentence-lab";
export function useLocale() {
  const locale = useSyncExternalStore(subscribeLocale, currentLocale, () => "zh" as const);
  return { locale, t: <T,>(source: T) => translate(source, locale) };
}
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { data: me } = useMe();
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem("jlpt-ui-locale"); } catch {}
    setLocale(me?.uiLocale ?? (saved === "en" ? "en" : "zh"));
  }, [me?.id, me?.uiLocale]);
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === "jlpt-ui-locale" && (event.newValue === "en" || event.newValue === "zh")) setLocale(event.newValue as AppLocale); };
    window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync);
  }, []);
  return children;
}

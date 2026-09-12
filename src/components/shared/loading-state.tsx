"use client";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import { LoaderCircle } from "lucide-react";

export function LoadingState({ label = t("正在加载…") }: { label?: string }) {
  useLocale();
  return <div className="grid min-h-64 place-items-center text-sm text-muted-foreground"><span className="flex items-center gap-2"><LoaderCircle className="size-5 animate-spin text-primary" />{t(label)}</span></div>;
}

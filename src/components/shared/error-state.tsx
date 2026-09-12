"use client";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({ message = t("加载失败，请稍后重试"), onRetry }: { message?: string; onRetry?: () => void }) {
  useLocale();
  return <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed bg-card p-8 text-center"><div><div className="flex items-center justify-center gap-2"><AlertCircle className="size-8 shrink-0 text-destructive" /><p className="text-sm">{t(message)}</p></div>{onRetry && <Button className="mt-4" variant="outline" onClick={onRetry}>{t("重新加载")}</Button>}</div></div>;
}

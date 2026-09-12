"use client";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import { Button } from "@/components/ui/button";
export function LoadStatus({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: Error | undefined;
  retry: () => void;
}) {
  useLocale();
  if (loading) return <p role="status">{t("加载中…")}</p>;
  if (error)
    return (
      <div role="alert">
        <p>{t(error.message)}</p>
        <Button variant="outline" onClick={retry}>
          {t("重试")}</Button>
      </div>
    );
  return null;
}

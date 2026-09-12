"use client";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePlans, useMe } from "@/hooks/use-api";
import { ApiError } from "@/lib/api/client";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { useColorTheme } from "@/components/theme/theme-provider";

export function AuthGate({ children, requirePlan = true }: { children: React.ReactNode; requirePlan?: boolean }) {
  useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme } = useColorTheme();
  const me = useMe();
  const plan = usePlans(Boolean(me.data) && requirePlan);

  useEffect(() => {
    if (me.error instanceof ApiError && me.error.status === 401) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [me.error, pathname, router]);
  useEffect(() => { if (me.data?.colorTheme) setTheme(me.data.colorTheme); }, [me.data?.colorTheme, setTheme]);
  useEffect(() => {
    if (requirePlan && plan.data?.items.length === 0) router.replace("/onboarding");
  }, [plan.data, requirePlan, router]);

  if (me.isLoading || (requirePlan && me.data && plan.isLoading)) return <LoadingState label={t("正在准备学习空间…")} />;
  if (me.error) return me.error instanceof ApiError && me.error.status === 401 ? null : <ErrorState message={me.error.message} onRetry={() => void me.mutate()} />;
  if (requirePlan && plan.data?.items.length === 0) return null;
  if (requirePlan && plan.error) {
    return <ErrorState message={plan.error.message} onRetry={() => void plan.mutate()} />;
  }
  return <>{children}</>;
}

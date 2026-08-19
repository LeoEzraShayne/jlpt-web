"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentPlan, useMe } from "@/hooks/use-api";
import { ApiError } from "@/lib/api/client";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { useColorTheme } from "@/components/theme/theme-provider";

export function AuthGate({ children, requirePlan = true }: { children: React.ReactNode; requirePlan?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme } = useColorTheme();
  const me = useMe();
  const plan = useCurrentPlan(Boolean(me.data) && requirePlan);

  useEffect(() => {
    if (me.error instanceof ApiError && me.error.status === 401) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [me.error, pathname, router]);
  useEffect(() => { if (me.data?.colorTheme) setTheme(me.data.colorTheme); }, [me.data?.colorTheme, setTheme]);
  useEffect(() => {
    if (requirePlan && plan.error instanceof ApiError && plan.error.code === "PLAN_NOT_INITIALIZED") router.replace("/onboarding");
  }, [plan.error, requirePlan, router]);

  if (me.isLoading || (requirePlan && me.data && plan.isLoading)) return <LoadingState label="正在准备学习空间…" />;
  if (me.error) return null;
  if (requirePlan && plan.error) {
    if (plan.error instanceof ApiError && plan.error.code === "PLAN_NOT_INITIALIZED") return null;
    return <ErrorState message={plan.error.message} onRetry={() => void plan.mutate()} />;
  }
  return <>{children}</>;
}

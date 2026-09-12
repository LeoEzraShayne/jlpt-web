"use client";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlans, useMe } from "@/hooks/use-api";
import { ApiError } from "@/lib/api/client";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";

export function EntryRedirect() {
  useLocale();
  const router = useRouter();
  const me = useMe();
  const plan = usePlans(Boolean(me.data));
  useEffect(() => {
    if (me.error instanceof ApiError && me.error.status === 401) router.replace("/login");
    else if (plan.data) router.replace(plan.data.items.length ? "/today" : "/onboarding");
  }, [me.error, plan.data, plan.error, router]);
  if (me.error && !(me.error instanceof ApiError && me.error.status === 401)) {
    return <ErrorState message={me.error.message} onRetry={() => void me.mutate()} />;
  }
  if (plan.error) {
    return <ErrorState message={plan.error.message} onRetry={() => void plan.mutate()} />;
  }
  return <LoadingState label={t("正在进入文法训练…")} />;
}

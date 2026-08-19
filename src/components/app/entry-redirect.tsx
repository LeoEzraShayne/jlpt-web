"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentPlan, useMe } from "@/hooks/use-api";
import { ApiError } from "@/lib/api/client";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";

export function EntryRedirect() {
  const router = useRouter();
  const me = useMe();
  const plan = useCurrentPlan(Boolean(me.data));
  useEffect(() => {
    if (me.error instanceof ApiError && me.error.status === 401) router.replace("/login");
    else if (plan.data) router.replace("/today");
    else if (plan.error instanceof ApiError && plan.error.code === "PLAN_NOT_INITIALIZED") router.replace("/onboarding");
  }, [me.error, plan.data, plan.error, router]);
  if (me.error && !(me.error instanceof ApiError && me.error.status === 401)) {
    return <ErrorState message={me.error.message} onRetry={() => void me.mutate()} />;
  }
  if (plan.error && !(plan.error instanceof ApiError && plan.error.code === "PLAN_NOT_INITIALIZED")) {
    return <ErrorState message={plan.error.message} onRetry={() => void plan.mutate()} />;
  }
  return <LoadingState label="正在进入文法训练…" />;
}

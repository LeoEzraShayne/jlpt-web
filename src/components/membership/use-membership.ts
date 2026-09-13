"use client";
import useSWR from "swr";
import { useEffect, useState } from "react";
import { ApiError, apiFetcher } from "@/lib/api/client";
import type { MembershipSummary } from "@/lib/api/sentence-lab";
import { androidClient } from "@/lib/android-commerce";
export const useMembership = () => useSWR<MembershipSummary>("/me/entitlements", apiFetcher, { shouldRetryOnError: false });
// This hint only hides web payment UI; it grants no native/account trust.
export function usePaymentSurface() {
  const [surface, setSurface] = useState<"loading" | "web" | "android">("loading");
  useEffect(() => {
    const timer = window.setTimeout(() => setSurface(androidClient() ? "android" : "web"), 0);
    return () => window.clearTimeout(timer);
  }, []);
  return surface;
}
export function quotaErrorCode(error: unknown) { return error instanceof ApiError && ["DAILY_TASK_LIMIT", "TASK_REVIEW_LIMIT"].includes(error.code) ? error.code : ""; }
export function billingError(error: unknown, t: <T>(value: T) => T) {
  if (!(error instanceof ApiError)) return t("操作失败，请重试");
  const messages: Record<string, string> = {
    DAILY_TASK_LIMIT: "今天的免费任务已用完。草稿仍在当前页面，复习安排未改变。",
    TASK_REVIEW_LIMIT: "本任务的三次成功批改已用完。草稿仍在当前页面，批改历史未改变。",
    BILLING_DISABLED: "购买尚未开放，请稍后再来。",
    PAYMENT_UNAVAILABLE: "支付暂时不可用，请稍后重试。",
    REQUEST_IN_PROGRESS: "请求正在处理中，请稍后刷新状态。",
    IDEMPOTENCY_CONFLICT: "这个请求已用于其他操作，请刷新状态后重试。",
    REQUEST_TIMEOUT: "请求超时，请检查网络后重试",
    NETWORK_ERROR: "无法连接学习服务，请稍后重试",
  };
  return t(messages[error.code] ?? error.message);
}

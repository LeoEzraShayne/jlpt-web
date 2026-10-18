"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale/locale-provider";
import { useMembership, usePaymentSurface } from "./use-membership";
import { androidClient } from "@/lib/android-commerce";
import { NativeCommerceLink } from "@/components/android/native-commerce-link";
export function QuotaNotice({ code }: { code?: string }) {
  const { t } = useLocale();
  const surface = usePaymentSurface();
  if (!code) return null;
  const className = "mt-2 inline-block underline underline-offset-4";
  return <div role="alert" className="my-3 rounded-xl border p-4 text-sm"><p>{t(code === "TASK_REVIEW_LIMIT" ? "本任务的三次成功批改已用完。草稿仍在当前页面，批改历史未改变。" : "今天的免费任务已用完。草稿仍在当前页面，复习安排未改变。")}</p>{surface === "android" ? <NativeCommerceLink client={androidClient() ?? "android-release"} action="membership" className={className}>{t("查看会员与额度")}</NativeCommerceLink> : surface === "web" && <Link href="/membership" target="_blank" rel="noopener" className={className}>{t("查看会员与额度")}</Link>}</div>;
}
export function QuotaSummary() {
  const { t } = useLocale();
  const { data } = useMembership();
  if (!data) return null;
  const status = t(data.quota.enforcementEnabled === false
    ? "当前尚未启用任务额度限制"
    : data.isMember ? "会员：正常学习不限任务与批改次数"
      : `今日免费任务剩余 ${data.quota.remaining}/${data.quota.dailyLimit}`);
  const compactStatus = data.isMember && data.quota.enforcementEnabled !== false
    ? t("会员：正常学习不限量") : status;
  return <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border p-3 text-xs md:text-sm">
    <span className="min-w-0 flex-1 truncate" title={status}>
      {compactStatus === status ? status : <>
        <span className="md:hidden" aria-label={status}>{compactStatus}</span>
        <span className="hidden md:inline">{status}</span>
      </>}
    </span>
    <Button asChild size="sm" className="h-auto min-h-8 shrink-0 rounded-full px-2 py-1">
      <Link href="/membership">{t("会员与额度")}</Link>
    </Button>
  </div>;
}

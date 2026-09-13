"use client";
import Link from "next/link";
import { useLocale } from "@/components/locale/locale-provider";
import { useMembership, usePaymentSurface } from "./use-membership";
import { androidClient, nativeCommerceUrl } from "@/lib/android-commerce";
export function QuotaNotice({ code }: { code?: string }) {
  const { t } = useLocale();
  const surface = usePaymentSurface();
  if (!code) return null;
  const className = "mt-2 inline-block underline underline-offset-4";
  return <div role="alert" className="my-3 rounded-xl border p-4 text-sm"><p>{t(code === "TASK_REVIEW_LIMIT" ? "本任务的三次成功批改已用完。草稿仍在当前页面，批改历史未改变。" : "今天的免费任务已用完。草稿仍在当前页面，复习安排未改变。")}</p>{surface === "android" ? <a href={nativeCommerceUrl(androidClient() ?? "android-release", "membership")} className={className}>{t("查看会员与额度")}</a> : surface === "web" && <Link href="/membership" target="_blank" rel="noopener" className={className}>{t("查看会员与额度")}</Link>}</div>;
}
export function QuotaSummary() {
  const { t } = useLocale();
  const { data } = useMembership();
  if (!data) return null;
  return <Link href="/membership" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm"><span>{t(data.quota.enforcementEnabled === false ? "当前尚未启用任务额度限制" : data.isMember ? "会员：正常学习不限任务与批改次数" : `今日免费任务剩余 ${data.quota.remaining}/${data.quota.dailyLimit}`)}</span><span className="underline">{t("会员与额度")}</span></Link>;
}

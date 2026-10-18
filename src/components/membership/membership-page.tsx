"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import useSWR from "swr";
import { ApiError, apiFetcher, apiRequest } from "@/lib/api/client";
import type { Catalog, ProductCode } from "@/lib/api/sentence-lab";
import { useLocale } from "@/components/locale/locale-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { billingError, useMembership, usePaymentSurface } from "./use-membership";
import { MembershipPackages } from "./membership-packages";
import { androidClient } from "@/lib/android-commerce";
import { NativeCommerceLink } from "@/components/android/native-commerce-link";
export function formatPrice(amount: number, currency: string, locale: string) { return new Intl.NumberFormat(locale, { style: "currency", currency }).format(currency === "JPY" ? amount : amount / 100); }
export function MembershipPage() {
  const { locale, t } = useLocale();
  const [pending, setPending] = useState<ProductCode | null>(null);
  const [error, setError] = useState("");
  const keys = useRef(new Map<string, string>());
  const lock = useRef(false);
  const membership = useMembership();
  const surface = usePaymentSurface();
  const catalog = useSWR<Catalog>(surface === "web" ? "/billing/catalog?market=GLOBAL" : null, apiFetcher, { shouldRetryOnError: false });
  const date = (value: string) => new Date(value).toLocaleString(locale === "en" ? "en-US" : "zh-CN");
  async function checkout(productCode: ProductCode) {
    if (lock.current || surface !== "web" || !catalog.data?.salesEnabled) return;
    lock.current = true; setPending(productCode); setError("");
    const expectedAmount = catalog.data.products.find(product => product.productCode === productCode)?.amount;
    const key = `${productCode}:${expectedAmount}`;
    const requestKey = keys.current.get(key) ?? crypto.randomUUID();
    keys.current.set(key, requestKey);
    try {
      const { data } = await apiRequest<{ orderId: string; checkoutUrl: string }>("/billing/checkout", { method: "POST", body: JSON.stringify({ productCode, market: "GLOBAL", requestKey, locale, expectedAmount }) });
      const target = new URL(data.checkoutUrl);
      if (target.protocol !== "https:" || target.hostname !== "checkout.stripe.com") throw new Error("Invalid Checkout URL");
      window.location.assign(target.href);
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "PRICE_CHANGED") { keys.current.delete(key); await catalog.mutate(); }
      setError(billingError(cause, t)); setPending(null); lock.current = false; }
  }
  return <div className="flex flex-col gap-6">
    <div><h1 className="text-2xl font-bold">{t("会员与额度")}</h1><div className="mt-2 flex min-w-0 items-center justify-between gap-1.5"><p className={`whitespace-nowrap! text-muted-foreground ${locale === "en" ? "text-[9px] min-[390px]:text-[10px]" : "text-[10px] min-[390px]:text-[11px]"} sm:text-sm`}>{t("一次购买，不自动续费。续购保留剩余时长。")}</p><Button asChild size="sm" className="h-auto min-h-8 shrink-0 rounded-full px-2 py-1 text-[10px] sm:text-sm"><Link href="/membership/orders">{t("订单记录")}</Link></Button></div></div>
    {membership.isLoading ? <LoadingState /> : membership.error ? <ErrorState message={billingError(membership.error, t)} onRetry={() => void membership.mutate()} /> : membership.data && !membership.data.isMember && <Card>
      <CardHeader>
        <CardTitle>{t(membership.data.isMember ? "会员已生效" : "免费学习")}</CardTitle>
        <CardDescription>
          {membership.data.isMember && membership.data.expiresAt && <span className="block">{t("有效期至")} {date(membership.data.expiresAt)}</span>}
          {membership.data.quota.enforcementEnabled === false
            ? t("当前尚未启用任务额度限制")
            : !membership.data.isMember && t("语法与词汇合计每天 5 个任务，每个任务包含 3 次成功批改。")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {membership.data.isMember ? <p>{t("会员正常学习不限任务与批改次数，无隐藏每日上限。")}</p> : membership.data.quota.enforcementEnabled !== false && <>
          <p>{t(`今日免费任务剩余 ${membership.data.quota.remaining}/${membership.data.quota.dailyLimit}`)} · {t("预留中")} {membership.data.quota.reserved}</p>
          <p>{t("奖励任务余额")} {membership.data.quota.rewardBalance}</p>
          <p>{t("下次刷新")} {date(membership.data.quota.resetsAt)} ({membership.data.quota.timezone})</p>
        </>}
        <p className="text-muted-foreground">{t("系统失败不计入成功批改；复习积压会保留。")}</p>
      </CardContent>
    </Card>}
    {surface === "android" ? <Card><CardHeader><CardTitle>{t("Android 购买")}</CardTitle><CardDescription>{t("请使用应用内 Google Play 购买入口。已有会员在所有设备生效。")}</CardDescription></CardHeader><CardContent className="flex flex-col gap-3"><NativeCommerceLink className={buttonVariants()} client={androidClient() ?? "android-release"} action="membership">{t("在应用内查看价格与购买")}</NativeCommerceLink>{membership.data && !membership.data.isMember && <NativeCommerceLink className={buttonVariants({ variant: "outline" })} client={androidClient() ?? "android-release"} action="reward">{t("在应用内查看奖励任务")}</NativeCommerceLink>}<p className="text-xs text-muted-foreground">{t("实际价格以 Google Play 显示的当地货币为准。")}</p></CardContent></Card> : surface === "web" && <>
      {catalog.isLoading ? <LoadingState /> : catalog.error ? <ErrorState message={billingError(catalog.error, t)} onRetry={() => void catalog.mutate()} /> : catalog.data && <>
        {!catalog.data.salesEnabled && <p role="status" className="rounded-xl border p-4 text-sm">{t("购买尚未开放，请稍后再来。")}</p>}
        <MembershipPackages catalog={catalog.data} pending={pending} onCheckout={checkout} />
      </>}
    </>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <p className="text-xs text-muted-foreground">{t("付款后由服务端核实并开通权益。在支持的设备上登录同一账号即可使用会员。")}</p>
  </div>;
}

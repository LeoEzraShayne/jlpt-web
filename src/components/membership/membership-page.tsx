"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import useSWR from "swr";
import { apiFetcher, apiRequest } from "@/lib/api/client";
import type { BillingMarket, Catalog, ProductCode } from "@/lib/api/sentence-lab";
import { useLocale } from "@/components/locale/locale-provider";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { billingError, useMembership, usePaymentSurface } from "./use-membership";
export function formatPrice(amount: number, currency: string, locale: string) { return new Intl.NumberFormat(locale, { style: "currency", currency }).format(currency === "JPY" ? amount : amount / 100); }
export function MembershipPage() {
  const { locale, t } = useLocale();
  const [market, setMarket] = useState<BillingMarket>("GLOBAL");
  const [pending, setPending] = useState<ProductCode | null>(null);
  const [error, setError] = useState("");
  const keys = useRef(new Map<string, string>());
  const lock = useRef(false);
  const membership = useMembership();
  const surface = usePaymentSurface();
  const catalog = useSWR<Catalog>(`/billing/catalog?market=${market}`, apiFetcher, { shouldRetryOnError: false });
  const date = (value: string) => new Date(value).toLocaleString(locale === "en" ? "en-US" : "zh-CN");
  async function checkout(productCode: ProductCode) {
    if (lock.current || surface !== "web" || !catalog.data?.salesEnabled) return;
    lock.current = true; setPending(productCode); setError("");
    const key = `${market}:${productCode}`;
    const requestKey = keys.current.get(key) ?? crypto.randomUUID();
    keys.current.set(key, requestKey);
    try {
      const { data } = await apiRequest<{ orderId: string; checkoutUrl: string }>("/billing/checkout", { method: "POST", body: JSON.stringify({ productCode, market, requestKey, locale }) });
      const target = new URL(data.checkoutUrl);
      if (target.protocol !== "https:" || target.hostname !== "checkout.stripe.com") throw new Error("Invalid Checkout URL");
      window.location.assign(target.href);
    } catch (cause) { setError(billingError(cause, t)); setPending(null); lock.current = false; }
  }
  return <div className="flex flex-col gap-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">{t("会员与额度")}</h1><p className="mt-2 text-sm text-muted-foreground">{t("一次购买，不自动续费。续购保留剩余时长。")}</p></div><Button asChild variant="outline"><Link href="/membership/orders">{t("订单记录")}</Link></Button></div>
    {membership.isLoading ? <LoadingState /> : membership.error ? <ErrorState message={billingError(membership.error, t)} onRetry={() => void membership.mutate()} /> : membership.data && <Card><CardHeader><CardTitle>{t(membership.data.isMember ? "会员已生效" : "免费学习")}</CardTitle><CardDescription>{membership.data.isMember && membership.data.expiresAt ? `${t("有效期至")} ${date(membership.data.expiresAt)}` : t("语法与词汇合计每天 5 个任务，每个任务包含 3 次成功批改。")}</CardDescription></CardHeader><CardContent className="flex flex-col gap-2 text-sm">{membership.data.isMember ? <p>{t("会员正常学习不限任务与批改次数，无隐藏每日上限。")}</p> : <><p>{t(`今日免费任务剩余 ${membership.data.quota.remaining}/${membership.data.quota.dailyLimit}`)} · {t("预留中")} {membership.data.quota.reserved}</p><p>{t("奖励任务余额")} {membership.data.quota.rewardBalance}</p><p>{t("下次刷新")} {date(membership.data.quota.resetsAt)} ({membership.data.quota.timezone})</p></>}<p className="text-muted-foreground">{t("系统失败不计入成功批改；复习积压会保留。")}</p></CardContent></Card>}
    {surface === "android" ? <Card><CardHeader><CardTitle>{t("Android 购买")}</CardTitle><CardDescription>{t("请使用应用内 Google Play 购买入口。已有会员在所有设备生效。")}</CardDescription></CardHeader></Card> : surface === "web" && <>
      <label className="flex items-center gap-3 text-sm">{t("购买市场")}<select aria-label={t("购买市场")} className="rounded-lg border bg-background p-2" value={market} disabled={!!pending} onChange={event => setMarket(event.target.value as BillingMarket)}><option value="GLOBAL">{t("全球 · 美元 USD")}</option><option value="JP">{t("日本 · 日元 JPY")}</option></select></label>
      <p className="text-xs text-muted-foreground">{t("币种由购买市场决定，切换语言不会改变价格。")}</p>
      {catalog.isLoading ? <LoadingState /> : catalog.error ? <ErrorState message={billingError(catalog.error, t)} onRetry={() => void catalog.mutate()} /> : catalog.data && <>
        {!catalog.data.salesEnabled && <p role="status" className="rounded-xl border p-4 text-sm">{t("购买尚未开放，请稍后再来。")}</p>}
        {catalog.data.launchEndsAt && <p className="text-sm">{t("美元首发价截止")} {date(catalog.data.launchEndsAt)}</p>}
        <div className="grid gap-4 md:grid-cols-2">{catalog.data.products.map(product => <Card key={product.productCode}><CardHeader><CardTitle>{t(product.productCode === "DAY_PASS" ? "日票" : "年卡")}</CardTitle><CardDescription>{t(product.productCode === "DAY_PASS" ? "连续 24 小时" : "连续 365 天")}</CardDescription></CardHeader><CardContent className="flex flex-col gap-3"><p className="text-3xl font-bold">{formatPrice(product.amount, product.currency, locale)}</p>{product.launchPrice && <p className="text-sm text-muted-foreground">{t("美元首发优惠")}</p>}<p className="text-sm">{t("会员正常学习不限任务与批改次数，无隐藏每日上限。")}</p></CardContent><CardFooter><Button className="w-full" disabled={!catalog.data?.salesEnabled || !!pending} onClick={() => void checkout(product.productCode)}>{t(pending === product.productCode ? "正在打开安全支付…" : "使用 Stripe 安全支付")}</Button></CardFooter></Card>)}</div>
      </>}
    </>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <p className="text-xs text-muted-foreground">{t("付款后由服务端核实并开通权益。Web 与 Android 共用账号、会员和学习记录。")}</p>
  </div>;
}

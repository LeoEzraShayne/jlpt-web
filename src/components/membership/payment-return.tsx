"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { apiFetcher } from "@/lib/api/client";
import type { OrderSummary } from "@/lib/api/sentence-lab";
import { useLocale } from "@/components/locale/locale-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMembership } from "./use-membership";
import { orderStatus } from "./orders-page";
export function PaymentReturn() {
  const { t } = useLocale();
  const params = useSearchParams();
  const id = params.get("orderId");
  const [slow, setSlow] = useState(false);
  const membership = useMembership();
  const order = useSWR<OrderSummary>(id ? `/billing/orders/${encodeURIComponent(id)}` : null, apiFetcher, { shouldRetryOnError: false, refreshInterval: data => data && !["PENDING", "CREATED"].includes(data.status) ? 0 : slow ? 10_000 : 2_000 });
  useEffect(() => { const timer = window.setTimeout(() => setSlow(true), 60_000); return () => window.clearTimeout(timer); }, [id]);
  const refreshMembership = membership.mutate;
  useEffect(() => { if (order.data?.status === "PAID") void refreshMembership(); }, [order.data?.status, refreshMembership]);
  const paid = order.data?.status === "PAID";
  return <div className="mx-auto flex max-w-2xl flex-col gap-5"><Card><CardHeader><CardTitle>{t(paid ? "付款已确认" : "付款状态")}</CardTitle><CardDescription>{t("权益仅在服务端核实付款后开通。")}</CardDescription></CardHeader><CardContent className="flex flex-col gap-4" aria-live="polite">{!id ? <p>{t("缺少订单编号，请从订单记录查看。")}</p> : order.error ? <p role="alert">{t("暂时无法确认订单，请刷新或稍后从订单记录查看。")}</p> : <><p>{order.data ? orderStatus(order.data.status, t) : t("正在确认付款…")}</p>{paid ? <p>{t(membership.data?.isMember ? "会员已生效，可以继续学习。" : "付款已确认，正在同步会员权益。")}</p> : slow && <p>{t("确认比平时稍久。请勿重复付款，可稍后查看此订单。")}</p>}<p className="break-all text-xs text-muted-foreground">{id}</p></>}<Button variant="outline" onClick={() => { void order.mutate(); void membership.mutate(); }}>{t("刷新状态")}</Button></CardContent></Card><div className="flex flex-wrap gap-4 text-sm"><Link href="/today" className="underline">{t("继续学习")}</Link><Link href="/membership/orders" className="underline">{t("订单记录")}</Link><Link href="/membership" className="underline">{t("返回会员")}</Link></div></div>;
}

"use client";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { apiRequest } from "@/lib/api/client";
import type { OrderSummary } from "@/lib/api/sentence-lab";
import { useLocale } from "@/components/locale/locale-provider";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { formatPrice } from "./membership-page";
export function orderStatus(status: string, t: <T>(value: T) => T) { const labels: Record<string, string> = { PENDING: "待付款", CREATED: "待付款", PAID: "已付款", FAILED: "付款失败", EXPIRED: "已过期", REFUNDED: "已退款", PARTIALLY_REFUNDED: "部分退款", DISPUTED: "争议处理中", CANCELED: "已取消" }; return t(labels[status] ?? status); }
export function OrdersPage() {
  const { locale, t } = useLocale();
  const [cursor, setCursor] = useState<string | null>(null);
  const swr = useSWR(`/billing/orders?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, path => apiRequest<OrderSummary[]>(path));
  return <div className="flex flex-col gap-5"><Link href="/membership" className="text-sm underline">{t("返回会员")}</Link><h1 className="text-2xl font-bold">{t("订单记录")}</h1>{swr.isLoading ? <LoadingState /> : swr.error ? <ErrorState onRetry={() => void swr.mutate()} /> : <>{!swr.data?.data.length && <p>{t("还没有订单")}</p>}<div className="flex flex-col gap-3">{swr.data?.data.map(order => <Link key={order.id} href={`/membership/return?orderId=${encodeURIComponent(order.id)}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><p className="font-medium">{t(order.productCode === "DAY_PASS" ? "日票" : "年卡")} · {formatPrice(order.amount, order.currency, locale)}</p><p className="mt-1 break-all text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString(locale)} · {order.provider} · {order.id}</p>{order.refundedAmount > 0 && <p className="mt-1 text-sm">{t("退款金额")} {formatPrice(order.refundedAmount, order.currency, locale)}</p>}</div><span className="text-sm">{orderStatus(order.status, t)}</span></Link>)}</div><div className="flex gap-3">{cursor && <Button variant="outline" onClick={() => setCursor(null)}>{t("返回最新订单")}</Button>}{swr.data?.meta?.nextCursor && <Button variant="outline" onClick={() => setCursor(swr.data?.meta?.nextCursor ?? null)}>{t("下一页")}</Button>}</div></>}</div>;
}

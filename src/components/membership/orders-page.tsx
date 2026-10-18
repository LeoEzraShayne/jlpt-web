"use client";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { apiRequest } from "@/lib/api/client";
import type { MembershipHistoryRecord } from "@/lib/api/sentence-lab";
import { useLocale } from "@/components/locale/locale-provider";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { formatPrice } from "./membership-page";
export function orderStatus(status: string, t: <T>(value: T) => T) { const labels: Record<string, string> = { PENDING: "待付款", CREATED: "待付款", PAID: "已付款", FAILED: "付款失败", EXPIRED: "未付款", REFUNDED: "已退款", PARTIALLY_REFUNDED: "部分退款", DISPUTED: "争议处理中", CANCELED: "已取消" }; return t(labels[status] ?? status); }
export function OrdersPage() {
  const { locale, t } = useLocale();
  const [cursor, setCursor] = useState<string | null>(null);
  const swr = useSWR(`/billing/history?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, path => apiRequest<MembershipHistoryRecord[]>(path));
  return <div className="flex flex-col gap-5"><Link href="/membership" className="text-sm underline">{t("返回会员")}</Link><h1 className="text-2xl font-bold">{t("订单记录")}</h1>{swr.isLoading ? <LoadingState /> : swr.error ? <ErrorState onRetry={() => void swr.mutate()} /> : <>{!swr.data?.data.length && <p>{t("还没有购买或赠送记录")}</p>}<div className="flex flex-col gap-3">{swr.data?.data.map(order => order.kind === "GIFT" ? <div key={`gift:${order.id}`} className="min-w-0 rounded-xl border p-4">
        <p className="font-medium">{t("赠送 VIP")}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t("赠送时间：")}{new Date(order.giftedAt).toLocaleString(locale)}</p>
        {order.revokedAt && <p className="mt-1 text-xs text-muted-foreground">{t("赠送已撤回")}</p>}
      </div> : <Link key={order.id} href={`/membership/return?orderId=${encodeURIComponent(order.id)}`} className="min-w-0 rounded-xl border p-4">
        <div className="flex items-baseline justify-between gap-2"><p className="min-w-0 font-medium">{t(order.productCode === "DAY_PASS" ? "日票" : "年卡")} · {formatPrice(order.amount, order.currency, locale)}</p><span className="shrink-0 text-right text-sm">{orderStatus(order.status, t)}</span></div>
        <p className="mt-2 break-all text-xs text-muted-foreground">{t("订单号：")}{order.id}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("付款时间：")}{order.paidAt ? new Date(order.paidAt).toLocaleString(locale) : "—"}</p>
      </Link>)}</div><div className="flex gap-3">{cursor && <Button variant="outline" onClick={() => setCursor(null)}>{t("返回最新订单")}</Button>}{swr.data?.meta?.nextCursor && <Button variant="outline" onClick={() => setCursor(swr.data?.meta?.nextCursor ?? null)}>{t("下一页")}</Button>}</div></>}</div>;
}

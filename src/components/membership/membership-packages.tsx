"use client";

import { useEffect, useRef, useState } from "react";
import type { Catalog, ProductCode } from "@/lib/api/sentence-lab";
import { useLocale } from "@/components/locale/locale-provider";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function offerTimeLeft(endsAt: number, now: number) {
  const minutes = Math.max(0, Math.ceil((endsAt - now) / 60_000));
  return { days: Math.floor(minutes / 1440), hours: Math.floor(minutes % 1440 / 60), minutes: minutes % 60 };
}

type Props = {
  catalog: Catalog;
  pending: ProductCode | null;
  onCheckout: (code: ProductCode) => void;
  onOfferExpired: () => unknown;
};

export function MembershipPackages({ catalog, pending, onCheckout, onOfferExpired }: Props) {
  const { locale, t } = useLocale();
  const [now, setNow] = useState<number | null>(null);
  const refreshed = useRef<number | null>(null);
  const endsAt = catalog.launchEndsAt ? Date.parse(catalog.launchEndsAt) : NaN;
  const hasOffer = catalog.products.some(product => product.launchPrice);
  const expired = Number.isFinite(endsAt) && now !== null && now >= endsAt;
  const active = hasOffer && Number.isFinite(endsAt) && now !== null && !expired;

  useEffect(() => {
    if (!hasOffer || !Number.isFinite(endsAt)) return;
    const tick = () => setNow(Date.now());
    const initial = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    const visible = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [endsAt, hasOffer]);

  useEffect(() => {
    if (expired && hasOffer && refreshed.current !== endsAt) {
      refreshed.current = endsAt;
      void Promise.resolve(onOfferExpired()).catch(() => undefined);
    }
  }, [endsAt, expired, hasOffer, onOfferExpired]);

  const remaining = offerTimeLeft(endsAt, now ?? endsAt);
  const price = (amount: number, currency: string) => new Intl.NumberFormat(locale, {
    style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(currency === "JPY" ? amount : amount / 100);

  return <>
    {active && <p className="text-sm" data-testid="launch-countdown">
      {t("美元首发价截止")} {new Date(endsAt).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")}
      {locale === "en" ? ". Offer ends in " : "，优惠还有"}
      <strong className="font-semibold text-amber-700 dark:text-amber-400" role="timer">
        {locale === "en" ? `${remaining.days}d ${remaining.hours}h ${remaining.minutes}m` : `${remaining.days}天${remaining.hours}小时${remaining.minutes}分钟`}
      </strong>{locale === "en" ? "." : "结束"}
    </p>}
    <div className="grid items-stretch gap-4 md:grid-cols-2" data-testid="membership-packages">
      {catalog.products.map(product => {
        const launch = product.launchPrice && active;
        // An old cached quote must not remain purchasable past the offer deadline.
        const amount = product.launchPrice && expired ? product.regularAmount : product.amount;
        return <Card key={product.productCode} data-product={product.productCode}>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CardTitle>{t(product.productCode === "DAY_PASS" ? "日票" : "年卡")}</CardTitle>
              <span className="whitespace-nowrap rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                {t(product.productCode === "DAY_PASS" ? "连续 24 小时" : "连续 365 天")}
              </span>
            </div>
            {launch && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">{t("首发优惠中")}</span>}
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1" data-testid="package-price">
              {launch && product.regularAmount !== undefined && <del className="text-lg text-muted-foreground">{price(product.regularAmount, product.currency)}</del>}
              <span className="text-3xl font-bold">{amount === undefined ? t("价格加载中…") : price(amount, product.currency)}</span>
            </div>
            <p className="text-sm">{t("会员正常学习不限任务与批改次数，无隐藏每日上限。")}</p>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button className="w-full" disabled={!catalog.salesEnabled || !!pending || amount === undefined}
              onClick={() => onCheckout(product.productCode)}>
              {t(pending === product.productCode ? "正在打开安全支付…" : "使用 Stripe 安全支付")}
            </Button>
          </CardFooter>
        </Card>;
      })}
    </div>
  </>;
}

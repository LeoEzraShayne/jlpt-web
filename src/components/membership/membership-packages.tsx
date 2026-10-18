"use client";

import type { Catalog, ProductCode } from "@/lib/api/sentence-lab";
import { useLocale } from "@/components/locale/locale-provider";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = {
  catalog: Catalog;
  pending: ProductCode | null;
  onCheckout: (code: ProductCode) => void;
};

export function MembershipPackages({ catalog, pending, onCheckout }: Props) {
  const { locale, t } = useLocale();
  const price = (amount: number, currency: string) => new Intl.NumberFormat(locale, {
    style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(currency === "JPY" ? amount : amount / 100);

  return <>
    <div className="grid items-stretch gap-4 md:grid-cols-2" data-testid="membership-packages">
      {catalog.products.map(product => {
        const amount = product.amount;
        const currency = product.currency;
        return <Card key={product.productCode} data-product={product.productCode}>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CardTitle>{t(product.productCode === "DAY_PASS" ? "日票" : "年卡")}</CardTitle>
              <span className="whitespace-nowrap! rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                {t(product.productCode === "DAY_PASS" ? "连续 24 小时" : "连续 365 天")}
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1" data-testid="package-price">
              {product.regularAmount !== undefined && product.regularAmount > amount && <del className="text-sm text-muted-foreground">{price(product.regularAmount, currency)}</del>}
              <span className="text-3xl font-bold">{amount === undefined ? t("价格加载中…") : price(amount, currency)}</span>
            </div>
            <p className="whitespace-nowrap! text-[11px] min-[390px]:text-xs sm:text-sm">{t("学习与批改不限次数，无每日上限")}</p>
            {!!product.discountAmount && <p className="text-xs text-muted-foreground">{t("优惠")} {price(product.discountAmount, currency)}{product.promotionEndsAt && <> · {t("截止")} {new Date(product.promotionEndsAt).toLocaleString(locale, { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })} JST</>}</p>}
          </CardContent>
          <CardFooter className="mt-auto">
            <Button className="w-full" disabled={!catalog.salesEnabled || pending === product.productCode || amount === undefined}
              aria-busy={pending === product.productCode || undefined}
              onClick={() => onCheckout(product.productCode)}>
              {t(pending === product.productCode ? "正在打开安全支付…" : "使用 Stripe 安全支付")}
            </Button>
          </CardFooter>
        </Card>;
      })}
    </div>
  </>;
}

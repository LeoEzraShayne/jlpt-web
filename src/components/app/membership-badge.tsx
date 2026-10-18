"use client";
import { useLocale } from "@/components/locale/locale-provider";
import { useMembership } from "@/components/membership/use-membership";
import { cn } from "@/lib/utils";

/** Entitlements, including gifts, determine this status; order history does not. */
export function MembershipBadge() {
  const { t } = useLocale();
  const { data, error } = useMembership();
  const label = error ? t("会员状态暂不可用") : !data ? t("正在读取会员状态") : data.isMember ? t("会员有效") : t("非会员");
  return <span aria-label={label} title={label} className={cn(
    "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[10px] font-semibold leading-none",
    error || !data ? "bg-muted text-muted-foreground" : data.isMember ? "bg-primary text-primary-foreground" : "bg-[#e5e7eb] text-[#6b7280]",
  )}>{error ? "VIP ?" : !data ? "…" : "VIP"}</span>;
}

"use client";
import { useSearchParams } from "next/navigation";
import { NativeCommerceLink } from "./native-commerce-link";
import { useLocale } from "@/components/locale/locale-provider";
import { buttonVariants } from "@/components/ui/button";

export function AndroidLaunchPage() {
  const params = useSearchParams();
  const { t } = useLocale();
  const client = params.get("client");
  const action = params.get("action");
  if ((client !== "android-release" && client !== "android-test") || (action !== "membership" && action !== "reward"))
    return <p role="alert">{t("连接链接无效，请从安卓应用重新开始。")}</p>;
  return <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-5 px-5 py-12">
    <p>{t("正在同步账号与会员状态…")}</p>
    <NativeCommerceLink client={client} action={action} autoStart className={buttonVariants()}>{t("继续购买")}</NativeCommerceLink>
  </main>;
}

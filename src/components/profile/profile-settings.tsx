"use client";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import { LanguagePicker } from "@/components/locale/language-picker";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { useMe } from "@/hooks/use-api";
import { apiRequest } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { ThemePicker } from "@/components/theme/theme-picker";
import { PlansManager } from "@/components/plans/plans-manager";
import { setAdultAccessConfirmed } from "@/lib/adult-access";

export function ProfileSettings() {
  useLocale();
  const me = useMe();
  const router = useRouter();
  const { cache } = useSWRConfig();
  const [error, setError] = useState("");
  async function logout() {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
      setAdultAccessConfirmed(false);
      for (const key of Array.from(cache.keys())) cache.delete(key);
      router.replace("/login");
    } catch {
      setError(t("退出失败，请重试"));
    }
  }
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("我的学习")}</h1>
          <p className="break-all text-sm text-muted-foreground">
            {me.data?.displayName} · {me.data?.email}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ThemePicker />
          <Button asChild variant="outline">
            <Link href="/library">{t("词汇与表达库")}</Link>
          </Button>
          <Button variant="outline" onClick={() => void logout()}>
            {t("退出登录")}</Button>
        </div>
      </div>
      {error && <p role="alert">{t(error)}</p>}
      <LanguagePicker explanations /><Button asChild variant="outline"><Link href="/membership">{t("会员与额度")}</Link></Button><PlansManager />
      <Link href="/delete-account" className="text-sm underline underline-offset-4">{t("账号与数据删除申请")}</Link>
    </div>
  );
}

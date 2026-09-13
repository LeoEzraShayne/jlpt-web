"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useLocale } from "@/components/locale/locale-provider";
import { LanguagePicker } from "@/components/locale/language-picker";
import { Button } from "@/components/ui/button";
import { adultAccessConfirmed, setAdultAccessConfirmed, subscribeAdultAccess } from "@/lib/adult-access";

export function AdultAccessBoundary({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const accepted = useSyncExternalStore(subscribeAdultAccess, adultAccessConfirmed, () => false);
  const [checked, setChecked] = useState(false);
  if (accepted) return children;
  return (
    <main className="grid min-h-[80vh] place-items-center bg-background px-4 py-10">
      <section className="w-full max-w-lg space-y-6 rounded-2xl border bg-card p-6 sm:p-8" aria-labelledby="adult-access-title">
        <div className="flex justify-end"><LanguagePicker /></div>
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{t("日语造句实验室")}</p>
          <h1 id="adult-access-title" className="text-2xl font-bold">{t("仅限年满 18 周岁的用户")}</h1>
          <p className="text-sm leading-7 text-muted-foreground">{t("本日语学习服务仅面向成年人。未满 18 周岁请勿登录或使用学习与 AI 功能。")}</p>
        </div>
        <form className="space-y-5" onSubmit={event => { event.preventDefault(); if (checked) { setChecked(false); setAdultAccessConfirmed(true); } }}>
          <label className="flex items-start gap-3 text-sm leading-6">
            <input type="checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} className="mt-1 size-4 shrink-0 accent-primary" required />
            <span>{t("我确认已年满 18 周岁，并已阅读隐私说明。")}</span>
          </label>
          <Button type="submit" size="lg" disabled={!checked} className="w-full">{t("确认并继续")}</Button>
        </form>
        <nav className="flex flex-wrap gap-5 text-sm" aria-label={t("公开页面导航")}>
          <Link href="/privacy" className="underline underline-offset-4">{t("隐私说明")}</Link>
          <Link href="/delete-account" className="underline underline-offset-4">{t("账号删除申请")}</Link>
          <Link href="/" className="underline underline-offset-4">{t("返回首页")}</Link>
        </nav>
      </section>
    </main>
  );
}

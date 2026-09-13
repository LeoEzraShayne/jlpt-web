"use client";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import Link from "next/link";

export function PublicFooter() {
  useLocale();
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-[76rem] flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p>{t("JLPT Sentence Lab — 提供中英文体验的 JLPT N1～N4 日语语法学习工具。")}</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label={t("页脚导航")}>
          <Link href="/about" className="hover:text-foreground">{t("关于与联系")}</Link>
          <Link href="/privacy" className="hover:text-foreground">{t("隐私说明")}</Link>
          <Link href="/delete-account" className="hover:text-foreground">{t("账号删除申请")}</Link>
          <Link href="/login" className="hover:text-foreground">{t("登录")}</Link>
        </nav>
      </div>
    </footer>
  );
}

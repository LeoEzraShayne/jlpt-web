import type { Metadata } from "next";
import { localizedDocumentTitle } from "@/lib/i18n/document-locale";

export const SITE_URL = "https://jlpt.meritledger.org";
// Only anonymous, substantive public pages belong in search discovery.
export const PUBLIC_PAGES = {
  "/": "通过日语造句、AI 辅助反馈和间隔复习，练习 JLPT N1～N4 日语语法与词汇。支持中文和英文学习界面，结合学习计划巩固日常表达。",
  "/about": "了解 JLPT Sentence Lab（日语造句实验室）的语法与词汇练习、AI 辅助反馈、适用学习者及联系渠道。",
  "/privacy": "了解日语造句实验室如何处理 Google 登录、学习记录、AI 反馈、会员支付、广告及浏览器存储数据。",
  "/delete-account": "申请删除 JLPT造句实验室（JLPT Sentence Lab，开发者 Leo.Shayne）的账号与关联数据，查看邮件申请方式、删除范围和必要记录的保留说明。",
} as const;

export function publicPageMetadata(path: keyof typeof PUBLIC_PAGES): Metadata {
  const title = localizedDocumentTitle(path, "zh");
  const description = PUBLIC_PAGES[path];
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website", locale: "zh_CN", siteName: "JLPT Sentence Lab", url: path, title, description,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "JLPT Sentence Lab 日语语法与词汇练习" }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
  };
}

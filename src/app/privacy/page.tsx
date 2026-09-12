import type { Metadata } from "next";
import { PrivacyView } from "@/components/public/privacy-view";
export const metadata: Metadata = {
  title: "隐私说明",
  description: "JLPT Sentence Lab关于 Google 登录、学习数据、AI 批改和浏览器存储的隐私说明。",
  alternates: { canonical: "/privacy" },
  openGraph: { url: "/privacy", title: "JLPT Sentence Lab隐私说明" },
};
export default function Page() { return <PrivacyView />; }

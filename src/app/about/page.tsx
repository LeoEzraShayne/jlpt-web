import type { Metadata } from "next";
import { AboutView } from "@/components/public/about-view";
export const metadata: Metadata = {
  title: "关于与联系",
  description:
    "了解JLPT Sentence Lab的定位、核心功能、目标学习者、官网地址和项目联系渠道。",
  alternates: { canonical: "/about" },
  openGraph: {
    url: "/about",
    title: "关于JLPT Sentence Lab",
    description: "面向中文使用者的 JLPT N1～N4 日语语法输出练习工具。",
  },
};
export default function Page() { return <AboutView />; }

import type { Metadata } from "next";
import { HomeView } from "@/components/public/home-view";
const description = "JLPT Sentence Lab: practice Japanese grammar and vocabulary with AI feedback, spaced reviews, and Chinese or English explanations.";
export const metadata: Metadata = {
  title: "JLPT Sentence Lab官网｜JLPT N1～N4 日语语法学习",
  description,
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "JLPT Sentence Lab官网｜JLPT N1～N4 日语语法学习",
    description,
  },
};
export default function Page() { return <HomeView />; }

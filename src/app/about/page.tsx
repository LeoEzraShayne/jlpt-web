import type { Metadata } from "next";
import Link from "next/link";
import { Code2, ExternalLink, Goal, Languages, UsersRound } from "lucide-react";
import { PublicPage } from "@/components/public/public-page";

const siteUrl = "https://jlpt.meritledger.org";

export const metadata: Metadata = {
  title: "关于与联系",
  description:
    "了解文法トレーニング的定位、核心功能、目标学习者、官网地址和项目联系渠道。",
  alternates: { canonical: "/about" },
  openGraph: {
    url: "/about",
    title: "关于文法トレーニング",
    description: "面向中文使用者的 JLPT N1～N4 日语语法输出练习工具。",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "首页", item: `${siteUrl}/` },
    { "@type": "ListItem", position: 2, name: "关于", item: `${siteUrl}/about` },
  ],
};

export default function AboutPage() {
  return (
    <PublicPage>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <nav className="text-sm text-muted-foreground" aria-label="面包屑">
          <Link href="/" className="hover:text-foreground">首页</Link> / 关于
        </nav>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">关于文法トレーニング</h1>
        <p className="mt-6 text-lg leading-8 text-foreground/75">
          文法トレーニング是一款面向中文使用者的 JLPT N1～N4 日语语法学习 Web 应用。
          它把语法解释、主动造句、AI 批改、学习计划和间隔复习组合成一套持续练习流程。
        </p>

        <section className="mt-12 grid gap-5 sm:grid-cols-3">
          {[
            { icon: Languages, title: "学习范围", text: "JLPT N1、N2、N3、N4 日语语法" },
            { icon: UsersRound, title: "目标用户", text: "希望用中文理解并主动输出日语语法的学习者" },
            { icon: Goal, title: "产品目标", text: "帮助学习者从识别语法逐步过渡到正确使用语法" },
          ].map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border bg-card p-6">
              <Icon className="size-6 text-[color:var(--ring)]" />
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-2xl border bg-card p-6 sm:p-8">
          <h2 className="text-2xl font-bold">站点身份</h2>
          <dl className="mt-6 grid gap-5 sm:grid-cols-[10rem_1fr]">
            <dt className="font-medium">项目名称</dt>
            <dd className="text-muted-foreground">文法トレーニング</dd>
            <dt className="font-medium">官方网站</dt>
            <dd><Link href="/" className="text-secondary-foreground hover:underline">https://jlpt.meritledger.org/</Link></dd>
            <dt className="font-medium">项目类型</dt>
            <dd className="text-muted-foreground">日语语法学习 Web 应用</dd>
            <dt className="font-medium">使用语言</dt>
            <dd className="text-muted-foreground">中文界面与解释，日语学习内容</dd>
          </dl>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">联系与反馈</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            功能问题、内容纠错或项目反馈可通过公开 GitHub 仓库提交。
            请不要在公开 issue 中填写邮箱、账号信息、学习记录或其他个人敏感信息。
          </p>
          <a
            href="https://github.com/LeoEzraShayne/jlpt-web/issues"
            rel="me noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-3 font-medium hover:bg-muted"
          >
            <Code2 className="size-5" /> 前往 GitHub Issues <ExternalLink className="size-4" />
          </a>
        </section>
      </main>
    </PublicPage>
  );
}

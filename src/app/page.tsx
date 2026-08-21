import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  History,
  Library,
  PenLine,
  RefreshCcw,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicPage } from "@/components/public/public-page";

const siteUrl = "https://jlpt.meritledger.org";
const description =
  "文法トレーニング是面向中文使用者的 JLPT N1～N4 日语语法学习工具，通过日语造句、AI 语法批改、个性化计划和间隔复习帮助学习者把语法用于实际表达。";

export const metadata: Metadata = {
  title: "文法トレーニング官网｜JLPT N1～N4 日语语法学习",
  description,
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "文法トレーニング官网｜JLPT N1～N4 日语语法学习",
    description,
  },
};

const features = [
  {
    icon: Library,
    title: "N1～N4 语法库",
    text: "按 JLPT 级别查看语法点、中文解释、接续方式和日语例句。",
  },
  {
    icon: PenLine,
    title: "以造句练习输出",
    text: "不只阅读和背诵，而是用目标语法主动写出日语句子。",
  },
  {
    icon: BrainCircuit,
    title: "AI 语法批改",
    text: "从目标语法、接续、完整度、自然度和词汇等维度获得反馈。",
  },
  {
    icon: RefreshCcw,
    title: "间隔复习",
    text: "根据学习记录与记忆状态安排后续复习，减少无效重复。",
  },
  {
    icon: CalendarClock,
    title: "个性化学习计划",
    text: "结合目标日期和每天可用时间，生成当日学习与复习任务。",
  },
  {
    icon: History,
    title: "进度与历史记录",
    text: "查看语法掌握状态、造句批改结果和学习进度。",
  },
];

const faq = [
  {
    question: "文法トレーニング是做什么的？",
    answer:
      "它是一款 JLPT 日语语法学习 Web 应用。学习者选择 N1～N4 目标级别后，通过阅读解释、主动造句、AI 批改和间隔复习来练习语法。",
  },
  {
    question: "适合哪些学习者？",
    answer:
      "适合正在准备 JLPT N1、N2、N3 或 N4，能够阅读中文解释，并希望从“看得懂”进阶到“写得出、用得对”的日语学习者。",
  },
  {
    question: "是否包含 JLPT N5？",
    answer: "目前公开学习范围是 JLPT N1～N4，暂不包含 N5。",
  },
  {
    question: "AI 批改可以代替老师吗？",
    answer:
      "不能。AI 反馈用于辅助练习，可能出现误差；对考试规则、语感差异或重要表达有疑问时，建议再查权威资料或请教师确认。",
  },
  {
    question: "使用是否需要登录或付费？",
    answer:
      "官网介绍无需登录即可阅读；保存学习计划、进度和批改记录需要使用 Google 账号登录。目前应用可免费使用。",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "文法トレーニング",
      url: `${siteUrl}/`,
      description,
      inLanguage: ["zh-CN", "ja-JP"],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#application`,
      name: "文法トレーニング",
      url: `${siteUrl}/`,
      description,
      applicationCategory: "EducationalApplication",
      applicationSubCategory: "Japanese language learning",
      operatingSystem: "Web browser",
      inLanguage: ["zh-CN", "ja-JP"],
      isPartOf: { "@id": `${siteUrl}/#website` },
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      featureList: features.map((feature) => feature.title),
    },
    {
      "@type": "FAQPage",
      "@id": `${siteUrl}/#faq`,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
};

export default function Home() {
  return (
    <PublicPage>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <main>
        <section className="soft-grid border-b">
          <div className="mx-auto grid max-w-[76rem] items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-28">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium">
                <Sparkles className="size-4 text-[color:var(--ring)]" />
                JLPT N1～N4 · 中文解释 · Web 应用
              </p>
              <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                通过造句，真正掌握
                <span className="block text-secondary-foreground">日语语法</span>
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-foreground/75 sm:text-xl">
                文法トレーニング帮助中文使用者学习 JLPT N1～N4
                语法。阅读解释、主动造句、获得 AI 批改，再按记忆状态复习，
                把“看得懂”逐步变成“用得出”。
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/login">
                    免费开始学习 <ArrowRight className="size-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#how-it-works">了解学习方式</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                官网介绍无需登录；保存学习进度需要 Google 账号。
              </p>
            </div>
            <div className="rounded-[2rem] border bg-card p-6 shadow-2xl shadow-primary/10 sm:p-8">
              <div className="flex items-center gap-4">
                <Image src="/logo.svg" width={56} height={56} alt="" />
                <div>
                  <p className="text-sm text-muted-foreground">文法トレーニング</p>
                  <h2 className="text-xl font-bold">一次完整的语法练习</h2>
                </div>
              </div>
              <ol className="mt-7 grid gap-4 sm:grid-cols-2">
                {[
                  ["01", "理解", "阅读中文解释、接续和例句"],
                  ["02", "输出", "使用目标语法完成日语造句"],
                  ["03", "反馈", "查看 AI 批改、修改建议与参考句"],
                  ["04", "复习", "依据学习表现进入后续复习"],
                ].map(([number, title, text]) => (
                  <li key={number} className="flex gap-4 rounded-2xl border bg-background p-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-sm font-bold text-secondary-foreground">
                      {number}
                    </span>
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-[76rem]">
            <div className="max-w-3xl">
              <p className="font-semibold text-secondary-foreground">核心功能</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                围绕“理解、输出、反馈、复习”设计
              </h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                不是批量生成的语法词条页，而是一套需要登录后使用的学习流程。
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-2xl border bg-card p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="text-lg font-semibold">{title}</h3>
                  </div>
                  <p className="mt-2 leading-7 text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 border-y bg-card px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-[90rem] gap-10 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,.65fr)] xl:items-center">
            <div>
              <p className="font-semibold text-secondary-foreground">适用场景</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl xl:whitespace-nowrap">
                适合想把 JLPT 语法用于表达的学习者
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                <span className="block xl:whitespace-nowrap">
                  如果你正在准备 N1～N4，能读懂中文语法解释，却经常在写作或会话中想不起怎么用，
                </span>
                <span className="block">文法トレーニング可以把每天的学习拆成可执行的小任务。</span>
              </p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {[
                "按目标级别与目标日期制定学习计划",
                "每天用 10～30 分钟完成新学与复习任务",
                "针对指定语法造句，而不是只做识别题",
                "结合批改结果与回忆评价安排复习",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-2xl border bg-background p-4">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[color:var(--ring)]" />
                  <span className="leading-7">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <p className="font-semibold text-secondary-foreground">常见问题</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">关于文法トレーニング</h2>
            </div>
            <div className="mt-10 space-y-4">
              {faq.map((item) => (
                <article key={item.question} className="rounded-2xl border bg-card p-6">
                  <h3 className="flex items-start gap-3 text-lg font-semibold">
                    <Target className="mt-0.5 size-5 shrink-0 text-[color:var(--ring)]" />
                    {item.question}
                  </h3>
                  <p className="mt-3 pl-8 leading-7 text-muted-foreground">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="mx-auto flex max-w-[76rem] flex-col items-start justify-between gap-6 rounded-[2rem] bg-primary p-8 text-primary-foreground sm:p-10 md:flex-row md:items-center">
            <div>
              <p className="flex items-center gap-2 font-semibold"><BookOpenText className="size-5" /> 文法トレーニング</p>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">从下一个语法点开始主动输出</h2>
            </div>
            <Button asChild size="lg" variant="secondary">
              <Link href="/login">进入学习空间 <ArrowRight className="size-5" /></Link>
            </Button>
          </div>
        </section>
      </main>
    </PublicPage>
  );
}

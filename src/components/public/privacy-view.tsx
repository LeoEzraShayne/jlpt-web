"use client";
import { useLocale } from "@/components/locale/locale-provider";

import Link from "next/link";
import { PublicPage } from "@/components/public/public-page";

const siteUrl = "https://jlpt.meritledger.org";



const structuredData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "首页", item: `${siteUrl}/` },
    { "@type": "ListItem", position: 2, name: "隐私说明", item: `${siteUrl}/privacy` },
  ],
};

const sections = [
  { title: "购买与会员", paragraphs: ["Web 付款在 Stripe 托管页面完成。Stripe 处理付款所需的支付信息；应用不保存完整银行卡号。服务端保存订单编号、商品、币种、成交金额、付款及退款状态和会员权益，用于核实付款、提供会员、处理退款和对账。", "会员为一次性购买，不自动续费。日票连续 24 小时，年卡连续 365 天；续购保留剩余时长。未付款或仅返回成功页面不会开通会员。购买市场决定币种，界面语言不会决定价格。"] },
  {
    title: "收集的数据",
    paragraphs: [
      "使用 Google 登录时，应用接收 Google 提供的账号标识、邮箱、显示名称和头像（如有），用于创建账号和识别登录用户。",
      "使用学习功能时，应用保存你选择的 JLPT 级别、学习计划、偏好设置、学习进度、学习会话、造句内容、批改结果和复习记录。",
    ],
  },
  {
    title: "数据用途",
    paragraphs: [
      "这些数据用于提供登录、跨设备同步、学习计划、语法练习、AI 批改、间隔复习、进度展示和故障排查。",
      "Web 版本不展示广告，也不为广告投放建立用户画像。",
    ],
  },
  {
    title: "AI 批改",
    paragraphs: [
      "为了生成语法批改，你提交的日语句子、目标语法和必要的学习上下文会发送给应用当前配置的 AI 服务提供商处理。代码支持 Google Gemini 与 DeepSeek；实际使用的提供商由服务端配置决定。",
      "请不要在造句或场景描述中输入姓名、联系方式、账号、住址、财务信息或其他不必要的个人敏感信息。AI 反馈可能不准确，不应视为权威语言或考试结论。",
    ],
  },
  {
    title: "登录与浏览器存储",
    paragraphs: [
      "登录状态通过安全、仅 HTTP 可读的 Cookie 维持；应用服务端保存的是会话令牌的哈希值，而不是浏览器中的原始令牌。会话当前有效期为 7 天。",
      "浏览器本地存储用于保存颜色主题和界面语言。退出登录会清除登录 Cookie 并使对应服务端会话失效。",
    ],
  },
  {
    title: "数据共享与保留",
    paragraphs: [
      "账号和学习数据存储在应用运行所需的基础设施中；仅在提供登录、托管、数据库、AI 批改和运维功能所必需的范围内由相关服务处理。",
      "当前版本尚未在界面中提供自助导出或删除账号功能。如需隐私协助，可通过关于页面所列项目渠道联系维护者，但请勿在公开 issue 中发布个人数据。",
    ],
  },
];

export function PrivacyView() {
 const { t } = useLocale();
  return (
    <PublicPage>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <nav className="text-sm text-muted-foreground" aria-label={t("面包屑")}>
          <Link href="/" className="hover:text-foreground">{t("首页")}</Link> {t("/ 隐私说明")}</nav>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">{t("隐私说明")}</h1>
        <p className="mt-4 text-sm text-muted-foreground">{t("最后更新：2026 年 9 月 13 日")}</p>
        <p className="mt-6 text-lg leading-8 text-foreground/75">
          {t("本说明描述JLPT Sentence Lab在当前版本中如何处理登录信息、学习数据和 AI 批改内容。")}</p>
        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border bg-card p-6 sm:p-8">
              <h2 className="text-2xl font-bold">{t(section.title)}</h2>
              <div className="mt-4 space-y-4 leading-7 text-muted-foreground">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{t(paragraph)}</p>)}
              </div>
            </section>
          ))}
        </div>
        <p className="mt-8 leading-7 text-muted-foreground">
          {t("项目联系渠道见")}<Link href="/about" className="mx-1 text-secondary-foreground hover:underline">{t("关于与联系")}</Link>{t("页面。")}</p>
      </main>
    </PublicPage>
  );
}

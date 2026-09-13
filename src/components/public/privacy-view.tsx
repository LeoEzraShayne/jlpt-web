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
  { title: "安卓账号与 Google Play", paragraphs: ["安卓绑定后，应用在设备上加密保存登录凭据，并向服务端发送账号关联信息，以同步会员和学习权益。解除设备绑定会撤销该设备的登录授权，不会删除学习账号。", "通过 Google Play 购买时，Google 处理付款；应用服务端使用购买凭证、商品编号和随机账号关联标识核实购买，并保存订单、付款及退款状态。应用不接收 Google 账号密码或完整银行卡号。"] },
  { title: "购买与会员", paragraphs: ["Web 付款在 Stripe 托管页面完成。Stripe 处理付款所需的支付信息；应用不保存完整银行卡号。服务端保存订单编号、商品、币种、成交金额、付款及退款状态和会员权益，用于核实付款、提供会员、处理退款和对账。", "会员为一次性购买，不自动续费。日票连续 24 小时，年卡连续 365 天；续购保留剩余时长。未付款或仅返回成功页面不会开通会员。Web 新购买统一以美元（USD）付款；Google Play 按美元基准自动换算当地货币。界面语言不会决定价格，历史订单保留原币种。"] },
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
      "使用 Gemini 免费服务时，Google 可使用提交内容和生成结果改进产品及机器学习技术，并可能由人工审核。不要提交敏感、保密或个人信息。",
      "请不要在造句或场景描述中输入姓名、联系方式、账号、住址、财务信息或其他不必要的个人敏感信息。AI 反馈可能不准确，不应视为权威语言或考试结论。",
    ],
  },
  {
    title: "安卓激励广告与隐私选择",
    paragraphs: [
      "安卓激励广告开放后，非会员可以自行选择观看。Google 广告 SDK 会处理 IP 地址（可用于估算大致位置）、广告互动、诊断信息，以及广告或设备标识，用于广告、分析和防欺诈；这些数据也会由 Google 处理。数据通过 TLS 加密传输。",
      "广告奖励核验使用随机奖励标识和交易信息，不将你的邮箱、造句或录音作为广告奖励参数发送。需要征求同意时，应用通过 Google 的同意界面提供选择，并在需要时提供隐私选项入口；具体可用广告取决于你的选择和所在地区。",
    ],
  },
  {
    title: "旧功过格资料",
    paragraphs: [
      "安卓本地恢复页面读取支持格式的旧记录、待办、反思草稿和录音，用于查看、播放及由你选择位置导出。恢复页面不会自动上传这些资料。你选择的文件存储服务可能按其设置同步导出文件。",
      "旧功过格网页入口打开原有独立服务；其账号、云端资料和订阅由原服务管理，并适用原服务的隐私说明。",
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
      "账号与数据删除采用邮件申请、人工核验和处理方式。你可以在删除申请页面了解服务范围及需要保留的数据说明；发送申请不代表删除已经完成。请勿在公开 issue 中发布个人数据。",
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
          {t("本说明描述日语造句实验室在网页及安卓端如何处理账号、学习、付款、广告和旧资料恢复相关数据。")}</p>
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
          <Link href="/delete-account" className="text-secondary-foreground underline underline-offset-4">{t("账号与数据删除申请")}</Link>
        </p>
        <p className="mt-4 leading-7 text-muted-foreground">
          {t("项目联系渠道见")}<Link href="/about" className="mx-1 text-secondary-foreground hover:underline">{t("关于与联系")}</Link>{t("页面。")}</p>
        <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm" aria-label={t("服务提供商隐私说明")}>
          <a className="underline underline-offset-4" href="https://ai.google.dev/gemini-api/terms">{t("Gemini 服务条款")}</a>
          <a className="underline underline-offset-4" href="https://cdn.deepseek.com/policies/en-US/deepseek-open-platform-terms-of-service.html">{t("DeepSeek 开放平台条款")}</a>
          <a className="underline underline-offset-4" href="https://policies.google.com/privacy">{t("Google 隐私政策")}</a>
          <a className="underline underline-offset-4" href="https://official.meritledger.org/privacy-policy">{t("旧功过格隐私政策")}</a>
        </nav>
      </main>
    </PublicPage>
  );
}

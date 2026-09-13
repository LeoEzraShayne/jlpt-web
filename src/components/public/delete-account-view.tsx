"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale/locale-provider";
import { Button } from "@/components/ui/button";
import { PublicPage } from "./public-page";

const email = "contact@meritledger.org";
const copy = {
  zh: {
    title: "账号与数据删除申请",
    intro: "你可以通过邮件申请删除日语造句实验室（JLPT）或旧功过格服务的账号与关联数据。本页无需登录，也不要求重新安装应用。",
    requestTitle: "如何申请",
    steps: [
      "请使用该服务的注册邮箱发送申请；JLPT 用户请使用登录时的 Google 邮箱。注明申请范围：日语学习服务、旧功过格服务，或两者。",
      "如无法使用注册邮箱，请在邮件中说明情况，以便核验账号归属。不要发送密码、验证码或完整银行卡信息。",
      "点击按钮只会打开邮件应用，需要你自行检查并发送。若设备未配置邮件应用，也可复制下方邮箱，在你使用的邮箱中撰写申请。",
    ],
    action: "用邮件申请删除",
    subject: "账号与数据删除申请 — JLPT / 功过格",
    body: "你好，我希望申请删除账号及关联数据。\n\n申请服务（日语学习 JLPT / 旧功过格 / 两者）：\n注册邮箱：\n申请范围或无法使用注册邮箱的情况：\n\n我理解发送申请不代表删除已完成，账号归属及处理范围需要核验。",
    scopeTitle: "申请范围与记录保留",
    scope: [
      "日语学习资料包括账号资料、学习计划、造句与批改、学习进度和复习记录。旧功过格资料由其独立服务处理；请明确要删除哪一项服务。旧应用内的删除操作不代表日语学习账号也已删除。",
      "为必要的账务核对、安全、争议处理或适用要求，部分交易记录可能需要保留。处理申请时会向你说明具体删除范围及需要保留的数据。",
    ],
    noticeTitle: "发送申请后",
    notices: [
      "申请经人工核验后处理。请以收到的处理结果为准。",
      "退出登录或解除设备绑定不会删除账号。云端账号处理不会自动删除你已导出的文件；请自行管理这些副本。",
      "旧功过格订阅不会因发送本申请自动取消。如仍有订阅，请同时查看原服务的订阅管理说明。",
    ],
    legacy: "查看旧功过格删除说明",
    privacy: "查看隐私说明",
  },
  en: {
    title: "Account and data deletion request",
    intro: "You can request deletion of your JLPT Sentence Lab account, your legacy Merit Ledger account, or both by email. This page does not require sign-in or reinstalling the app.",
    requestTitle: "How to request deletion",
    steps: [
      "Send your request from the email registered with the service. For JLPT, use the Google email you sign in with. Specify JLPT Sentence Lab, legacy Merit Ledger, or both.",
      "If you cannot use the registered email address, explain this in your message so account ownership can be verified. Do not send passwords, verification codes, or full payment card details.",
      "The button only opens your email app. You must review and send the message yourself. If no email app is configured, copy the address below and compose a request in your usual email service.",
    ],
    action: "Request deletion by email",
    subject: "Account and data deletion request — JLPT / Merit Ledger",
    body: "Hello, I would like to request deletion of my account and associated data.\n\nService (JLPT Sentence Lab / legacy Merit Ledger / both):\nRegistered email address:\nRequested scope or difficulty accessing the registered email address:\n\nI understand that sending this request does not complete deletion. Account ownership and the scope of processing need to be verified.",
    scopeTitle: "Scope and retained records",
    scope: [
      "JLPT learning data includes account information, study plans, sentences and corrections, learning progress, and review history. Legacy Merit Ledger data is handled by its separate service. Specify which service you want deleted. Deletion in the old app does not mean your JLPT account has also been deleted.",
      "Some transaction records may need to be retained for necessary accounting, security, dispute handling, or applicable requirements. The response to your request will explain which data will be deleted and which records need to be retained.",
    ],
    noticeTitle: "After sending your request",
    notices: [
      "Requests are processed after manual verification. Refer to the response you receive for the outcome.",
      "Signing out or unlinking a device does not delete your account. Processing a cloud account does not automatically delete files you have exported; manage these copies yourself.",
      "Sending this request does not automatically cancel a legacy Merit Ledger subscription. If you have an active subscription, also consult the original service's subscription management instructions.",
    ],
    legacy: "Legacy Merit Ledger deletion instructions",
    privacy: "Read the privacy notice",
  },
};

export function DeleteAccountView() {
  const { locale } = useLocale();
  const text = copy[locale];
  const mailto = `mailto:${email}?subject=${encodeURIComponent(text.subject)}&body=${encodeURIComponent(text.body)}`;
  return (
    <PublicPage>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{text.title}</h1>
        <p className="mt-5 leading-7 text-muted-foreground">{text.intro}</p>
        <section className="mt-8 rounded-2xl border bg-card p-5 sm:p-7" aria-labelledby="deletion-request">
          <h2 id="deletion-request" className="text-xl font-semibold">{text.requestTitle}</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 leading-7">
            {text.steps.map(step => <li key={step}>{step}</li>)}
          </ol>
          <p className="my-5 break-all select-text font-medium">{email}</p>
          <Button asChild size="lg" className="min-h-11 max-w-full whitespace-normal text-center">
            <a href={mailto}>{text.action}</a>
          </Button>
        </section>
        {[
          { title: text.scopeTitle, paragraphs: text.scope },
          { title: text.noticeTitle, paragraphs: text.notices },
        ].map(section => (
          <section key={section.title} className="mt-8">
            <h2 className="text-xl font-semibold">{section.title}</h2>
            {section.paragraphs.map(paragraph => <p key={paragraph} className="mt-3 leading-7 text-muted-foreground">{paragraph}</p>)}
          </section>
        ))}
        <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <Link href="/privacy" className="underline underline-offset-4">{text.privacy}</Link>
          <a href="https://official.meritledger.org/delete-account" className="underline underline-offset-4">{text.legacy}</a>
        </nav>
      </main>
    </PublicPage>
  );
}

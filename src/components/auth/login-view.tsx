"use client";

import {
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  CheckCircle2,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemePicker } from "@/components/theme/theme-picker";
import { authUrl, ApiError } from "@/lib/api/client";
import { useCurrentPlan, useMe } from "@/hooks/use-api";

export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const me = useMe();
  const plan = useCurrentPlan(Boolean(me.data));
  useEffect(() => {
    if (plan.data) router.replace(params.get("next") || "/today");
    if (
      plan.error instanceof ApiError &&
      plan.error.code === "PLAN_NOT_INITIALIZED"
    )
      router.replace("/onboarding");
  }, [params, plan.data, plan.error, router]);
  return (
    <main className="relative min-h-screen overflow-x-clip bg-background px-4 py-5 sm:px-5 sm:py-8">
      <div className="soft-grid absolute inset-0 opacity-50" />
      <div className="relative mx-auto flex max-w-[82.5rem] justify-end">
        <ThemePicker compact />
      </div>
      <div className="relative mx-auto grid min-h-[calc(100vh-72px)] w-full min-w-0 max-w-[82.5rem] items-center gap-8 py-5 sm:min-h-[calc(100vh-96px)] sm:gap-12 sm:py-0 lg:-translate-y-[clamp(2.5rem,7vh,6rem)] lg:grid-cols-[1.15fr_.85fr] xl:grid-cols-[minmax(0,1.25fr)_minmax(490px,.85fr)] xl:gap-16">
        <section className="min-w-0">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground sm:size-14 xl:size-[3.75rem]">
              <BookOpenText className="size-6 sm:size-7 xl:size-[1.875rem]" />
            </span>
            <h1 className="whitespace-nowrap text-[clamp(1rem,5.2vw,1.25rem)] font-bold leading-[1.08] tracking-tight sm:text-3xl lg:text-4xl xl:text-[2.75rem] 2xl:text-5xl">
              通过造句，<span className="text-[color:var(--ring)]">真正掌握</span>
              日语语法
            </h1>
          </div>
          <p className="mt-6 max-w-3xl text-base leading-7 text-foreground/70 sm:mt-7 sm:text-lg sm:leading-8 xl:text-xl xl:leading-9">
            理解语法、主动表达、AI 批改。依据
            <span className="text-[color:var(--ring)]">艾宾浩斯记忆曲线</span>
            所揭示的遗忘规律，
            <br className="hidden xl:block" />
            动态安排学习与复习。每天
            10～30 分钟，把 N1～N4 语法变成真正会用的日语。
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            <Feature
              icon={BrainCircuit}
              title="AI 细致批改"
              text="语法、接续和自然度"
            />
            <Feature
              icon={RefreshCcw}
              title="科学安排复习"
              text="按记忆状态自动推进"
            />
            <Feature
              icon={CheckCircle2}
              title="看得见的进步"
              text="学习状态与历史记录同步"
            />
          </div>
        </section>
        <section className="min-w-0 max-w-full rounded-3xl border bg-card p-5 shadow-2xl shadow-primary/10 sm:p-10 xl:p-11">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary text-secondary-foreground sm:size-14 xl:size-[3.75rem]">
              <Sparkles className="size-6 sm:size-7 xl:size-[1.875rem]" />
            </span>
            <h2 className="min-w-0 text-xl font-bold sm:text-2xl xl:text-[1.625rem]">
              开始今天的学习
            </h2>
          </div>
          <p className="mt-5 whitespace-normal text-sm leading-6 text-foreground/70 xl:whitespace-nowrap">
            使用 Google 账号登录，学习进度和主题会在不同设备间同步。
          </p>
          <Button
            asChild
            size="lg"
            className="mt-7 h-12 w-full max-w-full text-base sm:mt-8 xl:h-[3.25rem] xl:text-[1.0625rem]"
          >
            <a href={authUrl}>
              使用 Google 登录
              <ArrowRight className="size-5" />
            </a>
          </Button>
          {params.get("error") && (
            <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              登录未完成，请重新尝试。
            </p>
          )}
          <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
            登录即表示你同意仅将账号用于保存学习进度。我们不会在浏览器中保存
            OAuth Token。
          </p>
        </section>
      </div>
    </main>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof BrainCircuit;
  title: string;
  text: string;
}) {
  return (
    <div className="w-full min-w-0 rounded-2xl border bg-card/80 p-5">
      <div className="flex items-center gap-2.5">
        <Icon className="size-[1.375rem] shrink-0 text-[color:var(--ring)]" />
        <h3 className="font-semibold xl:text-lg">{title}</h3>
      </div>
      <p className="mt-2 text-center text-[13px] text-muted-foreground xl:text-sm">
        {text}
      </p>
    </div>
  );
}

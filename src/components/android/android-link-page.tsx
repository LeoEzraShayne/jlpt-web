"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { useMe } from "@/hooks/use-api";
import { apiFetcher, apiRequest } from "@/lib/api/client";
import { bindingIdPattern, validatedAndroidCallback, type AndroidClientId } from "@/lib/android-commerce";
import { useLocale } from "@/components/locale/locale-provider";
import { LanguagePicker } from "@/components/locale/language-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";

type BindingDetails = { clientId: AndroidClientId; expiresAt: string; scopes: string[] };

export function AndroidLinkPage() {
  const { t } = useLocale();
  const params = useSearchParams();
  const id = params.get("bindingId") ?? "";
  const valid = params.getAll("bindingId").length === 1 && bindingIdPattern.test(id);
  const me = useMe();
  const binding = useSWR<BindingDetails>(valid && me.data ? `/android/auth/bindings/${id}` : null, apiFetcher, { shouldRetryOnError: false });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const lock = useRef(false);
  const details = binding.data;
  const supported = details && ["android-release", "android-test"].includes(details.clientId);
  const expiresAt = details ? Date.parse(details.expiresAt) : null;
  const expired = expiresAt !== null && (!Number.isFinite(expiresAt) || expiresAt <= now);
  useEffect(() => {
    if (expiresAt === null || !Number.isFinite(expiresAt)) return;
    const timer = window.setTimeout(() => setNow(Date.now()), Math.max(0, expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [expiresAt]);

  async function approve() {
    if (lock.current || !details || !supported || !me.data) return;
    lock.current = true; setPending(true); setError("");
    try {
      const { data } = await apiRequest<{ callbackUrl: string }>(`/android/auth/bindings/${id}/approve`, { method: "POST", body: "{}" });
      window.location.assign(validatedAndroidCallback(data.callbackUrl, details.clientId, window.location.origin));
    } catch {
      // Do not display server response details or any returned authorization code.
      setError("连接未完成，请返回安卓应用重新发起连接。");
      setPending(false); lock.current = false;
    }
  }

  return <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-5 px-5 py-12">
    <div className="flex justify-end"><LanguagePicker /></div>
    <Card>
      <CardHeader><CardTitle>{t("连接安卓应用")}</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-5">
        {!valid ? <p role="alert">{t("连接链接无效，请从安卓应用重新开始。")}</p> : binding.isLoading ? <LoadingState /> : binding.error ? <ErrorState message={t("无法读取连接请求，请返回安卓应用重试。")} onRetry={() => void binding.mutate()} /> : details && <>
          <p className="text-sm text-muted-foreground">{t("确认将安卓应用连接到以下学习账号：")}</p>
          <div className="rounded-xl border p-4"><p className="font-medium">{me.data?.displayName}</p><p className="break-all text-sm text-muted-foreground">{me.data?.email}</p></div>
          {details.clientId === "android-test" && <p className="rounded-xl border p-3 text-sm">{t("这是安卓测试应用连接。")}</p>}
          <p className="text-sm leading-6">{t("连接后可在应用内查看会员、购买 Google Play 日票或年卡，以及领取广告奖励。")}</p>
          {!supported || expired ? <p role="alert">{t("连接请求已失效，请从安卓应用重新开始。")}</p> : <Button disabled={pending} onClick={() => void approve()}>{t(pending ? "正在连接…" : "确认并返回安卓应用")}</Button>}
          <p className="text-xs text-muted-foreground">{t("如果这不是你刚刚发起的请求，请关闭此页面。")}</p>
        </>}
        {error && <p role="alert" className="text-sm text-destructive">{t(error)}</p>}
      </CardContent>
    </Card>
  </main>;
}

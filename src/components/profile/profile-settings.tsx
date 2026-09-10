"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { useMe } from "@/hooks/use-api";
import { apiRequest } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { ThemePicker } from "@/components/theme/theme-picker";
import { PlansManager } from "@/components/plans/plans-manager";

export function ProfileSettings() {
  const me = useMe();
  const router = useRouter();
  const { cache } = useSWRConfig();
  const [error, setError] = useState("");
  async function logout() {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
      for (const key of Array.from(cache.keys())) cache.delete(key);
      router.replace("/login");
    } catch {
      setError("退出失败，请重试");
    }
  }
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">我的学习</h1>
          <p className="break-all text-sm text-muted-foreground">
            {me.data?.displayName} · {me.data?.email}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ThemePicker />
          <Button asChild variant="outline">
            <Link href="/library">词汇与表达库</Link>
          </Button>
          <Button variant="outline" onClick={() => void logout()}>
            退出登录
          </Button>
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
      <PlansManager />
    </div>
  );
}

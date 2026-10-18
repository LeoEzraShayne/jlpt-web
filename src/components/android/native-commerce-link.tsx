"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { apiRequest } from "@/lib/api/client";
import { nativeCommerceUrl, nativeHandoffAvailable, type AndroidClientId } from "@/lib/android-commerce";
import { useLocale } from "@/components/locale/locale-provider";

/** An authenticated, single-use launch; no session token is exposed to the browser URL. */
export function NativeCommerceLink({ client, action, children, className, autoStart = false }: {
  client: AndroidClientId; action: "membership" | "reward"; children: ReactNode; className?: string; autoStart?: boolean;
}) {
  const { t } = useLocale();
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [destination, setDestination] = useState<string>();
  async function launch() {
    if (lock.current) return;
    if (!nativeHandoffAvailable()) { window.location.assign(nativeCommerceUrl(client, action)); return; }
    lock.current = true; setPending(true); setError(false); setDestination(undefined);
    try {
      const { data } = await apiRequest<{ ticket: string; expiresAt: string }>("/android/auth/handoffs", {
        method: "POST", body: JSON.stringify({ clientId: client, action }),
      });
      if (!/^[A-Za-z0-9_-]{43}$/.test(data.ticket)) throw new Error("Invalid handoff");
      const url = nativeCommerceUrl(client, action, data.ticket);
      setDestination(url);
      window.location.assign(url);
    } catch { setError(true); }
    finally { lock.current = false; setPending(false); }
  }
  useEffect(() => {
    if (!autoStart) return;
    const timer = window.setTimeout(() => void launch(), 0);
    return () => window.clearTimeout(timer);
    // Auto-launch once per mounted route; manual retry remains available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);
  return <>
    <button type="button" className={className} disabled={pending} onClick={() => void launch()}>{pending ? t("正在连接…") : children}</button>
    {destination && <a className="text-sm underline" href={destination}>{t("继续购买")}</a>}
    {error && <p role="alert" className="text-sm text-destructive">{t("连接未完成，请重试。")}</p>}
  </>;
}

"use client";

import { LocaleProvider } from "@/components/locale/locale-provider";
import { SWRConfig } from "swr";
import { FocusCycleProvider } from "@/components/focus/focus-cycle-provider";
import { apiFetcher } from "@/lib/api/client";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher: apiFetcher, revalidateOnFocus: true, dedupingInterval: 2_000, errorRetryCount: 2 }}>
      <LocaleProvider><FocusCycleProvider>{children}</FocusCycleProvider></LocaleProvider>
    </SWRConfig>
  );
}

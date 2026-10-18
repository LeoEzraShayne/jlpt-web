"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import useSWR from "swr";
import { apiFetcher, ApiError } from "@/lib/api/client";
import { apiKeys } from "@/lib/api/keys";
import type { AiReviewJob } from "@/lib/api/types";

export function recoverableReviewError(error: ApiError) {
  return !error.status || error.status === 408 || error.status === 429 || error.status >= 500;
}

export function useReviewStatus(id: string | undefined, pollInterval: number) {
  const key = id ? apiKeys.review(id) : null;
  const activeKey = useRef(key);
  useLayoutEffect(() => { activeKey.current = key; }, [key]);
  const recovery = useRef<{ key: string; until: number; error: ApiError } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  const latest = useRef<{ key: string | null; status?: AiReviewJob['status'] }>({ key });
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimeout(timer.current); };
  }, [key]);

  const state = useSWR<AiReviewJob, ApiError>(key, async (path: string) => {
    // Focus/reconnect and manual cache revalidation must also respect Retry-After.
    const hold = recovery.current;
    if (hold?.key === path && Date.now() < hold.until) throw hold.error;
    try {
      const result = await apiFetcher<AiReviewJob>(path);
      if (activeKey.current === path) { recovery.current = null; clearTimeout(timer.current); }
      return result;
    } catch (error) {
      const failure = error as ApiError;
      if (activeKey.current === path && failure.status === 429) {
        recovery.current = { key: path, until: Date.now() + Math.max(1_000, failure.retryAfterMs ?? 60_000), error: failure };
      }
      throw error;
    }
  }, {
    dedupingInterval: 750,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    refreshInterval: job => !job || ["QUEUED", "PROCESSING"].includes(job.status) ? pollInterval : 0,
    shouldRetryOnError: true,
    onErrorRetry: (error, failedKey, _config, revalidate, options) => {
      if (!mounted.current || activeKey.current !== failedKey || !recoverableReviewError(error)) return;
      if (latest.current.key === failedKey && latest.current.status && !['QUEUED', 'PROCESSING'].includes(latest.current.status)) return;
      clearTimeout(timer.current);
      const hold = recovery.current;
      const delay = hold?.key === failedKey && error.status === 429
        ? Math.max(1_000, hold.until - Date.now())
        : Math.min(30_000, 1_000 * 2 ** Math.min(options.retryCount, 5));
      const resume = () => {
        if (!mounted.current || activeKey.current !== failedKey) return;
        if (document.visibilityState === "hidden" || !navigator.onLine) {
          timer.current = setTimeout(resume, 2_000);
          return;
        }
        revalidate(options);
      };
      timer.current = setTimeout(resume, delay);
    },
  });
  useEffect(() => { latest.current = { key, status: state.data?.status }; }, [key, state.data?.status]);
  return state;
}

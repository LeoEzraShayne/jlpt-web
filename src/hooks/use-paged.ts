"use client";
import useSWRInfinite from "swr/infinite";
import { useEffect, useRef } from "react";
import { apiRequest } from "@/lib/api/client";
export function usePaged<T>(url: string, resetPageOnChange = false) {
  const swr = useSWRInfinite<{ items: T[]; nextCursor?: string | null }>(
    (index, previous) => {
      if (previous && !previous.nextCursor) return null;
      return `${url}${url.includes("?") ? "&" : "?"}limit=30${index && previous?.nextCursor ? `&cursor=${encodeURIComponent(previous.nextCursor)}` : ""}`;
    },
    async (path) => {
      const response = await apiRequest<T[]>(path);
      return { items: response.data, nextCursor: response.meta?.nextCursor };
    },
  );
  const { setSize, size } = swr;
  const lastUrl = useRef<string | null>(null);
  useEffect(() => {
    if (!resetPageOnChange || lastUrl.current === url) return;
    lastUrl.current = url;
    // SWR restores each cached key's old page count, even with persistSize:false.
    if (size > 1) void setSize(1);
  }, [url, resetPageOnChange, setSize, size]);
  return {
    ...swr,
    items: swr.data?.flatMap((page) => page.items) ?? [],
    more: Boolean(swr.data?.at(-1)?.nextCursor),
  };
}

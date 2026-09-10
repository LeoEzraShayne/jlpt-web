"use client";
import useSWRInfinite from "swr/infinite";
import { apiRequest } from "@/lib/api/client";
export function usePaged<T>(url: string) {
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
  return {
    ...swr,
    items: swr.data?.flatMap((page) => page.items) ?? [],
    more: Boolean(swr.data?.at(-1)?.nextCursor),
  };
}

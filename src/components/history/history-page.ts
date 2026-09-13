import { apiRequest } from "@/lib/api/client";
import type { SentenceAttempt } from "@/lib/api/types";

export interface HistoryPage {
  items: SentenceAttempt[];
  nextCursor?: string | null;
  hasPending: boolean;
}

export async function fetchHistoryPage(path: string): Promise<HistoryPage> {
  let hasPending = false;
  const visited = new Set<string>();
  // Keep the server cursor even when a page contains no scored attempts.
  while (!visited.has(path)) {
    visited.add(path);
    const response = await apiRequest<SentenceAttempt[]>(path);
    hasPending ||= response.data.some(attempt =>
      attempt.aiJob?.status === "QUEUED" || attempt.aiJob?.status === "PROCESSING");
    const items = response.data.filter(attempt =>
      Number.isFinite(attempt.aiJob?.result?.totalScore));
    const nextCursor = response.meta?.nextCursor;
    if (items.length || !nextCursor) return { items, nextCursor, hasPending };
    path = `/sentence-attempts?cursor=${encodeURIComponent(nextCursor)}`;
  }
  throw new Error("学习记录加载失败，请重试");
}

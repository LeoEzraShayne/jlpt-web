import type { JlptLevel } from "@/lib/api/types";

export const apiKeys = {
  me: "/me",
  plan: "/study-plans/current",
  today: "/dashboard/today",
  grammarLevels: "/grammar-levels",
  grammar: (level: JlptLevel, query = "") => `/grammar-points?level=${level}${query}`,
  grammarDetail: (id: string) => `/grammar-points/${id}`,
  session: (id: string) => `/study-sessions/${id}`,
  reviewQueue: "/review-queue",
  forecast: (days = 7) => `/study-plans/current/forecast?days=${days}`,
  review: (id: string) => `/sentence-reviews/${id}`,
  history: (cursor?: string) => `/sentence-attempts${cursor ? `?cursor=${cursor}` : ""}`,
  historyDetail: (id: string) => `/sentence-attempts/${id}`,
};

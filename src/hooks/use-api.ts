"use client";

import useSWR from "swr";
import { apiFetcher, apiRequest } from "@/lib/api/client";
import { apiKeys } from "@/lib/api/keys";
import type { Dashboard, ForecastDay, GrammarLevel, GrammarPoint, JlptLevel, ReviewSchedule, StudyPlan, StudyPlanForecast, StudyPlanList, PersonalExpression, VocabularyEntry, User } from "@/lib/api/types";

export const useMe = () => useSWR<User>(apiKeys.me, apiFetcher, { shouldRetryOnError: false });
export const useCurrentPlan = (enabled = true) => useSWR<StudyPlan>(enabled ? apiKeys.plan : null, apiFetcher, { shouldRetryOnError: false });
export const usePlans = (enabled = true) => useSWR<StudyPlanList>(enabled ? apiKeys.plans : null, apiFetcher, { shouldRetryOnError: false });
export const useVocabulary = (query = "", level?: JlptLevel) => useSWR<VocabularyEntry[]>(apiKeys.vocabulary(query, level), apiFetcher, { keepPreviousData: true });
export const useExpressions = () => useSWR<PersonalExpression[]>(apiKeys.expressions, apiFetcher);
export const useToday = () => useSWR<Dashboard>(apiKeys.today, apiFetcher);
export const useGrammarLevels = () => useSWR<GrammarLevel[]>(apiKeys.grammarLevels, apiFetcher);
export const useGrammar = (level: JlptLevel, query: string) => useSWR<GrammarPoint[]>(apiKeys.grammar(level, query), apiFetcher, { keepPreviousData: true });
export const useGrammarDetail = (id: string) => useSWR<GrammarPoint>(id ? apiKeys.grammarDetail(id) : null, apiFetcher);
export const useReviewQueue = (level?: JlptLevel) => useSWR<ReviewSchedule[]>(`${apiKeys.reviewQueue}${level ? `?level=${level}` : ""}`, apiFetcher);
export const useStudyPlanForecast = (days = 7, planId?: string) =>
  useSWR<StudyPlanForecast>(planId ? apiKeys.planForecast(planId, days) : apiKeys.forecast(days), async (path: string) => {
    const response = await apiRequest<ForecastDay[]>(path);
    return {
      days: response.data,
      meta: response.meta as StudyPlanForecast["meta"],
    };
  });

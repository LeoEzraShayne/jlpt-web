"use client";
import { useMe } from "./use-api";
export function useExplanationLocale() { return useMe().data?.explanationLocale ?? "zh"; }

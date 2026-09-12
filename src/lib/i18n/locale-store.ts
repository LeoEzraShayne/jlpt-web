import type { AppLocale } from "@/lib/api/sentence-lab";
import en from "./en.json";
const listeners = new Set<() => void>();
let locale: AppLocale = "zh";
export function currentLocale(): AppLocale { return locale; }
export function setLocale(value: AppLocale) {
  locale = value;
  try { localStorage.setItem("jlpt-ui-locale", value); } catch {}
  document.documentElement.lang = value === "en" ? "en" : "zh-CN";
  listeners.forEach(listener => listener());
}
export function subscribeLocale(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
const dictionary: Record<string, string> = en;
const patterns = Object.entries(dictionary).filter(([key]) => /\{\d+\}/.test(key)).map(([key, value]) => ({
  expression: new RegExp("^" + key.split(/\{\d+\}/).map(part => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("(.+?)") + "$"), value,
}));
export function translate<T>(source: T, language: AppLocale = locale): T {
  if (language !== "en" || typeof source !== "string") return source;
  const normalized = source.replace(/\s+/g, " ").trim();
  const exact = dictionary[normalized];
  if (exact !== undefined) return exact as T;
  for (const { expression, value } of patterns) {
    const match = normalized.match(expression);
    if (match) return value.replace(/\{(\d+)\}/g, (_, index: string) => match[Number(index) + 1]) as T;
  }
  return source;
}
export const t = translate;

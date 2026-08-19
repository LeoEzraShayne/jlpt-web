"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { ThemeId } from "@/lib/api/types";

const storageKey = "jlpt-color-theme";
const themes: ThemeId[] = ["sunshine", "coral", "mint", "ocean", "violet"];
const listeners = new Set<() => void>();
const ThemeContext = createContext<{ theme: ThemeId; setTheme: (theme: ThemeId) => void } | null>(null);

function getThemeSnapshot(): ThemeId {
  const current = document.documentElement.dataset.theme as ThemeId | undefined;
  return current && themes.includes(current) ? current : "sunshine";
}

function subscribeTheme(listener: () => void) {
  const syncStoredTheme = () => {
    const stored = localStorage.getItem(storageKey) as ThemeId | null;
    document.documentElement.dataset.theme = stored && themes.includes(stored) ? stored : "sunshine";
    listener();
  };
  listeners.add(listener);
  window.addEventListener("storage", syncStoredTheme);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", syncStoredTheme);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore<ThemeId>(subscribeTheme, getThemeSnapshot, () => "sunshine");
  const setTheme = useCallback((next: ThemeId) => {
    document.documentElement.dataset.theme = next;
    localStorage.setItem(storageKey, next);
    listeners.forEach((listener) => listener());
  }, []);
  const value = useMemo(() => ({ theme, setTheme }), [setTheme, theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useColorTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useColorTheme must be used within ThemeProvider");
  return value;
}

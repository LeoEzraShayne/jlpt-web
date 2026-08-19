import type { GrammarLevel, JlptLevel } from "@/lib/api/types";

export const jlptLevels: JlptLevel[] = ["N1", "N2", "N3", "N4"];

export const fallbackGrammarLevels: GrammarLevel[] = [
  { level: "N1", grammarCount: 40, contentStatus: "AVAILABLE" },
  { level: "N2", grammarCount: 40, contentStatus: "AVAILABLE" },
  { level: "N3", grammarCount: 100, contentStatus: "AVAILABLE" },
  { level: "N4", grammarCount: 43, contentStatus: "AVAILABLE" },
];

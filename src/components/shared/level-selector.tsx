import { Button } from "@/components/ui/button";
import { fallbackGrammarLevels } from "@/lib/jlpt";
import type { GrammarLevel, JlptLevel } from "@/lib/api/types";

export function LevelSelector({
  value,
  onChange,
  levels = fallbackGrammarLevels,
  allowPending = false,
}: {
  value: JlptLevel;
  onChange: (level: JlptLevel) => void;
  levels?: GrammarLevel[];
  allowPending?: boolean;
}) {
  return <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4" aria-label="JLPT 等级">
    {levels.map((item) => {
      const pending = item.contentStatus === "PENDING";
      return <Button
        key={item.level}
        type="button"
        variant={value === item.level ? "default" : "outline"}
        disabled={pending && !allowPending}
        aria-pressed={value === item.level}
        onClick={() => onChange(item.level)}
        className="h-auto min-h-12 flex-col gap-0.5 py-2"
      >
        <strong>{item.level}</strong>
        <span className="text-[11px] font-normal opacity-75">{pending ? "待补充" : `${item.grammarCount} 条`}</span>
      </Button>;
    })}
  </div>;
}

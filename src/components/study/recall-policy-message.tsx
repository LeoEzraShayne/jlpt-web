"use client";
import { useLocale } from "@/components/locale/locale-provider";
import { t } from "@/lib/i18n/locale-store";
import type { ReviewResult } from "@/lib/api/types";

export function RecallPolicyMessage({
  reason,
  scorePolicyVersion,
}: {
  scorePolicyVersion?: string;
  reason: NonNullable<ReviewResult["recallPolicy"]>["reason"] | undefined;
}) {
  useLocale();
  const messages = {
    SCORE_BELOW_80: scorePolicyVersion === "sentence-quality-v1" ? "本次造句质量低于 80 分，最高按“有些模糊”安排。" : "本次练习得分低于 80 分，最高按“有些模糊”安排。",
    TARGET_GRAMMAR_UNVERIFIED: "尚未确认目标语法的正确使用，本次不计为目标掌握证据，最高按“有些模糊”安排。",
    TARGET_GRAMMAR_MISSING: "句子没有使用目标语法，本次排期会按“忘记了”处理。",
    TARGET_GRAMMAR_INCORRECT: "目标语法使用不正确，本次排期会按“忘记了”处理。",
  } as const;
  if (!reason || reason === "NONE") return null;
  return (
    <p className="mt-3 rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
      {t(messages[reason])}
    </p>
  );
}

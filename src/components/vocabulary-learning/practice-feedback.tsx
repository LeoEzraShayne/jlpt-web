"use client";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FuriganaText } from "@/components/shared/furigana-text";
import { outcomeLabels, reviewDate, type VocabularyPractice } from "./types";

const evidence = (value: boolean | null) => value === null ? t("未验证") : value ? t("正确") : t("需修改");
export function PracticeFeedback({ practice }: { practice: VocabularyPractice }) {
  useLocale();
  const result = practice.result;
  return <Card className="min-w-0 warm-shadow">
    <CardHeader><CardTitle>{t("词汇反馈 ·")} {t(result ? outcomeLabels[result.outcome] : "暂无有效评估")}</CardTitle></CardHeader>
    <CardContent className="min-w-0 space-y-4 break-words">
      <div><h3 className="text-sm font-semibold">{t("你的句子")}</h3><p lang="ja" className="mt-2 whitespace-pre-wrap leading-8">{t(practice.answer || "未记录")}</p></div>
      {result ? <>
        <p className="text-sm leading-7">{result.explanationZh}</p>
        <dl className="grid grid-cols-2 gap-3 rounded-xl bg-muted p-3 text-sm">
          <div><dt className="text-muted-foreground">{t("目标词")}</dt><dd>{t(result.usedTarget ? "已使用" : "未使用")}</dd></div>
          <div><dt className="text-muted-foreground">{t("目标词用法")}</dt><dd>{evidence(result.targetCorrect)}</dd></div>
          <div><dt className="text-muted-foreground">{t("当前词义")}</dt><dd>{evidence(result.meaningCorrect)}</dd></div>
          <div><dt className="text-muted-foreground">{t("读音")}</dt><dd>{evidence(result.readingCorrect)}</dd></div>
        </dl>
        {result.outcome === "UNVERIFIED" && <p className="text-sm">{t(result.usedTarget ? "本次暂未验证目标词的使用。" : "这句话没有提供目标词的使用证据，不代表句子错误。")} {t("本次不延长复习间隔。")}</p>}
        {(practice.unknownAtStart || practice.hintLevel > 0) && <p className="text-xs text-muted-foreground">{t("本次已看过")}{t(practice.unknownAtStart ? "初学预览" : "提示")}{practice.hintLevel >= 4 ? t("与词块") : ""}{t("，不计为独立回忆。")}</p>}
        {!!result.corrections.length && <div><h3 className="text-sm font-semibold">{t("需要调整的地方")}</h3><ul className="mt-2 space-y-3 text-sm">{result.corrections.map((item, index) => <li key={index} className="rounded-lg border p-3"><p lang="ja">{item.text} → {item.replacement}</p><p className="mt-1 text-muted-foreground">{item.reason}</p></li>)}</ul></div>}
        {result.correctedSentence && <div><h3 className="text-sm font-semibold">{t("修改后的句子")}</h3><p lang="ja" className="mt-2 leading-9"><FuriganaText annotated={result.correctedFurigana} fallback={result.correctedSentence} /></p><p className="text-sm text-muted-foreground">{result.correctedTranslationZh}</p></div>}
      </> : <p className="text-sm">{t("本次暂未验证词汇用法。")}</p>}
      {practice.reference && <div className="border-t pt-3"><h3 className="text-sm font-semibold">{t("参考例句")}</h3><p lang="ja" className="mt-2 leading-9"><FuriganaText annotated={practice.reference.furigana} fallback={practice.reference.sentence} /></p><p className="text-sm text-muted-foreground">{practice.reference.translationZh}</p></div>}
      <p className="text-sm font-medium">{result?.outcome === "UNVERIFIED" ? t("保留原复习安排，明天可再次验证；今天也可以从清单主动练习。") : <>{t("下次复习：")}{reviewDate(practice.nextReviewAt)}</>}</p>
      <p className="text-xs text-muted-foreground">{t("只记录这个词义的练习；你的记忆标签与关联语法的正式复习记录保持不变。")}</p>
    </CardContent>
  </Card>;
}

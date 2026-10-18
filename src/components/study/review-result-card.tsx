"use client";
import { feedbackSnapshot } from "@/lib/i18n/content";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import {
  CheckCircle2,
  CircleHelp,
  TriangleAlert,
  MessageCircleMore,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FuriganaText } from "@/components/shared/furigana-text";
import type { ReviewResult } from "@/lib/api/types";

export function ReviewResultCard({
  result: rawResult,
  showCorrection = true,
}: {
  result: ReviewResult;
  showCorrection?: boolean;
}) {
  useLocale();
  const result = feedbackSnapshot(rawResult);
  const qualityScoring = result.scorePolicyVersion === "sentence-quality-v1";
  const targetComplete = result.usedTargetGrammar === true && result.targetGrammarCorrect === true;
  const targetFailed = result.usedTargetGrammar === false || result.targetGrammarCorrect === false;
  const TargetIcon = targetComplete ? CheckCircle2 : targetFailed ? TriangleAlert : CircleHelp;
  const targetTitle = targetComplete ? "本次目标已完成" : targetFailed ? "本次目标未完成" : "本次目标尚未确认";
  const scores = [
    [t(qualityScoring ? "语法正确性" : "语法使用"), result.grammarScore, 30],
    [t("接续正确"), result.connectionScore, 20],
    [t("句子完整"), result.completenessScore, 20],
    [t("自然度"), result.naturalnessScore, 20],
    [t("词汇表达"), result.vocabularyScore, 10],
  ] as const;
  return (
    <div className="min-w-0 space-y-5">
      <Card className="min-w-0 warm-shadow">
        <CardContent className="grid min-w-0 gap-6 pt-2 md:grid-cols-[160px_1fr]">
          <div className="grid place-items-center rounded-2xl bg-secondary p-5 text-center">
            <span className="text-5xl font-bold">{result.totalScore}</span>
            <span className="mt-1 text-xs text-muted-foreground">
              {t(qualityScoring ? "句子质量 / 100" : "本次练习得分 / 100")}</span>
          </div>
          <div className="min-w-0">
            <h2 className="flex items-start gap-2 text-xl font-bold">
              {qualityScoring ? (
                <TargetIcon className={`mt-0.5 size-5 shrink-0 ${targetComplete ? "text-success" : "text-muted-foreground"}`} />
              ) : <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />}
              {qualityScoring ? t(targetTitle) : result.encouragement}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(targetGrammarMessage(result))}{t("。分数用于检查语法和表达，不代表真实记忆率。")}</p>
            {qualityScoring && !targetComplete && <p className="mt-2 text-sm font-medium">{t("句子质量分与目标完成情况分开，本次不计为目标掌握证据。")}</p>}
            {qualityScoring && <p className="mt-2 text-sm text-muted-foreground">{result.encouragement}</p>}
            <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
              {scores.map(([label, value, max]) => (
                <div className="min-w-0" key={label}>
                  <div className="flex justify-between text-xs">
                    <span>{t(label)}</span>
                    <span>
                      {value}/{max}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${(value / max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      {result.contentResponse && <Feedback icon={MessageCircleMore} title={t("内容回应")} text={result.contentResponse} />}
      {result.errorSpans.length > 0 && (
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle role="heading" aria-level={2}>{t("需要调整的地方")}</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 space-y-3">
            {result.errorSpans.map((span, index) => (
              <div
                key={`${span.start}-${index}`}
                className="min-w-0 rounded-xl bg-destructive/5 p-4 text-sm"
              >
                <p>
                  <span className="font-medium text-destructive line-through">
                    {span.text}
                  </span>
                  <span className="mx-2">→</span>
                  <span className="font-medium text-success">
                    {span.replacement}
                  </span>
                </p>
                <p className="mt-2 text-muted-foreground">{span.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <Feedback
        icon={MessageCircleMore}
        title={t("中文说明")}
        text={result.explanationZh}
      />
      {showCorrection && (
        <Feedback
          icon={WandSparkles}
          title={t("原句纠错")}
          text={result.correctedSentence}
          annotated={result.correctedSentenceFurigana}
          translation={result.correctedSentenceTranslationZh}
          japanese
        />
      )}
      {result.alternativeSentence && (
        <Feedback
          icon={Sparkles}
          title={t(qualityScoring ? "目标练习示例" : "拓展示例")}
          text={result.alternativeSentence}
          annotated={result.alternativeSentenceFurigana}
          translation={result.alternativeSentenceTranslationZh}
          japanese
        />
      )}
    </div>
  );
}

function targetGrammarMessage(result: ReviewResult) {
  if (result.usedTargetGrammar === false) return t("目标语法未使用");
  if (result.targetGrammarCorrect === false) return t("目标语法使用不正确");
  if (result.usedTargetGrammar === true && result.targetGrammarCorrect === true) return t("目标语法使用正确");
  if (result.scorePolicyVersion === "sentence-quality-v1") return t("目标语法的使用尚未确认");
  return t("目标语法表现已纳入反馈");
}

function Feedback({
  icon: Icon,
  title,
  text,
  annotated,
  translation,
  japanese = false,
}: {
  icon: typeof Sparkles;
  title: string;
  text: string;
  annotated?: string | null;
  translation?: string | null;
  japanese?: boolean;
}) {
  useLocale();
  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2} className="flex items-center gap-2">
          <Icon className="size-5 text-primary" />
          {t(title)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={
            japanese
              ? "text-base leading-8"
              : "text-sm leading-7 text-muted-foreground"
          }
        >
          {annotated ? (
            <FuriganaText annotated={annotated} fallback={text} />
          ) : (
            text
          )}
        </p>
        {translation && (
          <p className="mt-3 border-t pt-3 text-sm leading-7 text-muted-foreground">
            {t("中文：")}{translation}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

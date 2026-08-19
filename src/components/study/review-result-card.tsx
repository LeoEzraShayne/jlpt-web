import {
  CheckCircle2,
  MessageCircleMore,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FuriganaText } from "@/components/shared/furigana-text";
import type { ReviewResult } from "@/lib/api/types";

export function ReviewResultCard({ result }: { result: ReviewResult }) {
  const scores = [
    ["语法使用", result.grammarScore, 30],
    ["接续正确", result.connectionScore, 20],
    ["句子完整", result.completenessScore, 20],
    ["自然度", result.naturalnessScore, 20],
    ["词汇表达", result.vocabularyScore, 10],
  ] as const;
  return (
    <div className="min-w-0 space-y-5">
      <Card className="min-w-0 warm-shadow">
        <CardContent className="grid min-w-0 gap-6 pt-2 md:grid-cols-[160px_1fr]">
          <div className="grid place-items-center rounded-2xl bg-secondary p-5 text-center">
            <span className="text-5xl font-bold">{result.totalScore}</span>
            <span className="mt-1 text-xs text-muted-foreground">
              本次造句质量 / 100
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="flex items-start gap-2 text-xl font-bold">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
              {result.encouragement}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {targetGrammarMessage(result)}。分数用于检查语法和表达，不代表真实记忆率。
            </p>
            <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
              {scores.map(([label, value, max]) => (
                <div className="min-w-0" key={label}>
                  <div className="flex justify-between text-xs">
                    <span>{label}</span>
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
      {result.errorSpans.length > 0 && (
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>需要调整的地方</CardTitle>
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
        title="中文说明"
        text={result.explanationZh}
      />
      <Feedback
        icon={WandSparkles}
        title="修改建议"
        text={result.correctedSentence}
        translation={result.correctedSentenceTranslationZh}
        japanese
      />
      {result.alternativeSentence && (
        <Feedback
          icon={Sparkles}
          title="另一种自然表达"
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
  if (result.usedTargetGrammar === false) return "目标语法未使用";
  if (result.targetGrammarCorrect === false) return "目标语法使用不正确";
  if (result.targetGrammarCorrect === true) return "目标语法使用正确";
  return "目标语法表现已纳入反馈";
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-5 text-primary" />
          {title}
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
            中文：{translation}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

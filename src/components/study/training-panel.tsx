"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { FuriganaText } from "@/components/shared/furigana-text";
import { apiRequest } from "@/lib/api/client";
import type { StudySession, TrainingContext } from "@/lib/api/types";

const modes = {
  UNDERSTAND: "理解表达",
  SUBSTITUTE: "替换内容",
  COMBINE: "组合表达",
  TRANSFER: "跨场景运用",
};
const registers: Record<string, string> = {
  CASUAL: "日常口语",
  POLITE: "礼貌表达",
  FORMAL_WRITTEN: "正式书面表达",
};
const domains: Record<string, string> = {
  LIFE: "生活",
  DAILY: "生活",
  WORK: "工作",
  TRAVEL: "旅行",
  FORMAL: "正式书面",
};
export function TrainingPanel({
  session,
  hintVisible,
  reveal,
}: {
  session: StudySession;
  hintVisible: boolean;
  reveal: () => Promise<void>;
}) {
  const context = session.trainingContext;
  if (!context) return null;
  // Existing sessions can contain separate senses of the same lexical form.
  const words = (context.words ?? []).filter((word, index, all) =>
    all.findIndex((other) => other.word === word.word && other.reading === word.reading) === index,
  );
  const wordGridColumns = words.length === 1
    ? "grid-cols-1"
    : words.length === 2 || words.length === 4
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  const referencesHidden =
    session.mode === "REVIEW" && (!hintVisible || context.referenceHidden);
  const hasReferences = Boolean(
    context.expressions?.length || context.phrases?.length,
  );
  return (
    <Card className="mt-6 min-w-0">
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          {session.trainingMode ? modes[session.trainingMode] : "场景表达"}
        </CardTitle>
        <CardDescription>{context.instructionZh}</CardDescription>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-4">
        {context.scenario && (
          <div>
            <p className="text-xs text-muted-foreground">
              {domains[context.scenario.domain] ?? context.scenario.domain} ·{" "}
              {registers[context.scenario.register] ??
                context.scenario.register}
            </p>
            <p className="mt-2 leading-7">{context.scenario.promptZh}</p>
          </div>
        )}
        {context.supportingGrammar && (
          <p className="text-sm">
            可顺带复习：
            <Link
              className="text-primary underline"
              href={`/grammar/${encodeURIComponent(context.supportingGrammar.id)}`}
            >
              {context.supportingGrammar.title}（
              {context.supportingGrammar.level}）
            </Link>
            <span className="mt-1 block text-xs text-muted-foreground">
              自然时再组合，本轮只评估目标语法的掌握证据。
            </span>
          </p>
        )}
        {!!words.length && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">可选重点词</h3>
            <div className={`grid gap-2 ${wordGridColumns}`}>
              {words.map((word) => (
                <TrainingWord key={word.id} word={word} />
              ))}
            </div>
          </div>
        )}
        {hasReferences &&
          (referencesHidden ? (
            <div className="rounded-xl border border-dashed p-4">
              <p className="text-sm text-muted-foreground">
                个人参考表达已隐藏。打开后记为使用提示，本轮不计入独立掌握证据。
              </p>
              <Button
                className="mt-3"
                size="sm"
                variant="outline"
                onClick={() => void reveal()}
              >
                查看参考表达（使用提示）
              </Button>
            </div>
          ) : (
            <details>
              <summary className="cursor-pointer text-sm font-medium">
                参考表达与短句素材
              </summary>
              <div className="mt-3 flex flex-col gap-3">
                {context.expressions?.map((expression) =>
                  expression.sentence ? (
                    <div
                      key={expression.id}
                      className="rounded-lg bg-muted p-3"
                    >
                      <p lang="ja" className="leading-8">
                        <FuriganaText
                          annotated={expression.furigana}
                          fallback={expression.sentence}
                        />
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {expression.translationZh}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        来源：个人常用表达
                      </p>
                    </div>
                  ) : null,
                )}
                {context.phrases?.map((phrase) =>
                  phrase.word ? (
                    <div key={phrase.id} className="rounded-lg bg-muted p-3">
                      <p lang="ja">
                        {phrase.word} {phrase.reading}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        来源：已校验私人资料
                      </p>
                    </div>
                  ) : null,
                )}
              </div>
            </details>
          ))}
      </CardContent>
    </Card>
  );
}
function TrainingWord({
  word,
}: {
  word: NonNullable<TrainingContext["words"]>[number];
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function bookmark() {
    setBusy(true);
    try {
      await apiRequest(`/vocabulary/${encodeURIComponent(word.id)}/bookmark`, {
        method: "PUT",
        body: "{}",
      });
      setMessage("已收藏");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "收藏失败");
    } finally {
      setBusy(false);
    }
  }
  const glosses = Array.isArray(word.glosses) ? word.glosses : [];
  return (
    <div className="min-w-0 rounded-lg border p-3 text-sm wrap-anywhere">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>
          {word.word}（{word.reading}）
          {word.chineseGloss ? ` · ${word.chineseGloss}` : ""}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void bookmark()}
        >
          收藏生词
        </Button>
      </div>
      {!word.chineseGloss && glosses.length > 0 && (
        <p className="mt-2 text-muted-foreground">
          {glosses
            .filter((g) => typeof g === "object" && g && "text" in g)
            .map((g) => String((g as { text: unknown }).text))
            .join("；")}
        </p>
      )}
      {message && (
        <p role="status" className="mt-1 text-xs">
          {message}
        </p>
      )}
    </div>
  );
}

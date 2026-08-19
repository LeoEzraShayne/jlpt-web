"use client";

import { ArrowLeft, BookOpenText, GitCompareArrows } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StartStudyButton } from "@/components/study/start-study-button";
import { useGrammarDetail } from "@/hooks/use-api";
import { GrammarStatus } from "./grammar-status";
import { formatStudyDate } from "@/lib/study-display";

export function GrammarDetail({ id }: { id: string }) {
  const swr = useGrammarDetail(id);
  if (swr.isLoading) return <LoadingState />;
  if (swr.error || !swr.data)
    return (
      <ErrorState
        message={swr.error?.message}
        onRetry={() => void swr.mutate()}
      />
    );
  const item = swr.data;
  const progress = item.progress?.[0];
  const relationGroups = [
    ...new Map(
      (item.relationMembers ?? []).map((entry) => [
        entry.group.id,
        entry.group,
      ]),
    ).values(),
  ];
  return (
    <div className="min-w-0 max-w-full">
      <Button asChild variant="ghost" className="mb-5">
        <Link href="/grammar">
          <ArrowLeft />
          返回语法库
        </Link>
      </Button>
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            {item.level}
          </span>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{item.title}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {item.chineseExplanation}
          </p>
        </div>
        <div className="w-full min-w-0 rounded-xl border bg-card p-4 sm:w-auto sm:min-w-52">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">当前状态</span>
            <GrammarStatus progress={progress} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {progress?.learningState?.nextReviewOn
              ? `预计 ${formatStudyDate(progress.learningState.nextReviewOn)} 复习`
              : "完成练习后自动安排复习"}
          </p>
        </div>
      </div>
      <div className="mt-7 grid min-w-0 gap-5 lg:grid-cols-[1.4fr_.8fr]">
        <div className="min-w-0 space-y-5">
          <Info
            title="接续方式"
            text={item.connectionRule || "资料暂未标注接续方式"}
          />
          <Card className="min-w-0 warm-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpenText className="size-5 text-primary" />
                例句
              </CardTitle>
            </CardHeader>
            <CardContent className="min-w-0 space-y-4">
              {item.examples.map((example) => (
                <div
                  key={example.id}
                  className="min-w-0 rounded-xl bg-muted p-4"
                >
                  <p className="text-base leading-7">{example.sentence}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {example.translation}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
          {relationGroups.length > 0 && (
            <Card className="min-w-0 warm-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitCompareArrows className="size-5 text-primary" />
                  容易混淆
                </CardTitle>
              </CardHeader>
              <CardContent>
                {relationGroups.map((group) => (
                  <div className="min-w-0" key={group.id}>
                    <p className="font-medium">
                      {group.members
                        .map((member) => member.grammar.title)
                        .join(" / ")}
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                      {group.notes}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
        <div className="min-w-0">
          <Card className="sticky top-24 min-w-0 warm-shadow">
            <CardHeader>
              <CardTitle>用造句掌握它</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                先主动回忆，再写出自己的句子，AI 会检查接续与表达自然度。
              </p>
              <StartStudyButton
                className="mt-5"
                grammarId={item.id}
                mode={progress ? "PRACTICE" : "LEARN"}
                label={progress ? "再次练习" : "开始学习"}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
function Info({ title, text }: { title: string; text: string }) {
  return (
    <Card className="warm-shadow">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="leading-7">{text}</p>
      </CardContent>
    </Card>
  );
}

"use client";
import { useState } from "react";
import { usePaged } from "@/hooks/use-paged";
import { LoadStatus } from "./load-status";
import { apiRequest } from "@/lib/api/client";
import type {
  JlptLevel,
  PersonalExpression,
  VocabularyEntry,
} from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { FuriganaText } from "@/components/shared/furigana-text";
import { StartStudyButton } from "@/components/study/start-study-button";
import { LibraryCardGrid } from "@/components/shared/library-card";
import { WordCard, type Bookmark } from "./word-card";
import { VocabularyLearningList } from "@/components/vocabulary-learning/learning-list";
import { ImportManager } from "./import-manager";

export function Library() {
  const [tab, setTab] = useState("vocabulary");
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">词汇与表达库</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          词汇分级仅供参考。个人收藏与资料仅自己可见，融入语法练习。
        </p>
      </div>
      <label className="text-sm">
        内容
        <select
          aria-label="内容类型"
          className="ml-3 rounded-lg border bg-background p-2"
          value={tab}
          onChange={(e) => setTab(e.target.value)}
        >
          <option value="vocabulary">词汇查询</option>
          <option value="learning">词汇学习清单</option>
          <option value="bookmarks">生词收藏</option>
          <option value="expressions">常用表达</option>
          <option value="imports">私人资料导入</option>
        </select>
      </label>
      {tab === "learning" ? (
        <VocabularyLearningList />
      ) : tab === "imports" ? (
        <ImportManager />
      ) : tab === "expressions" ? (
        <Expressions />
      ) : (
        <Vocabulary key={tab} bookmarks={tab === "bookmarks"} />
      )}
    </div>
  );
}

function Vocabulary({ bookmarks }: { bookmarks: boolean }) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<JlptLevel | "">("");
  const swr = usePaged<VocabularyEntry | Bookmark>(
    bookmarks
      ? "/vocabulary/bookmarks"
      : `/vocabulary?query=${encodeURIComponent(search)}${level ? `&level=${level}` : ""}`,
  );
  return (
    <div className="flex flex-col gap-4">
      {!bookmarks && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(query);
          }}
          className="flex flex-wrap gap-2"
        >
          <input
            aria-label="搜索词汇"
            className="min-w-0 basis-full flex-1 rounded-lg border bg-background p-2 sm:basis-auto"
            placeholder="词形、读音或中文释义"
            maxLength={100}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            aria-label="词汇参考级别"
            className="rounded-lg border bg-background p-2"
            value={level}
            onChange={(e) => setLevel(e.target.value as JlptLevel | "")}
          >
            <option value="">全部级别</option>
            {["N1", "N2", "N3", "N4"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <Button type="submit">搜索</Button>
        </form>
      )}
      <LoadStatus
        loading={swr.isLoading}
        error={swr.error}
        retry={() => void swr.mutate()}
      />
      {!swr.isLoading && !swr.error && !swr.items.length && (
        <EmptyState
          title={bookmarks ? "还没有收藏生词" : "没有匹配的词汇"}
          description="可尝试其他词形或读音。"
        />
      )}
      <LibraryCardGrid aria-label="词汇卡片列表">
        {swr.items.map((item) => (
          <WordCard
            key={item.id}
            word={"vocabulary" in item ? item.vocabulary : item}
            bookmark={"vocabulary" in item ? item : undefined}
            refresh={() => swr.mutate()}
          />
        ))}
      </LibraryCardGrid>
      {swr.more && (
        <Button
          variant="outline"
          disabled={swr.isValidating}
          onClick={() => void swr.setSize(swr.size + 1)}
        >
          加载更多
        </Button>
      )}
    </div>
  );
}
function Expressions() {
  const swr = usePaged<PersonalExpression>("/expressions");
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        从批改结果收藏正确原句、修正版或拓展示例。正式复习时参考原句默认隐藏，打开计为提示。
      </p>
      <LoadStatus
        loading={swr.isLoading}
        error={swr.error}
        retry={() => void swr.mutate()}
      />
      {!swr.isLoading && !swr.error && !swr.items.length && (
        <EmptyState
          title="还没有常用表达"
          description="完成一次造句批改后，收藏想熟练使用的表达。"
        />
      )}
      {swr.items.map((item) => (
        <ExpressionCard
          key={item.id}
          expression={item}
          refresh={() => swr.mutate()}
        />
      ))}
      {swr.more && (
        <Button
          variant="outline"
          disabled={swr.isValidating}
          onClick={() => void swr.setSize(swr.size + 1)}
        >
          加载更多
        </Button>
      )}
    </div>
  );
}
function ExpressionCard({
  expression,
  refresh,
}: {
  expression: PersonalExpression;
  refresh: () => Promise<unknown>;
}) {
  const [note, setNote] = useState(expression.note);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(remove = false) {
    setBusy(true);
    try {
      await apiRequest(`/expressions/${encodeURIComponent(expression.id)}`, {
        method: remove ? "DELETE" : "PATCH",
        ...(!remove ? { body: JSON.stringify({ note }) } : {}),
      });
      await refresh();
      setMessage("已保存");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="leading-9">
          <FuriganaText
            annotated={expression.furigana}
            fallback={expression.sentence}
          />
        </CardTitle>
        <CardDescription>{expression.translationZh}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          来源：
          {
            {
              ORIGINAL: "正确原句",
              CORRECTION: "修正版",
              ALTERNATIVE: "拓展示例",
            }[expression.variant]
          }{" "}
          · 场景：{expression.scene ?? "未记录"}
        </p>
        <label className="text-sm">
          个人备注
          <input
            aria-label="表达备注"
            maxLength={2000}
            className="mt-1 w-full rounded-lg border bg-background p-2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={busy} onClick={() => void save()}>
            保存备注
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void save(true)}
          >
            移除表达
          </Button>
          <StartStudyButton
            grammarId={expression.grammarId}
            mode="PRACTICE"
            label="练习关联语法"
          />
        </div>
        {message && <p role="status">{message}</p>}
      </CardContent>
    </Card>
  );
}

"use client";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import { useDeferredValue, useState } from "react";
import { Search } from "lucide-react";
import { PageHeading } from "@/components/shared/page-heading";
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
import type { LearningList } from "@/components/vocabulary-learning/types";
import { ImportManager } from "./import-manager";

type VocabularyView = LearningList | "bookmarks" | null;
const filters = [
  ["UNKNOWN", "根本不会"],
  ["PRACTICE", "想熟练"],
  ["REMEMBERED", "已记住"],
  ["DUE", "词汇学习清单"],
  ["bookmarks", "生词收藏"],
] as const;

export function Library() {
  useLocale();
  const [level, setLevel] = useState<JlptLevel>("N1");
  const [query, setQuery] = useState("");
  const search = useDeferredValue(query.trim());
  const [view, setView] = useState<VocabularyView>(null);
  const [panel, setPanel] = useState<"expressions" | "imports" | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <div className="min-w-0 max-w-full">
      <PageHeading title={t(panel === "expressions" ? "我的表达" : panel === "imports" ? "私人资料导入" : "词汇与表达库")}
        description={t("词汇分级仅供参考。个人收藏与资料仅自己可见，融入语法练习。")} />
      {panel ? (
        <>
          <Button className="mb-5" variant="outline" onClick={() => setPanel(null)}>{t("返回词汇库")}</Button>
          {panel === "expressions" ? <Expressions /> : <ImportManager />}
        </>
      ) : (
        <>
          <div role="group" className="mb-5 grid min-w-0 grid-cols-4 gap-2" aria-label={t("词汇参考级别")}>
            {(["N1", "N2", "N3", "N4"] as const).map(value => (
              <Button key={value} variant={level === value ? "default" : "outline"}
                aria-pressed={level === value} onClick={() => setLevel(value)} className="h-auto min-h-8 px-2 py-1">{value}</Button>
            ))}
          </div>
          <label className="mb-4 flex h-11 min-w-0 items-center gap-2 rounded-xl border bg-card px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input aria-label={t("搜索词汇")} className="min-w-0 w-full bg-transparent text-sm outline-none"
              placeholder={t("词形、读音或中文释义")} maxLength={100} value={query}
              onChange={event => setQuery(event.target.value)} />
          </label>
          <nav className="mb-6 flex max-w-full flex-wrap gap-2" aria-label={t("词汇筛选")}>
            {filters.map(([value, label]) => (
              <Button key={value} size="sm" variant={view === value ? "default" : "outline"}
                aria-pressed={view === value} onClick={() => { setView(view === value ? null : value); setMoreOpen(false); }}>{t(label)}</Button>
            ))}
            <Button size="sm" variant="outline" aria-expanded={moreOpen} aria-controls="library-more"
              aria-pressed={moreOpen} onClick={() => setMoreOpen(!moreOpen)}>{t("更多")}</Button>
          </nav>
          {moreOpen && (
            <div id="library-more" role="group" aria-label={t("更多")} className="mb-6 flex flex-wrap gap-2">
              {([["expressions", "我的表达"], ["imports", "私人资料导入"]] as const).map(([value, label]) => (
                <Button key={value} variant="outline" onClick={() => { setPanel(value); setMoreOpen(false); }}>{t(label)}</Button>
              ))}
            </div>
          )}
          <Vocabulary view={view} level={level} search={search} />
        </>
      )}
    </div>
  );
}

function Vocabulary({ view, level, search }: { view: VocabularyView; level: JlptLevel; search: string }) {
  useLocale();
  const bookmarks = view === "bookmarks";
  const learning = view !== null && !bookmarks;
  const params = new URLSearchParams({ level, query: search });
  if (learning) params.set("list", view);
  const endpoint = bookmarks ? "/vocabulary/bookmarks" : learning ? "/vocabulary-learning" : "/vocabulary";
  const swr = usePaged<VocabularyEntry | Bookmark>(`${endpoint}?${params.toString()}`, true);
  return (
    <div className="flex flex-col gap-4">
      {view === "DUE" && <h2 className="font-semibold">{t("今日待复习")}</h2>}
      {learning && <p className="text-sm text-muted-foreground">{t("只收录你手动标记的释义。收藏不会自动加入学习清单；暂停的词汇不进入今日复习。")}</p>}
      <LoadStatus loading={swr.isLoading} error={swr.error} retry={() => void swr.mutate()} />
      {!swr.isLoading && !swr.error && !swr.items.length && (
        <EmptyState title={bookmarks ? t("还没有收藏生词") : learning ? t("这个清单暂时没有词汇") : t("没有匹配的词汇")}
          description={t("可尝试其他词形或读音。")} />
      )}
      <LibraryCardGrid className="grid-cols-1 gap-3 min-[37.5rem]:grid-cols-2 lg:gap-4" aria-label={t(learning ? "学习词汇卡片列表" : "词汇卡片列表")}>
        {swr.items.map(item => (
          <WordCard key={item.id} word={"vocabulary" in item ? item.vocabulary : item}
            bookmark={"vocabulary" in item ? item : undefined} refresh={() => swr.mutate()} />
        ))}
      </LibraryCardGrid>
      {swr.more && <Button variant="outline" disabled={swr.isValidating} onClick={() => void swr.setSize(swr.size + 1)}>{t("加载更多")}</Button>}
    </div>
  );
}
function Expressions() {
  useLocale();
  const swr = usePaged<PersonalExpression>("/expressions");
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {t("从批改结果收藏正确原句、修正版或拓展示例。正式复习时参考原句默认隐藏，打开计为提示。")}</p>
      <LoadStatus
        loading={swr.isLoading}
        error={swr.error}
        retry={() => void swr.mutate()}
      />
      {!swr.isLoading && !swr.error && !swr.items.length && (
        <EmptyState
          title={t("还没有收藏的表达")}
          description={t("完成一次造句批改后，收藏想熟练使用的表达。")}
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
          {t("加载更多")}</Button>
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
  useLocale();
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
      setMessage(t("已保存"));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t("保存失败"));
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
          {t("来源：")}{t({
              ORIGINAL: "正确原句",
              CORRECTION: "修正版",
              ALTERNATIVE: "拓展示例",
            }[expression.variant])}{" "}
          {t("· 场景：")}{t(expression.scene ?? "未记录")}
        </p>
        <label className="text-sm">
          {t("个人备注")}<input
            aria-label={t("表达备注")}
            maxLength={2000}
            className="mt-1 w-full rounded-lg border bg-background p-2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={busy} onClick={() => void save()}>
            {t("保存备注")}</Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void save(true)}
          >
            {t("移除表达")}</Button>
          <StartStudyButton
            grammarId={expression.grammarId}
            mode="PRACTICE"
            label={t("练习关联语法")}
          />
        </div>
        {message && <p role="status">{t(message)}</p>}
      </CardContent>
    </Card>
  );
}

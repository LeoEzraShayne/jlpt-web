"use client";
import { useState } from "react";
import useSWR from "swr";
import { apiFetcher, apiRequest } from "@/lib/api/client";
import type { ContentCandidate, ContentImport } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { LoadStatus } from "./load-status";
import { usePaged } from "@/hooks/use-paged";
const statusLabel: Record<string, string> = {
  PENDING: "待核对", VALIDATED: "已核对", REJECTED: "有误",
  COMMITTED: "已提交", PREVIEW: "待核对", PREVIEWED: "已预览",
};
const example = JSON.stringify(
  {
    fileName: "私人词表.json",
    sourceName: "我的资料",
    sourceVersion: "2026-09",
    rows: [
      {
        kind: "VOCABULARY",
        word: "予定",
        reading: "よてい",
        gloss: "计划；预定",
        level: "N4",
        levelSource: "个人资料参考分级",
        location: "第1页",
      },
    ],
  },
  null,
  2,
);
export function ImportManager() {
  const imports = usePaged<ContentImport>("/content-imports");
  const [json, setJson] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function preview() {
    setBusy(true);
    setMessage("");
    try {
      const body: unknown = JSON.parse(json);
      const response = await apiRequest<
        ContentImport & { inserted: number; duplicates: number }
      >("/content-imports/preview", {
        method: "POST",
        body: JSON.stringify(body),
      });
      await imports.mutate();
      setSelected(response.data.id);
      setMessage(
        `已进入私人候选区：新增 ${response.data.inserted}，重复 ${response.data.duplicates}。`,
      );
    } catch (error) {
      setMessage(
        error instanceof SyntaxError
          ? "JSON 格式有误，请检查后重试。"
          : error instanceof Error
            ? error.message
            : "预览失败",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>私人资料候选导入</CardTitle>
          <CardDescription>
            先预览与去重，逐条核对来源后再提交。支持已清洗的 JSON，每批最多 1000
            条；扫描件 OCR 后续支持。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <label className="text-sm">
            导入 JSON 文件
            <input
              aria-label="导入 JSON 文件"
              type="file"
              accept="application/json,.json"
              className="mt-2 block max-w-full"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (file.size > 2_000_000) {
                  setMessage("文件过大，请拆分到 2 MB 以内。");
                  return;
                }
                try {
                  setJson(await file.text());
                } catch {
                  setMessage("读取文件失败");
                }
              }}
            />
          </label>
          <Textarea
            aria-label="资料 JSON"
            rows={8}
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder={example}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy || !json.trim()}
              onClick={() => void preview()}
            >
              预览并校验格式
            </Button>
            <Button variant="outline" onClick={() => setJson(example)}>
              填入格式示例
            </Button>
          </div>
          {message && (
            <p role="status" className="text-sm">
              {message}
            </p>
          )}
        </CardContent>
      </Card>
      <LoadStatus
        loading={imports.isLoading}
        error={imports.error}
        retry={() => void imports.mutate()}
      />
      <div className="flex flex-wrap gap-2">
        {imports.items.map((item) => (
          <Button
            key={item.id}
            variant={selected === item.id ? "secondary" : "outline"}
            className="h-auto whitespace-normal break-words text-left"
            onClick={() => setSelected(item.id)}
          >
            {item.fileName} · {statusLabel[item.status] ?? "处理中"}
          </Button>
        ))}
      </div>
      {imports.more && (
        <Button
          variant="outline"
          disabled={imports.isValidating}
          onClick={() => void imports.setSize(imports.size + 1)}
        >
          更多导入记录
        </Button>
      )}
      {selected && (
        <ImportDetail
          key={selected}
          id={selected}
          refresh={() => imports.mutate()}
        />
      )}
    </div>
  );
}
function ImportDetail({
  id,
  refresh,
}: {
  id: string;
  refresh: () => Promise<unknown>;
}) {
  const [cursor, setCursor] = useState<string | null>(null);
  const batch = useSWR<
    ContentImport & {
      candidates: ContentCandidate[];
      nextCursor: string | null;
    }
  >(
    `/content-imports/${encodeURIComponent(id)}?limit=30${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
    apiFetcher,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function commit() {
    setBusy(true);
    try {
      await apiRequest(`/content-imports/${encodeURIComponent(id)}/commit`, {
        method: "POST",
      });
      await Promise.all([batch.mutate(), refresh()]);
      setMessage("已提交通过校验的内容，未通过的条目继续保留为候选。");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "提交失败");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="flex flex-col gap-4" aria-label="候选内容校验">
      <LoadStatus
        loading={batch.isLoading}
        error={batch.error}
        retry={() => void batch.mutate()}
      />
      {batch.data && (
        <>
          <h2 className="text-xl font-bold break-words">
            {batch.data.fileName}
          </h2>
          <p className="text-xs text-muted-foreground">
            来源：{batch.data.sourceName} · {batch.data.sourceVersion} ·
            仅自己可见
          </p>
          {batch.data.candidates.map((item) => (
            <Candidate
              key={item.id}
              item={item}
              refresh={() => batch.mutate()}
            />
          ))}
          {!batch.data.candidates.length && (
            <p>此批次没有新增候选，重复条目保留在原导入批次中。</p>
          )}
          <div className="flex flex-wrap gap-2">
            {cursor && (
              <Button variant="outline" onClick={() => setCursor(null)}>
                回到首批
              </Button>
            )}
            {batch.data.nextCursor && (
              <Button
                variant="outline"
                onClick={() => setCursor(batch.data!.nextCursor)}
              >
                下一批候选
              </Button>
            )}
            <Button disabled={busy} onClick={() => void commit()}>
              提交已校验内容
            </Button>
          </div>
        </>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </section>
  );
}
function Candidate({
  item,
  refresh,
}: {
  item: ContentCandidate;
  refresh: () => Promise<unknown>;
}) {
  const [checked, setChecked] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function validate(status: "VALIDATED" | "REJECTED" | "PENDING") {
    setBusy(true);
    try {
      await apiRequest(
        `/content-candidates/${encodeURIComponent(item.id)}/validation`,
        {
          method: "PATCH",
          body: JSON.stringify({ status, note, checkedAgainstSource: checked }),
        },
      );
      await refresh();
      setMessage("校验状态已更新");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "校验失败");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {item.word} · {item.reading}
        </CardTitle>
        <CardDescription>
          {item.kind === "PHRASE" ? "短句素材" : "词汇"} ·{" "}
          {statusLabel[item.validationStatus] ?? "待核对"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p>{String(item.payload.gloss ?? "")}</p>
        <p className="text-xs text-muted-foreground">
          分级：{String(item.payload.level ?? "未分级")} ·{" "}
          {String(item.payload.levelSource ?? "来源不明")} · 位置：
          {String(item.payload.location ?? "未记录")}
        </p>
        {item.validationNotes && (
          <p className="text-sm">校验说明：{item.validationNotes}</p>
        )}
        <label className="text-sm">
          核对说明
          <input
            aria-label={`${item.word} 核对说明`}
            maxLength={2000}
            className="mt-1 w-full rounded-lg border bg-background p-2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          已对照原始来源核对读音、义项和分级
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={busy || !checked || !note.trim()}
            onClick={() => void validate("VALIDATED")}
          >
            确认正确
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !note.trim()}
            onClick={() => void validate("REJECTED")}
          >
            标记有误
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy || !note.trim()}
            onClick={() => void validate("PENDING")}
          >
            退回待核对
          </Button>
        </div>
        {message && (
          <p role="status" className="text-xs">
            {message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

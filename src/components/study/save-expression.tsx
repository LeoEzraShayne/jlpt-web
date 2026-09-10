"use client";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { apiRequest } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import type { ReviewResult, PersonalExpression } from "@/lib/api/types";
export function SaveExpression({
  reviewId,
  result,
}: {
  reviewId: string;
  result: ReviewResult;
}) {
  const [variant, setVariant] =
    useState<PersonalExpression["variant"]>("CORRECTION");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const { mutate } = useSWRConfig();
  async function save() {
    setBusy(true);
    try {
      await apiRequest("/expressions", {
        method: "POST",
        body: JSON.stringify({ reviewId, variant, note }),
      });
      await mutate(
        (key) => typeof key === "string" && key.startsWith("/expressions"),
      );
      setMessage("已收藏到个人常用表达库");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "收藏失败");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      aria-label="收藏常用表达"
      className="flex min-w-0 flex-col gap-3 rounded-2xl border p-5"
    >
      <h3 className="font-semibold">收藏想熟练使用的表达</h3>
      <label className="text-sm">
        表达来源
        <select
          aria-label="收藏表达来源"
          value={variant}
          onChange={(e) =>
            setVariant(e.target.value as PersonalExpression["variant"])
          }
          className="mt-1 w-full rounded-lg border bg-background p-2"
        >
          <option value="CORRECTION">修正版</option>
          {result.isCorrect &&
            result.usedTargetGrammar === true &&
            result.targetGrammarCorrect === true && (
              <option value="ORIGINAL">正确原句</option>
            )}
          {result.alternativeSentence && (
            <option value="ALTERNATIVE">拓展示例</option>
          )}
        </select>
      </label>
      <label className="text-sm">
        个人备注
        <input
          aria-label="收藏表达备注"
          className="mt-1 w-full rounded-lg border bg-background p-2"
          maxLength={2000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <Button disabled={busy} onClick={() => void save()}>
        收藏表达
      </Button>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </section>
  );
}

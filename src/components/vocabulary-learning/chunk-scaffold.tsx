"use client";
import { t } from "@/lib/i18n/locale-store";
import { useLocale } from "@/components/locale/locale-provider";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ChunkScaffold({ chunks, disabled, onCompose }: {
  chunks: Array<{ id: string; text: string }>; disabled: boolean; onCompose: (sentence: string) => void;
}) {
  useLocale();
  const [selected, setSelected] = useState<string[]>([]);
  const chosen = selected.flatMap(id => chunks.find(chunk => chunk.id === id) ?? []);
  return <section aria-label={t("词块排序辅助")} className="space-y-3 rounded-xl border border-dashed p-3">
    <h3 className="text-sm font-semibold">{t("词块排序辅助")}</h3>
    <p className="text-xs text-muted-foreground">{t("按你认为的顺序点击词块，选中的词块可点击撤回。排序属于辅助练习，不计为独立回忆。")}</p>
    <div role="group" aria-label={t("可选词块")} className="flex flex-wrap gap-2">
      {chunks.map(chunk => <Button key={chunk.id} size="sm" variant="outline" className="h-auto max-w-full whitespace-normal break-words py-1 text-left" disabled={disabled || selected.includes(chunk.id)} onClick={() => setSelected(current => [...current, chunk.id])}>{chunk.text}</Button>)}
    </div>
    <div role="group" aria-label={t("已选词块")} className="flex min-h-12 flex-wrap gap-2 rounded-lg bg-secondary p-2">
      {chosen.map((chunk, index) => <Button key={chunk.id} size="sm" variant="secondary" className="h-auto max-w-full whitespace-normal break-words py-1 text-left" disabled={disabled} aria-label={t(`撤回第${index + 1}块 ${chunk.text}`)} onClick={() => setSelected(current => current.filter(id => id !== chunk.id))}>{chunk.text}</Button>)}
      {!chosen.length && <span className="text-xs text-muted-foreground">{t("点击上方词块开始排列")}</span>}
    </div>
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={disabled || !chosen.length} onClick={() => onCompose(chosen.map(chunk => chunk.text).join(""))}>{t("填入造句框")}</Button>
      <Button size="sm" variant="ghost" disabled={disabled || !chosen.length} onClick={() => setSelected([])}>{t("清空排序")}</Button>
    </div>
  </section>;
}

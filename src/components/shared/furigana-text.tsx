import { Fragment } from "react";

const annotationPattern =
  /([\p{Script=Han}々〆ヶ]+[\p{Script=Hiragana}]*)\[([\p{Script=Hiragana}ー]+)\]/gu;

export function FuriganaText({
  annotated,
  fallback,
}: {
  annotated?: string | null;
  fallback: string;
}) {
  if (!annotated) return <>{fallback}</>;
  const parts: Array<
    | { type: "text"; value: string }
    | { type: "ruby"; value: string; reading: string }
  > = [];
  let cursor = 0;
  for (const match of annotated.matchAll(annotationPattern)) {
    const index = match.index;
    if (index > cursor)
      parts.push({ type: "text", value: annotated.slice(cursor, index) });
    parts.push({ type: "ruby", value: match[1], reading: match[2] });
    cursor = index + match[0].length;
  }
  if (cursor < annotated.length)
    parts.push({ type: "text", value: annotated.slice(cursor) });

  return (
    <>
      {parts.map((part, index) =>
        part.type === "text" ? (
          <Fragment key={`${index}-${part.value}`}>{part.value}</Fragment>
        ) : (
          <ruby key={`${index}-${part.value}`} className="ruby-reading">
            {part.value}
            <rp>（</rp>
            <rt>{part.reading}</rt>
            <rp>）</rp>
          </ruby>
        ),
      )}
    </>
  );
}

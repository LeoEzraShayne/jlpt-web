import { ImageResponse } from "next/og";

export const alt = "文法トレーニング - JLPT N1～N4 日语语法学习";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ alignItems: "center", background: "#fffcf5", color: "#2d281f", display: "flex", height: "100%", justifyContent: "center", padding: 72, width: "100%" }}>
      <div style={{ alignItems: "flex-start", display: "flex", flexDirection: "column", gap: 28, maxWidth: 1000 }}>
        <div style={{ background: "#f4b740", borderRadius: 28, display: "flex", fontSize: 34, fontWeight: 700, padding: "18px 28px" }}>文法トレーニング</div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.18 }}>通过造句，真正掌握日语语法</div>
        <div style={{ color: "#756d60", display: "flex", fontSize: 32 }}>JLPT N1～N4 · AI 批改 · 间隔复习</div>
      </div>
    </div>,
    size,
  );
}

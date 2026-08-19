import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "文法トレーニング｜JLPT N1～N4 日语语法学习",
    short_name: "文法トレーニング",
    description: "通过造句、AI 批改和间隔复习掌握 JLPT 日语语法。",
    start_url: "/",
    display: "standalone",
    background_color: "#fffcf5",
    theme_color: "#f4b740",
    lang: "zh-CN",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

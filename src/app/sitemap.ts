import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-08-19");
  return [
    {
      url: "https://jlpt.meritledger.org/",
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://jlpt.meritledger.org/about",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: "https://jlpt.meritledger.org/privacy",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}

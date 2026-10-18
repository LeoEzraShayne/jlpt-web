import type { MetadataRoute } from "next";
import { PUBLIC_PAGES, SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  // Omit lastModified until maintained per-page dates exist; do not report a
  // stale shared date or manufacture a content update on every build.
  return Object.keys(PUBLIC_PAGES).map((path) => ({ url: `${SITE_URL}${path}` }));
}

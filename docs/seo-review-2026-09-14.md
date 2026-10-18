# SEO review — 2026-09-14

Status: deployed and verified on the production domain; sitemap resubmitted successfully in Google Search Console. Scope is metadata and indexing, without changing authentication, learning or payment behavior.

## Findings and fixes

- Public discovery now includes `/`, `/about`, `/privacy`, `/delete-account` from one shared registry. The old sitemap omitted account deletion and reused an outdated 2026-08-19 modification date. Dates are omitted until maintained per-page dates exist.
- Public pages use specific descriptions, self-canonicals, Open Graph and Twitter titles/descriptions/images. Previously account deletion inherited the home share URL/title, privacy lacked an OG description, and child OG definitions lost the shared image.
- Server-rendered public titles use the same Chinese title function as client hydration. The home title includes JLPT N1–N4, grammar and vocabulary; the parent template no longer duplicates the brand.
- The root layout no longer makes every descendant canonical to the homepage. Public pages define their own canonical; private routes keep their existing noindex metadata.
- Added matching X-Robots-Tag response headers to the authenticated study routes, vocabulary routes, plans, library, membership, orders, payment return and recovery pages. Kept the Android connection route's stronger existing headers. Crawl access remains available so search engines can observe noindex.

## Verification

- Production Next.js build passed.
- ESLint passed for changed sources and the checker.
- Existing document-locale tests: 4 passed.
- `node scripts/check-seo.mjs http://127.0.0.1:54225`: 24 routes passed (4 public, 20 private); canonical/OG/Twitter metadata, public rendered H1, private meta/header noindex, sitemap exact contents and robots sitemap declaration checked.
- Browser hydration shows the new home title without overriding it to the previous shorter title.
- Online homepage was inspected in Chrome. The search retrieval snapshot still showed an older brand; it is not a real-time deployment test. Direct Python HTTP requests received 403, so no claim about Googlebot blocking is made from that client alone.

## Further search growth

Most newly added pages are personal workflows, not anonymous content pages, so listing them all in a sitemap would not provide useful search landing pages. Additional organic search coverage would require actual public grammar/vocabulary guides or feature pages with useful original content and internal links. The existing Chinese/English toggle is a UI preference on the same URL; separate English indexing would require distinct crawlable URLs and matching hreflang, not fake alternates pointing to the same page. No keyword ranking or indexing timing is guaranteed by this change.

References:
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/fundamentals/get-started
- https://nextjs.org/docs/app/api-reference/functions/generate-metadata

## Production deployment and Search Console

- Deployed Worker version: `dd663b8f-2bf3-489b-950a-ffd245b7886b`.
- Previous version for rollback: `9a61dbf3-d045-44ec-8b64-a16ed87c84e7`.
- Explicit production build API: `https://api.jlpt.meritledger.org/api/v1`.
- All 24 HTTP SEO checks passed against `https://jlpt.meritledger.org`, including the four-entry sitemap.
- Resubmitted `sitemap.xml` in the existing URL-prefix property using Chrome.
- Google displayed “已成功提交站点地图”; table showed success, submitted/read on 2026-09-14, 4 discovered pages. Discovery is not a claim that every page is indexed.
- Deployment log and live verification output are stored in the workspace root `.local/seo-deploy-20260914.log` and `.local/seo-live-check-20260914.json`.

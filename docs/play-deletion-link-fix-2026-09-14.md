# Google Play deletion-link rejection repair — 2026-09-14

Google's rejection references the legacy `https://official.meritledger.org/delete-account` URL and a missing identity matching the listing. The current Data Safety draft contains `https://jlpt.meritledger.org/delete-account`.

## Deployed page

- Chinese and English deletion pages explicitly identify **JLPT造句实验室 / JLPT Sentence Lab**, developer **Leo.Shayne**, and package **com.meritledger.app**.
- Existing email request instructions, scope and retention disclosures remain available without sign-in. No account deletion or email was performed.
- Updated the deletion page metadata description.
- ESLint and production OpenNext build/deployment passed; live SEO check passed for all 24 routes and the four-URL sitemap. Chinese and English rendered content and mailto links were verified in Chrome.
- Worker version: `28b4c138-cd63-4dc1-9ecb-d182661ba35d`.
- Deployment log: `/Users/shen/Downloads/jlpt/.local/deletion-fix-deploy-20260914.log`.

## Access repair

Google Play's URL checker returned HTTP 403. An ordinary Python request reproduced Cloudflare error 1010, whereas normal Chrome/curl and Googlebot user agents returned 200. Cloudflare documents 1010 as browser-signature blocking.

With explicit user confirmation, deployed configuration rule `b422851c7fc646d8bd09a697a9111a1b`, named `JLPT public deletion page - allow URL checkers`, with Browser Integrity Check off only for:

```text
(http.host eq "jlpt.meritledger.org" and http.request.uri.path eq "/delete-account" and http.request.method in {"GET" "HEAD"})
```

After deployment the previously blocked Python client received 200 for GET and HEAD on `/delete-account`; the same client still received 1010 on `/login`, confirming the exception is limited. Google Play's URL check then passed and advanced to Data Types.

## Remaining Console blocker

The existing Data Safety draft has four selected types whose usage questions are unfilled: user payment information, files and documents, in-app search history, and other user-generated content. Next remains disabled at step 4 until these declarations are completed. They were not guessed or removed to bypass validation. See the existing `play-data-safety-final-matrix-2026-09-13.md` for source evidence and unresolved provider/legacy-service facts.

No new AAB was uploaded and no review submission is established by this repair.

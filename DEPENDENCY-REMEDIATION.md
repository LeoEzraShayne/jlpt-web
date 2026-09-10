# Production dependency remediation — 2026-09-10

Addresses the dependency audit failure in CI run `34491510100`, based on web
commit `91e7809`. Only the dependency manifests and this note change.

| Package | Previous lock | New lock |
| --- | --- | --- |
| next / eslint-config-next | 16.3.0 | 16.3.4 |
| vitest and its internal packages | 4.1.0 | 4.1.11 |
| sharp | 0.35.2 / 0.35.3 | 0.35.4 |
| fast-uri | 3.1.5 | 3.1.7 |
| js-yaml | 4.3.1 | 4.3.2 |
| hono | 4.13.1 | 4.13.7 |
| qs | 6.15.3 | 6.16.0 |

Next.js and its ESLint configuration remain aligned. Wrangler stays at 4.120.0,
Miniflare at 5.20260801.1-alpha, and OpenNext Cloudflare at 1.20.2. No forced
Wrangler downgrade or unrelated dependency upgrade is included.

Miniflare pins vulnerable sharp 0.35.2. The root `sharp: 0.35.4` override makes
both Miniflare and Next use the patched version. A scoped Miniflare override
initially produced a lockfile that npm 10 rejected; the root override and final
lockfile were verified with a clean npm 10 installation. Native packages for
Linux and the other supported platforms remain in the lockfile; the removed
Miniflare copies were deduplicated. Reconsider the override when Miniflare's
own dependency has a patched version. See the [sharp advisory](https://github.com/lovell/sharp/security/advisories/GHSA-rgj7-g3m4-5g8c).

Validation uses Node 22.23.2 and npm 10.9.9, matching CI's Node major, in an
isolated worktree with its own node_modules. No environment files or deployment
credentials were copied or read, and no push or deployment was performed.

| Check | Result |
| --- | --- |
| Clean `npm ci` | Passed |
| `npm audit --audit-level=high` | Passed: zero vulnerabilities at all severities |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm test` | Passed: 25 tests, 8 files |
| `npm run check:lines` | Passed: 106 source files |
| `npm run build` with production API URL | Passed |
| `npx opennextjs-cloudflare build` with production API URL | Passed: `.open-next/worker.js` generated |
| Existing Playwright suite | Passed: 135 tests across desktop and four mobile viewports |
| Sharp resolved from Miniflare | Passed: AVIF encode/decode and PNG conversion, sharp 0.35.4 / libheif 1.23.2 |

Browser plugin not available; browser regression used the repository's existing
Playwright tests with mocked API responses against localhost:3127. These tests
do not access the production API or validate production database behavior.

The explicit public build setting is
`NEXT_PUBLIC_API_URL=https://api.jlpt.meritledger.org/api/v1`.
Use the same setting when rebuilding the Worker for publishing. Production
deployment, database work, and live endpoint verification belong to the main
deployment task.

The successful OpenNext command (under the Node 22 / npm 10 runtime) was:

```sh
NEXT_PUBLIC_API_URL=https://api.jlpt.meritledger.org/api/v1 \
NEXT_TELEMETRY_DISABLED=1 WRANGLER_SEND_METRICS=false \
npx --no-install opennextjs-cloudflare build
```

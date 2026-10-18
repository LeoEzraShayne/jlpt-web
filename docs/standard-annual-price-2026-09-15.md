# Standard annual pricing — 2026-09-15

> Subsequently deployed at 2026-09-15 09:33 UTC to Worker version `eb96387d-38b7-4977-b629-58eadb8f7787` (100%). Live membership-page verification passed. See [deployment evidence](../../jlpt-api/docs/operations/standard-annual-price-deployment-2026-09-15.md).

Web annual membership displays USD99 once for 365 days. Day pass remains USD0.99/24 hours. The membership package component no longer renders launch badges, struck-through prices or countdowns and has no offer-expiry effect. Cached legacy catalog discount fields cannot restore the USD64 display. Order history continues to show actual historical amounts.

Deploy the standard-price API first: new Checkout orders require its existing `STRIPE_PRICE_YEAR_USD_STANDARD` (active, one-time USD9900 cents). Valid persisted historical quotes retain their saved price and expiry. No real payment or live deployment was executed.

Validation: TypeScript, 14 membership tests, production Next.js build, focused ESLint and line check passed. Browser visual acceptance was not run. Existing unrelated Web edits were retained, including other entries in `src/lib/i18n/en.json`.

See the cross-repository [pricing and Console evidence](../../jlpt-api/docs/operations/standard-annual-price-2026-09-15.md) for rollout order and compatibility details.

# Membership, mobile UI and automatic annual discount — 2026-09-16

## Delivered

- Current-entitlement VIP badge: below the desktop username; replaces the mobile header theme control. Profile retains theme selection. Removed profile identity subtitle and active-membership card.
- Equal language selectors; compact English mobile action labels; single-line bottom navigation. Shared statistics label rows align values, with separate smaller time units.
- Membership terms and Orders share a row. Packages use server quotes, original/discount prices and a concise benefit statement. Orders show product/amount/status, order number and actual paid time; provider names removed.
- Secure Android handoff entry; older clients keep the compatible explicit binding flow. New Android implementation and version 28 / 2.0.4 live in jlpt-android; users must install the new signed build for native changes.
- Included separately verified vocabulary card changes: Unknown / Practice / Learned / Bookmark, four equal columns, no redundant reference-vocabulary row.

## Live release

- Web Worker version: `1062b765-4dc7-4043-9e5a-c307c4bc91c9`.
- API: `/var/www/jlpt-releases/108e6a3-membership-discount-20260916`.
- Additive migration: `20260916010000_android_handoff`.
- Stripe annual base USD99, discount USD35, total USD64; day USD0.99. Promotion code `JLPT-WEB-YEAR-AUTO`, Coupon `dBzvfYKt`, annual product only. No customer/redemption count restrictions or code entry UI.
- Ends `2027-03-12T23:58:00Z` / 2027-03-13 08:58 JST. Existing Checkout sessions can remain payable for their original 60-minute lifetime.
- Existing production key received only Coupons Read and Promotion Codes Read after explicit user approval. Runtime cannot write discounts.

## Verification

- Web: 23 membership/badge/statistics tests; auth agent additionally verified 23 Android/Web flow tests; TypeScript and production build passed.
- Responsive fixture browser: zh/en × 320/360/390/412/1280; profile, Save action, statistics, membership and orders; text bounds and shared numeric alignment checked, screenshots inspected.
- API: 9 promotion unit tests, 27 database Checkout/Webhook tests, 17 database Android auth tests. Builds and targeted ESLint passed.
- Genuine Stripe test Checkout and live unpaid Checkout both verified subtotal9900, discount3500, total6400 USD. Smoke sessions expired after verification; no money charged and no smoke order added to the user's history.
- Live browser verified active VIP, USD64 membership pricing, exact end date and existing expired order with `Paid at: —`.
- Android: 48 unit tests, Debug build, 8 device tests and 2 additional Chinese preview tests passed. Lint retains the pre-existing unused app_name finding. Signed-release TWA trust and real Play billing still require device acceptance after user packaging.

## Evidence and rollback

Local evidence: `/Users/shen/Downloads/jlpt/.local/merged-membership-20260916/` (source manifests, build/deploy logs, screenshots, live price verification). Server backup: `/var/www/jlpt-backups/membership-discount-20260916.dump`.

Disable the dedicated promotion to stop new discounts; keep the new discount-aware payment code to process in-flight orders and refunds. Do not roll back to a payment handler that cannot validate discounted snapshots. The auth migration is additive and old Android clients remain supported.

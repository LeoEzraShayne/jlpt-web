# Web deployment — 2026-09-14

Published product commit `269719b` to the existing `jlpt-web` Cloudflare Worker.

- Worker version: `2fa30477-40bc-4b68-8099-9bc7cb49beea` (100%).
- Previous rollback version: `381cf111-d088-4ab4-8c43-823991689502`.
- Includes reviewed dashboard/profile/card layouts, desktop review/history three-column grids, and scored-only history with zero-score retention, empty-page cursor handling and pending-grade refresh.
- Validation: 115 unit tests, 6 Chinese/English responsive E2E checks (390/768/1440), build, lint and line checks passed before release. Production OpenNext build succeeded using the production API origin; synthetic/local-preview marker scan passed. CSS asset: `957e1a090867aadc.css`.
- Live custom-domain browser verification loaded `/history` and displayed the new graded-history empty state correctly. Raw HTTP probes received 403; browser rendering succeeded. No account, grading, payment or other user-data mutations were performed.
- API and Android native binaries were not changed or deployed. Android learning pages receive the same published responsive Web UI.

---

# JLPT UI production deployment — 2026-09-13

User explicitly requested immediate deployment to inspect the UI. Deployed Web
product source `4a2289a` using the existing OpenNext Cloudflare Worker target
`jlpt-web` and its production API origin.

- New Worker version: `89b32b36-b913-4d38-b4ae-1c47c76144df` (100% deployment).
- Previous rollback version: `676d1d0a-ae5a-46ec-97f5-264873fee4a7`.
- Production build and deployment completed successfully. Build explicitly
  removed Android test-package and dev-host overrides. Asset checks found no
  local preview ports, synthetic account, fixture username or tunnel domain.
- Browser verification on `https://jlpt.meritledger.org` loaded the new
  `9120621a6f4f65cd.css` asset and the updated privacy wording about persistent
  explicit adult acknowledgment. Public login and privacy pages rendered;
  `/today` loaded its access boundary. No browser error logs were observed.
- A raw Python HTTP probe was rejected with 403; browser verification succeeded.
  No authenticated account changes or age declaration were performed by agent.

The latest native membership renderer (`jlpt-android` product commit `8d0923c`)
was also installed in-place into the physical Pad's existing `.debug` package.
Its isolated `MembershipPreviewActivity` was opened and visually confirmed to
show annual offer badge and aligned benefit bullets. This is explicitly labeled
synthetic UI, not a production price or commerce activation. Production Android
package, real user data, backend flags, signing and Play submission were untouched
in this deployment turn.

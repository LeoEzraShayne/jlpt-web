# Web W1 delivery — 2026-09-13

Implemented within the existing layout:
- Browser-subscribed zh/en UI dictionary, interface and explanation preference controls. Locale changes retain mounted form state. Japanese source data is not translated by the UI.
- Login, plan, today, grammar, vocabulary, practice, feedback, history, settings and navigation UI copy.
- Membership/catalog market selection, server amount display, sales-disabled state, Stripe-hosted Checkout with per-product retry UUID, owned orders and server-order return polling. The return page never grants membership from a URL parameter.
- Explicit quota messages and member entry that opens separately from practice, retaining its input; grammar submission UUIDs and vocabulary correction submissions preserve the first assessment.
- Static localized grammar/examples/relation content, English dictionary glosses and immutable grammar feedback language snapshots.
- Touch highlight suppression with focus/press feedback preserved. Existing mobile priority review ordering retained.

Validated: npm ci (0 reported vulnerabilities), npm run lint, npm run typecheck, npm test (42 tests), npm run build (25 routes).

W2 integration work, not release acceptance:
1. Complete public home/about/privacy English text and update payment/privacy disclosures after actual provider flows are integrated. Confirm all static metadata and brand assets with G.
2. Consume D's final vocabulary runtime language fields (prompt, preview, feedback, reference). Grammar localizedFeedback is wired, but must be exercised with real zh/en AI results. C localized data inside session/reveal and dashboard/review responses must be confirmed against the integrated API; absent English shows an explicit missing translation message.
3. Browser QA of all zh/en routes at phone/desktop sizes and real Checkout return/account ownership/error states. No authenticated browser control was performed by B.
4. Native payment surface currently hides Stripe for Android app referrer/user-agent/session hints only. This is a presentation restriction, not authentication; no native trust or billing bridge is implemented in W1. E/main must connect the verified native bridge and perform installed-app checks before Android release.
5. A returns reviewAttempts with latest answer/result at the top level. Revision UI is integrated; independent concurrency/idempotency/expiry acceptance belongs to F/W2.
6. Live sales remain disabled until independent quality and full AI cost acceptance.

No migrations or shared API types were authored by B. Main's shared-type commits were cherry-picked unchanged.

## W2 follow-up 1
- Public home/about/privacy now have full English visible content and actual Stripe/payment/privacy disclosures; tests scan visible public copy for untranslated Chinese.
- Billing routes bypass plan onboarding while retaining authentication. Expired login redirects preserve order query parameters. Anonymous language choice carries through Google sign-in; onboarding exposes both language preferences.
- Fixed dashboard statistics labels/details, public navigation, theme names and history dates. Mobile shell hides the interface label visually to leave brand space.
- Paid historical orders do not claim entitlement synchronization when current membership is inactive. Web copy describes supported devices without claiming Android is already launched.
- Validation: 50 tests pass; lint/typecheck and the public-page production build pass. Main agent performed shared-stack browser tests; pending issues continue through W2.

## W2 runtime vocabulary contract
D confirmed `localized.{locale,prompt,meaningHint,referenceTranslation}`, `learningPreview.localized.{locale,meaning,exampleTranslation}` and `result.localizedFeedback.{locale,explanation,correctedTranslation,corrections}`. English session snapshots now consume these fields in practice and history; legacy sessions remain Chinese. UI does not materialize locked hints/references from supplemental translation fields. D's presenter must omit unauthorized translation fields server-side as agreed.

`reviewAttempts[].result` uses the same normalized result shape as the top-level response. The expandable assessment history displays each answer and feedback without claiming a new memory schedule for each correction. First memory evidence remains server-owned.

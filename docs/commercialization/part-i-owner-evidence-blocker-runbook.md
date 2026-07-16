# Part I Owner Evidence Blocker Runbook

Status date: 2026-06-05

Use this runbook when Part I is repo-complete but blocked on owner-held evidence. It is written for an owner or Comet-style assistant working with local credentials. Do not paste secrets, raw Stripe payloads, Checkout Session payloads, subscription exports, invoice exports, dashboard screenshots, customer identities, partner names, partner emails, contracts, private quotes, or hash salts into chat or tracked files.

## Current Machine State

Latest full-local commercial verification passed on 2026-06-05 with all repo-local optional release gates included: default core, browser journey, accessibility smoke, network/source/audit checks, full-local gate, typecheck, and diff hygiene. This does not upgrade launch readiness. The current launch decision remains `pilot-only`, readiness remains `owner_evidence_required`, and the remaining owner-held gates are `manual_wcag_evidence`, `real_stripe_test_checkout`, `live_mrr_gt_zero`, `three_committed_partners`, and `documented_outcomes`.

The closeout packet currently accepts `production_calibration_run` and `authenticated_live_artifact_e2e` as live source artifacts. Treat those as already represented in the generated owner evidence ledgers, but do not treat them as payment, revenue, partner, outcome, manual WCAG, legal, or procurement proof.

## Current Blockers

| Gate | Current blocker | Must be real | Repo command that proves it |
| --- | --- | --- | --- |
| Stripe test checkout | Local checkout key is missing or live-mode, but the verifier only accepts explicit `STRIPE_TEST_SECRET_KEY` or `STRIPE_TEST_RESTRICTED_KEY` values with `sk_test_` or `rk_test_` | A Stripe test-mode subscription Checkout Session created through the deployed `create-checkout-session` function and retrieved from Stripe with `livemode=false`, session status/payment status recorded, and owner-held archive policy present | `npm run verify:stripe-test-checkout` |
| Live MRR > 0 | Stripe live account currently returns zero active subscriptions or zero paid invoice evidence | At least one live active subscription with fixed recurring MRR, at least one live paid invoice with `amount_paid > 0`, and owner-held subscription/invoice archive policy present | `npm run verify:stripe-live-mrr` |
| Partner/outcome evidence | Local intake still has placeholder refs, placeholder proof artifact hashes, placeholder integrity attestations, missing ownerEvidenceArchive policy metadata, missing measured-outcome scope, or placeholder salt | Three permissioned partner commitments and one permissioned outcome record, composed into salted hashes plus owner-held proof artifact metadata only, with marketing/testimonial integrity attestations, owner-held archive policy metadata, measured-outcome scope fields, and the owner worksheet refreshed by `npm run generate:commercial-evidence-intake-packet` | `COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all` |
| Manual WCAG evidence | Local manual accessibility evidence file is missing, still has placeholder hashes, or lacks ownerEvidenceArchive policy metadata | Redacted WCAG-EM-scoped manual review metadata with owner-held raw notes, artifact hashes, official W3C/WAI references, checkpoint `standardRefs`, product scope, route-sample rationale, complete-process review, accessibility-support baseline combinations, ownerEvidenceArchive policy metadata, and a completed owner-held route/checkpoint review worksheet based on `npm run generate:manual-wcag-review-packet` | `npm run verify:manual-wcag-evidence -- --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete` |
| Final closeout | The four gates above fail closed | Passing live-gate evidence, commercial evidence records, and manual WCAG evidence metadata | `npm run closeout:owner-evidence -- --write --refresh-tracked --live-evidence docs/commercialization/live-gate-evidence.local.json --commercial-intake docs/commercialization/commercial-evidence-intake.local.json --commercial-evidence docs/commercialization/commercial-evidence-records.local.json --manual-wcag-evidence docs/commercialization/manual-wcag-evidence.local.json` |

## Official References

- [Stripe testing environments](https://docs.stripe.com/test-mode), as of 2026-06-05: test mode and Sandboxes simulate Stripe objects without moving real money; live keys must stay in environment variables or a secrets vault, never source control.
- [Stripe Billing testing](https://docs.stripe.com/billing/testing), as of 2026-06-05: subscription behavior can be tested with Stripe-hosted Checkout and test clocks, but those tests do not prove live MRR.
- [Stripe API keys](https://docs.stripe.com/keys), as of 2026-06-05: test keys and live keys are mode-specific; live mode is used for real payments.
- [Stripe API authentication](https://docs.stripe.com/api/authentication), as of 2026-06-05: Stripe API keys authenticate server-side API requests; keep secret keys out of public places.
- [Stripe Checkout Sessions](https://docs.stripe.com/api/checkout/sessions), as of 2026-06-05: a Checkout Session represents a customer session for payment or subscription checkout.
- [Stripe create Checkout Session](https://docs.stripe.com/api/checkout/sessions/create), as of 2026-06-05: server-side code creates sessions that redirect to Stripe-hosted checkout.
- [Stripe products and prices](https://docs.stripe.com/products-prices/manage-prices), as of 2026-06-05: use test-mode Prices for test checkouts and live Prices for live subscriptions.
- [Stripe subscriptions lifecycle](https://docs.stripe.com/billing/subscriptions/creating), as of 2026-06-05: a subscription becomes active after the invoice is paid.
- [Stripe list subscriptions API](https://docs.stripe.com/api/subscriptions/list), as of 2026-06-05: used by the local live-MRR verifier to read active subscriptions.
- [Stripe list invoices API](https://docs.stripe.com/api/invoices/list), as of 2026-06-05: used by the local live-MRR verifier to find paid invoice evidence.
- [W3C WCAG-EM overview](https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/), as of 2026-06-05: WCAG-EM structures scope definition, product exploration, representative sample selection, evaluation, and reporting.
- [Draft WCAG-EM 2.0](https://www.w3.org/TR/wcag-em-2/), as of 2026-06-05: complete processes and representative samples must be included, and a subset review alone must not be overclaimed as whole-product conformance.
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html), as of 2026-06-05: owner secrets need lifecycle controls, least exposure, rotation planning, and auditability outside the repository.
- [GitHub push protection](https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection), as of 2026-06-05: push protection can block supported secrets before they reach the repository, but local secret hygiene and ignored owner evidence paths still remain required.
- [Supabase Edge Function secrets](https://supabase.com/docs/guides/functions/secrets), as of 2026-06-05: set hosted function secrets in the dashboard or with `supabase secrets set`; do not commit `.env` files.
- [Supabase Edge Function deploy](https://supabase.com/docs/guides/functions/deploy), as of 2026-06-05: functions can be deployed and tested through the Supabase CLI.

## Preflight

1. Confirm the repo branch and working tree:

```bash
git status --short --branch
```

2. Confirm the ignored local evidence files are not staged:

```bash
git check-ignore -v .env.local docs/commercialization/commercial-evidence-intake.local.json docs/commercialization/live-gate-evidence.local.json docs/commercialization/commercial-evidence-records.local.json docs/commercialization/manual-wcag-evidence.local.json
```

3. Load local environment values without printing them:

```bash
set -a
source .env.local
set +a
```

4. Run the non-writing closeout status check. It is expected to fail until the blocker gates are real:

```bash
npm run verify:owner-evidence-closeout
```

5. Confirm the owner-facing runbooks still mirror the generated 21-command handoff sequence:

```bash
npm run verify:owner-evidence-runbook-alignment
```

## Blocker 1: Stripe Test Checkout

Goal: create a real Stripe test-mode subscription Checkout Session through the deployed Supabase Edge Function, retrieve it from Stripe, and write a redacted proof artifact with `livemode=false`, session status/payment status, and owner-held archive policy metadata.

### Owner Inputs

| Variable | Required value |
| --- | --- |
| `SUPABASE_URL` or `VITE_SUPABASE_URL` | Target Supabase project URL |
| `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY` | Public anon key for the target project |
| `LIVE_SUPABASE_TEST_USER_EMAIL` or `STRIPE_TEST_USER_EMAIL` | Dedicated synthetic Supabase Auth test user |
| `LIVE_SUPABASE_TEST_USER_PASSWORD` or `STRIPE_TEST_USER_PASSWORD` | Password for the synthetic test user |
| `STRIPE_TEST_SECRET_KEY` or `STRIPE_TEST_RESTRICTED_KEY` | Test-mode Stripe key only: `sk_test_...` or `rk_test_...`. Generic `STRIPE_SECRET_KEY` is intentionally ignored by this test proof so live-MRR checks can keep using a live key. |
| `STRIPE_TEST_PRICE_ID` or `APO_STRIPE_TEST_PRICE_ID` | Test-mode Stripe Price ID from the same Stripe account |

### Steps

1. In the Stripe Dashboard, switch to test mode and create or choose a recurring test Price for the APO plan. Store the Price ID in `.env.local` as `STRIPE_TEST_PRICE_ID`.

2. Set the local verifier key to a Stripe test-mode secret or restricted key. Prefer `STRIPE_TEST_SECRET_KEY` or `STRIPE_TEST_RESTRICTED_KEY`. The verifier will reject `sk_live_...` and `rk_live_...`.

```bash
# In .env.local, owner-held only:
# STRIPE_TEST_SECRET_KEY=sk_test_...
# STRIPE_TEST_PRICE_ID=price_...
```

3. Confirm the deployed `create-checkout-session` function is also using test-mode Stripe credentials for this proof run. If the same Supabase project is serving live users, use a staging project or a maintenance window. Do not silently switch a live checkout function to test mode during real customer traffic.

Preferred owner path: update the function secret in the Supabase Dashboard using Edge Function Secrets Management.

CLI path, using a temporary env file outside the repo:

```bash
mkdir -p /tmp/apo-owner-evidence
printf 'STRIPE_SECRET_KEY=%s\n' "$STRIPE_TEST_SECRET_KEY" > /tmp/apo-owner-evidence/stripe-test.env
supabase secrets set --env-file /tmp/apo-owner-evidence/stripe-test.env --project-ref kvunnankqgfokeufvsrv
rm /tmp/apo-owner-evidence/stripe-test.env
```

4. Run the verifier:

```bash
npm run verify:stripe-test-checkout
```

5. Expected result:

- `docs/commercialization/stripe-test-checkout-proof-latest.json` has `"status": "passed"`.
- `stripe-test-key-mode`, `auth-sign-in`, `edge-checkout-session`, and `stripe-session-retrieve` all pass.
- `evidenceSummary.testMode` is `true`.
- `evidenceSummary.checkoutSessionCreated` is `true`.
- `evidenceSummary.edgeFunction` is `create-checkout-session`.
- `evidenceSummary.checkoutSessionMode` is `subscription`.
- `evidenceSummary.paymentStatus` and `evidenceSummary.checkoutSessionStatus` are recorded.
- `evidenceSummary.ownerEvidenceArchive` records that raw Checkout Session payloads, function invocation metadata, secrets, customer identifiers, payment details, and post-config-change rerun requirements remain owner-held.

6. If this was a production Supabase function that normally uses live Stripe credentials, restore the live function secret after the test proof and re-run any owner-required checkout smoke. Keep the restoration note owner-held.

### Failure Triage

| Failure | Meaning | Fix |
| --- | --- | --- |
| `failed_non_test_stripe_key` | The explicit checkout test key is live-mode or malformed | Add `STRIPE_TEST_SECRET_KEY=sk_test_...` or `STRIPE_TEST_RESTRICTED_KEY=rk_test_...`; the generic `STRIPE_SECRET_KEY` is ignored by this test proof |
| `edge-checkout-session-failed` | Supabase function did not return a valid Checkout Session | Check synthetic user auth, function deployment, function secrets, and test Price ID |
| Stripe says the Price does not exist | Test Price is from another account or another mode | Use a test-mode Price from the same Stripe account as the test key and function secret |
| Retrieved session is live-mode | The deployed function probably used a live Stripe key | Reconfigure the deployed function for test-mode proof or run against staging |

## Blocker 2: Live MRR Greater Than Zero

Goal: prove real live recurring revenue exists without exposing customers, subscription IDs, invoice IDs, raw subscription exports, raw invoice exports, dashboard screenshots, or raw Stripe payloads.

This cannot be simulated. Test-mode subscriptions, one-time payments, unpaid invoices, draft invoices, and placeholder dashboard rows do not satisfy this gate.

### Owner Inputs

| Variable | Required value |
| --- | --- |
| `STRIPE_LIVE_RESTRICTED_KEY` | Preferred live-mode read-only restricted key, `rk_live_...` |
| `STRIPE_LIVE_SECRET_KEY` | Acceptable fallback live-mode secret key, `sk_live_...` |
| `STRIPE_LIVE_MRR_CURRENCY` | Optional currency filter, for example `usd` |
| `STRIPE_LIVE_MRR_MAX_PAGES` | Optional page cap for subscription reads |

Do not rely on `STRIPE_SECRET_KEY` for this gate if that variable is being used as the test-mode key for the checkout proof. Prefer `STRIPE_LIVE_RESTRICTED_KEY`.

### Steps

1. In Stripe live mode, confirm there is at least one live active subscription on a recurring Price.

2. Confirm the active subscription has at least one paid live invoice with `amount_paid > 0`.

3. If there is no live customer yet, create a real paid pilot subscription only after owner approval and only under your normal commercial/legal process. This repo gate cannot manufacture revenue.

4. Create a live restricted read-only Stripe key with read permissions sufficient for subscriptions and invoices. If the restricted key cannot read subscription item prices, use a broader owner-approved live key for the one-time verifier run and rotate it afterward.

5. Store the key locally only:

```bash
# In .env.local, owner-held only:
# STRIPE_LIVE_RESTRICTED_KEY=rk_live_...
# Optional:
# STRIPE_LIVE_MRR_CURRENCY=usd
```

6. Run the verifier:

```bash
npm run verify:stripe-live-mrr
```

7. Expected result:

- `docs/commercialization/stripe-live-mrr-proof-latest.json` has `"status": "passed"`.
- `stripe-live-key-mode`, `stripe-active-subscriptions-read`, `stripe-live-mrr-positive`, and `stripe-paid-invoice-evidence` all pass.
- `evidenceSummary.liveMode` is `true`.
- `evidenceSummary.totalMrrGreaterThanZero` is `true`.
- `evidenceSummary.activeSubscriptionCount` is at least `1`.
- `evidenceSummary.paidInvoiceCount` is at least `1`.
- `evidenceSummary.ownerEvidenceArchive` records that raw subscription exports, raw invoice exports, secrets, customer identifiers, subscription/invoice IDs, payment details, and post-revenue-change rerun requirements remain owner-held.

### Failure Triage

| Failure | Meaning | Fix |
| --- | --- | --- |
| `failed_non_live_stripe_key` | Key is test-mode or malformed | Use `rk_live_...` or `sk_live_...` |
| No active subscriptions | Live Stripe has no active recurring subscription | Add or wait for a real paid live subscription |
| No positive fixed recurring MRR | Active subscription does not contain fixed recurring Price items | Use a recurring Price with positive amount |
| No paid invoice evidence | Subscription has not produced a paid invoice with amount paid | Complete payment or wait for invoice payment to settle |

## Blocker 3: Partner And Outcome Evidence

Goal: compose redacted, salted evidence records from owner-held intake. The repo should receive hashes and consent/permission metadata only.

### Owner Inputs

Use `docs/commercialization/commercial-evidence-intake.local.json`. This file is gitignored.

Required minimum:

- Three unique `designPartnerCommitments`.
- One unique `documentedOutcomes`.
- A non-placeholder `hashSalt` with at least 16 characters, or `COMMERCIAL_EVIDENCE_HASH_SALT` in the environment.

Use `npm run hash:owner-evidence-artifacts -- <local proof files>` to compute non-placeholder `proofArtifactHashes` from owner-held permission emails, signed pilot scopes, artifact review logs, baseline workflow notes, measured-change summaries, or quote approvals. The helper writes no files and prints JSON with `proofArtifactHash` values, byte counts, and `sourcePathHash` fingerprints only; it does not print source filenames or raw file contents. Copy only the `proofArtifactHash` values into `docs/commercialization/commercial-evidence-intake.local.json`.

### Design Partner Fields

Each partner record must have:

| Field | Requirement |
| --- | --- |
| `partnerRef` | Stable owner-held reference, not a public name and not a placeholder |
| `segment` | Segment label such as `career_coach`, `career_center`, `workforce_board`, `ld_team`, or `paid_pilot` |
| `committedAt` | ISO date or datetime, not future-dated relative to `asOf` |
| `permissioned` | `true` |
| `contactPermission` | `true` |
| `pilotScopeAccepted` | `true` |
| `planningOnlyUseConfirmed` | `true` |
| `artifactReviewed` | Specific artifact label such as `white_label_sample_report` |
| `nextStepRecorded` | `true` |
| `proofArtifactHashes` | Non-placeholder `sha256:` hashes of owner-held proof artifacts |
| `proofArtifactTypes` | Include `artifact_review_log` and at least one of `permissioned_email` or `signed_pilot_scope` |
| `rawEvidenceOwnerHeld` | `true`; raw artifacts stay outside git and chat |
| `ownerEvidenceArchive` | All required partner archive fields are `true`: permission trail, pilot scope record, artifact review log, contact details outside git, material-connection review, incentive/compensation review, no sentiment-conditioned solicitation, and re-review before public use |
| `redactionLevel` | Public boundary, for example `public_segment_only` |
| `doesNotProve` | Explicit claim boundaries |

### Outcome Fields

The outcome record must have:

| Field | Requirement |
| --- | --- |
| `outcomeRef` | Stable owner-held reference, not a public name and not a placeholder |
| `observedAt` | ISO date or datetime, not future-dated relative to `asOf` |
| `permissioned` | `true` |
| `baselineWorkflowCaptured` | `true` |
| `artifactReviewed` | Specific artifact label |
| `measuredChangeCaptured` | `true` |
| `approvedQuoteCaptured` | `true` |
| `quoteApprovalCaptured` | `true` |
| `proofArtifactHashes` | Non-placeholder `sha256:` hashes of owner-held proof artifacts |
| `proofArtifactTypes` | Include `baseline_workflow_note`, `measured_change_summary`, and `quote_approval` |
| `rawEvidenceOwnerHeld` | `true`; raw artifacts stay outside git and chat |
| `ownerEvidenceArchive` | All required outcome archive fields are `true`: baseline workflow evidence, measured-change evidence, quote approval record, private quote text outside git, material-connection review, incentive/compensation review, typicality substantiation, and re-review before public case-study use |
| `redactionLevel` | Public boundary, for example `public_quote_approved` |
| `doesNotProve` | Explicit claim boundaries |

### Minimal Local Intake Shape

Do not commit this file. Replace all placeholder-looking values before running the composer.

```json
{
  "schemaVersion": "2026-06-01.apo-commercial-evidence-intake.v1",
  "asOf": "2026-06-02",
  "sourceBoundary": "Owner-held intake used only to compose redacted commercial evidence records. Raw names, contacts, contracts, notes, quotes, customer data, and the salt stay outside git.",
  "hashSalt": "owner-held-random-string-at-least-16-characters",
  "designPartnerCommitments": [
    {
      "partnerRef": "owner-stable-ref-1",
      "segment": "career_coach",
      "committedAt": "2026-06-02",
      "permissioned": true,
      "contactPermission": true,
      "pilotScopeAccepted": true,
      "planningOnlyUseConfirmed": true,
      "artifactReviewed": "white_label_sample_report",
      "nextStepRecorded": true,
      "proofArtifactHashes": [
        "sha256:1111111111111111111111111111111111111111111111111111111111111111",
        "sha256:2222222222222222222222222222222222222222222222222222222222222222"
      ],
      "proofArtifactTypes": ["permissioned_email", "artifact_review_log"],
      "rawEvidenceOwnerHeld": true,
      "redactionLevel": "public_segment_only",
      "integrityAttestations": {
        "marketingUseReviewed": true,
        "materialConnectionReviewed": true,
        "incentiveOrCompensationReviewed": true,
        "noFakeOrSyntheticTestimonial": true,
        "noReviewGatingOrSuppression": true
      },
      "ownerEvidenceArchive": {
        "permissionTrailOwnerHeld": true,
        "pilotScopeRecordOwnerHeld": true,
        "artifactReviewLogOwnerHeld": true,
        "contactDetailsOwnerHeldOutsideGit": true,
        "materialConnectionReviewOwnerHeld": true,
        "incentiveOrCompensationReviewOwnerHeld": true,
        "reviewSolicitationNotConditionedOnSentiment": true,
        "reReviewRequiredBeforePublicUse": true
      },
      "doesNotProve": ["Revenue", "Retention", "Market-wide demand"]
    }
  ],
  "documentedOutcomes": [
    {
      "outcomeRef": "owner-stable-outcome-ref-1",
      "observedAt": "2026-06-02",
      "permissioned": true,
      "baselineWorkflowCaptured": true,
      "artifactReviewed": "white_label_sample_report",
      "measuredChangeCaptured": true,
      "approvedQuoteCaptured": true,
      "quoteApprovalCaptured": true,
      "proofArtifactHashes": [
        "sha256:3333333333333333333333333333333333333333333333333333333333333333",
        "sha256:4444444444444444444444444444444444444444444444444444444444444444",
        "sha256:5555555555555555555555555555555555555555555555555555555555555555"
      ],
      "proofArtifactTypes": ["baseline_workflow_note", "measured_change_summary", "quote_approval"],
      "rawEvidenceOwnerHeld": true,
      "redactionLevel": "public_quote_approved",
      "measuredChangeUnit": "minutes_saved_per_report",
      "measurementWindow": "single reviewed workflow during owner-held pilot evidence window",
      "outcomeClaimScope": "single permissioned observed workflow only; not generalized beyond the reviewed artifact",
      "typicalityBoundary": "not represented as typical or expected for other users without additional evidence",
      "integrityAttestations": {
        "marketingUseReviewed": true,
        "materialConnectionReviewed": true,
        "incentiveOrCompensationReviewed": true,
        "noFakeOrSyntheticTestimonial": true,
        "noReviewGatingOrSuppression": true,
        "counterfactualNotClaimed": true,
        "guaranteedOutcomeNotClaimed": true
      },
      "ownerEvidenceArchive": {
        "baselineWorkflowEvidenceOwnerHeld": true,
        "measuredChangeEvidenceOwnerHeld": true,
        "quoteApprovalRecordOwnerHeld": true,
        "privateQuoteTextOwnerHeldOutsideGit": true,
        "materialConnectionReviewOwnerHeld": true,
        "incentiveOrCompensationReviewOwnerHeld": true,
        "typicalitySubstantiationOwnerHeld": true,
        "reReviewRequiredBeforePublicCaseStudyUse": true
      },
      "doesNotProve": ["Guaranteed career outcomes", "Causal impact", "Generalizable demand"]
    }
  ]
}
```

The live file needs three partner objects, not one.

### Steps

1. Prepare or update the ignored local intake:

```bash
npm run prepare:owner-evidence -- --write
```

2. Hash owner-held proof artifacts locally and copy only the returned `proofArtifactHash` values into the local intake:

```bash
npm run hash:owner-evidence-artifacts -- <local proof files>
```

3. Edit `docs/commercialization/commercial-evidence-intake.local.json` locally. Do not commit it.

4. Prefer an environment salt so the salt is not written even to the local JSON:

```bash
export COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held-random-string-at-least-16-characters>"
```

5. Compose redacted records:

```bash
npm run compose:commercial-evidence-records -- --write --require-all
```

6. Verify redacted records:

```bash
npm run verify:commercial-evidence-records -- --evidence docs/commercialization/commercial-evidence-records.local.json --require-all
```

7. Expected result:

- `docs/commercialization/commercial-evidence-records.local.json` is written and remains ignored.
- `acceptedDesignPartnerCount` is at least `3`.
- `acceptedOutcomeCount` is at least `1`.
- The tracked output, if refreshed later by closeout, contains salted hashes only.

### Failure Triage

| Failure | Meaning | Fix |
| --- | --- | --- |
| `hashSalt ... placeholder` | Salt is missing, short, or placeholder-looking | Use a random owner-held salt of 16+ characters |
| `partnerRef must not be a placeholder` | The local intake still uses sample values | Replace with stable owner-held refs |
| `proofArtifactHashes... non-placeholder sha256` | The local intake still uses placeholder or malformed proof artifact hashes | Run `npm run hash:owner-evidence-artifacts -- <local proof files>` on owner-held permission, review, baseline, change, or quote-approval artifacts and copy only the `proofArtifactHash` values |
| `proofArtifactTypes must include...` | The record does not map the claim to required proof categories | Add the required supported proof artifact type labels |
| `rawEvidenceOwnerHeld must be true` | The record does not attest that raw evidence remains owner-held | Confirm raw artifacts stay outside git/chat, then set the field to `true` |
| `designPartnerCommitments must be an array` | JSON shape is wrong | Start from the template and keep arrays |
| Partner/outcome count too low | Fewer than required accepted records | Add three partner commitments and one outcome |

## Final Closeout Sequence

Run this only after the Stripe test checkout, production calibration, authenticated live artifact e2e, live MRR, partner, and outcome gates are all real.

This sequence mirrors `docs/commercialization/owner-evidence-handoff-latest.json#commandSequence` and is guarded by `npm run verify:owner-evidence-runbook-alignment`.

```bash
npm run prepare:owner-evidence -- --write
npm run verify:owner-evidence-local-safety
npm run generate:live-proof-run-packet
set -a; source .env.local; set +a
npm run verify:stripe-test-checkout
npm run verify:production-calibration
npm run verify:commercial-live-auth-e2e
npm run verify:stripe-live-mrr
npm run compose:live-gate-evidence -- --write --allow-partial --output docs/commercialization/live-gate-evidence.local.json
npm run verify:live-gate-evidence -- --evidence docs/commercialization/live-gate-evidence.local.json --require-any
npm run compose:live-gate-evidence -- --write --require-complete --output docs/commercialization/live-gate-evidence.local.json
npm run verify:live-gate-evidence -- --evidence docs/commercialization/live-gate-evidence.local.json --require-complete
npm run generate:commercial-evidence-intake-packet
npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>
COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all
npm run verify:commercial-evidence-records -- --evidence docs/commercialization/commercial-evidence-records.local.json --require-all
npm run generate:manual-wcag-review-packet
npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>
npm run verify:manual-wcag-evidence -- --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete
npm run closeout:owner-evidence -- --write --refresh-tracked --live-evidence docs/commercialization/live-gate-evidence.local.json --commercial-intake docs/commercialization/commercial-evidence-intake.local.json --commercial-evidence docs/commercialization/commercial-evidence-records.local.json --manual-wcag-evidence docs/commercialization/manual-wcag-evidence.local.json
npm run verify:commercial
```

Then run the standard Phase E gates:

```bash
npx tsc --noEmit
npm run lint
npm run verify:report-evidence
npm run verify:owner-evidence-local-safety
npm run verify:secrets
npm run verify:commercial-trust
npm run verify:commercial
```

Commit only tracked redacted artifacts and ledgers:

```bash
git status --short
git add docs/commercialization/stripe-test-checkout-proof-latest.json \
  docs/commercialization/stripe-live-mrr-proof-latest.json \
  docs/commercialization/production-calibration-proof-latest.json \
  docs/commercialization/live-auth-e2e-proof-latest.json \
  docs/commercialization/remediation-external-gates-latest.json \
  docs/commercialization/remediation-external-gates-latest.md \
  docs/commercialization/remediation-completion-audit-latest.json \
  docs/commercialization/remediation-completion-audit-latest.md
git commit -m "chore: attach final owner evidence closeout"
```

Before committing, verify these are not staged:

```bash
git diff --cached --name-only | rg '(^|/)(\\.env|.*\\.local\\.json$)' && exit 1 || true
```

## Stop Conditions

Stop and report blocked if any of these are true:

- Only a live Stripe key is available for the test checkout gate.
- There is no live active subscription and no paid live invoice.
- Partner/outcome refs are placeholders or do not have permission.
- A command would expose secrets in shell history, logs, chat, or tracked files.
- The deployed checkout function would need to be switched to test-mode during live customer traffic without owner approval.
- `npm run verify:secrets` fails after any proof artifact refresh.

## Copy/Paste Prompt For Comet

```text
You are closing Part I owner evidence for the APO Dashboard repo. Work in /Users/sanjayb/Documents/newrepo/career-automation-insights-engine on branch phase-e-commercial-validation. Do not print or commit secrets, raw Stripe payloads, Checkout Session payloads, subscription exports, invoice exports, dashboard screenshots, customer identities, partner names, partner emails, contracts, private quotes, or hash salts.

Follow docs/commercialization/part-i-owner-evidence-blocker-runbook.md exactly. Start by running npm run generate:live-proof-run-packet and use docs/commercialization/live-proof-run-packet-latest.md plus docs/commercialization/live-proof-run-matrix-latest.csv as the owner-held live proof worksheet before running credentialed Stripe/Supabase proof commands. Fix only the remaining gates:
1. Stripe test checkout: use STRIPE_TEST_SECRET_KEY=sk_test_... or STRIPE_TEST_RESTRICTED_KEY=rk_test_..., a matching test-mode STRIPE_TEST_PRICE_ID, a synthetic Supabase Auth user, and ensure the deployed create-checkout-session function creates a test-mode subscription Checkout Session. Run npm run verify:stripe-test-checkout and require status=passed plus ownerEvidenceArchive policy metadata.
2. Live MRR: use STRIPE_LIVE_RESTRICTED_KEY=rk_live_... or STRIPE_LIVE_SECRET_KEY=sk_live_... and require at least one live active recurring subscription plus at least one paid live invoice. Run npm run verify:stripe-live-mrr and require status=passed plus ownerEvidenceArchive policy metadata. Do not simulate revenue.
3. Partner/outcome evidence: run npm run generate:commercial-evidence-intake-packet, use docs/commercialization/commercial-evidence-intake-packet-latest.md and docs/commercialization/commercial-evidence-intake-matrix-latest.csv as the owner worksheet, run npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>, then replace placeholders in docs/commercialization/commercial-evidence-intake.local.json with three permissioned partner refs, one permissioned outcome ref, non-placeholder proofArtifactHashes, required proofArtifactTypes, integrity attestations for marketing use, material connections, incentives/compensation, fake/synthetic testimonial risk, and review gating/suppression, plus ownerEvidenceArchive policy metadata, measured-change unit, measurement window, outcome claim scope, typicality boundary, rawEvidenceOwnerHeld=true, and a non-placeholder owner-held COMMERCIAL_EVIDENCE_HASH_SALT. Run COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all and npm run verify:commercial-evidence-records -- --evidence docs/commercialization/commercial-evidence-records.local.json --require-all.
4. Manual WCAG evidence: run npm run generate:manual-wcag-review-packet, use docs/commercialization/manual-wcag-review-packet-latest.md and docs/commercialization/manual-wcag-review-matrix-latest.csv as the review worksheet, document product scope, sample rationale, sample-selection method, technologies relied upon, complete processes, accessibility-support baseline combinations, reviewer type/conflict boundary, review-record archive attestations, and ownerEvidenceArchive policy metadata, run npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>, then replace placeholder hashes in docs/commercialization/manual-wcag-evidence.local.json with owner-held review artifact hashes and run npm run verify:manual-wcag-evidence -- --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete. Keep raw notes, screenshots, recordings, transcripts, reviewer identity, issue details, evaluation-tool output, sample archives, and artifact hash source maps outside git.
5. Compose and validate complete live-gate evidence with npm run compose:live-gate-evidence -- --write --require-complete --output docs/commercialization/live-gate-evidence.local.json and npm run verify:live-gate-evidence -- --evidence docs/commercialization/live-gate-evidence.local.json --require-complete, then run npm run closeout:owner-evidence -- --write --refresh-tracked --live-evidence docs/commercialization/live-gate-evidence.local.json --commercial-intake docs/commercialization/commercial-evidence-intake.local.json --commercial-evidence docs/commercialization/commercial-evidence-records.local.json --manual-wcag-evidence docs/commercialization/manual-wcag-evidence.local.json, then npm run verify:commercial.

Commit only tracked redacted artifacts and ledgers. Never stage .env.local, docs/commercialization/*.local.json, raw intake, screenshots with private data, or salts.
```

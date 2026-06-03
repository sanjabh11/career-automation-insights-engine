# Part I Owner Evidence Blocker Runbook

Status date: 2026-06-02

Use this runbook when Part I is repo-complete but blocked on owner-held evidence. It is written for an owner or Comet-style assistant working with local credentials. Do not paste secrets, raw Stripe payloads, customer identities, partner names, partner emails, contracts, private quotes, or hash salts into chat or tracked files.

## Current Blockers

| Gate | Current blocker | Must be real | Repo command that proves it |
| --- | --- | --- | --- |
| Stripe test checkout | Local checkout key is live-mode, but the verifier only accepts `sk_test_` or `rk_test_` | A Stripe test-mode Checkout Session created through the deployed `create-checkout-session` function and retrieved from Stripe with `livemode=false` | `npm run verify:stripe-test-checkout` |
| Live MRR > 0 | Stripe live account currently returns zero active subscriptions or zero paid invoice evidence | At least one live active subscription with fixed recurring MRR and at least one live paid invoice with `amount_paid > 0` | `npm run verify:stripe-live-mrr` |
| Partner/outcome evidence | Local intake still has placeholder refs or placeholder salt | Three permissioned partner commitments and one permissioned outcome record, composed into salted hashes only | `npm run compose:commercial-evidence-records -- --write --require-all` |
| Final closeout | The three gates above fail closed | Passing live-gate evidence plus passing commercial evidence records | `npm run closeout:owner-evidence -- --write --refresh-tracked` |

## Official References

- [Stripe API keys](https://docs.stripe.com/keys), as of 2026-06-02: test keys and live keys are mode-specific; live mode is used for real payments.
- [Stripe API authentication](https://docs.stripe.com/api/authentication), as of 2026-06-02: Stripe API keys authenticate server-side API requests; keep secret keys out of public places.
- [Stripe Checkout Sessions](https://docs.stripe.com/api/checkout/sessions), as of 2026-06-02: a Checkout Session represents a customer session for payment or subscription checkout.
- [Stripe create Checkout Session](https://docs.stripe.com/api/checkout/sessions/create), as of 2026-06-02: server-side code creates sessions that redirect to Stripe-hosted checkout.
- [Stripe products and prices](https://docs.stripe.com/products-prices/manage-prices), as of 2026-06-02: use test-mode Prices for test checkouts and live Prices for live subscriptions.
- [Stripe subscriptions lifecycle](https://docs.stripe.com/billing/subscriptions/creating), as of 2026-06-02: a subscription becomes active after the invoice is paid.
- [Stripe list subscriptions API](https://docs.stripe.com/api/subscriptions/list), as of 2026-06-02: used by the local live-MRR verifier to read active subscriptions.
- [Stripe list invoices API](https://docs.stripe.com/api/invoices/list), as of 2026-06-02: used by the local live-MRR verifier to find paid invoice evidence.
- [Supabase Edge Function secrets](https://supabase.com/docs/guides/functions/secrets), as of 2026-06-02: set hosted function secrets in the dashboard or with `supabase secrets set`; do not commit `.env` files.
- [Supabase Edge Function deploy](https://supabase.com/docs/guides/functions/deploy), as of 2026-06-02: functions can be deployed and tested through the Supabase CLI.

## Preflight

1. Confirm the repo branch and working tree:

```bash
git status --short --branch
```

2. Confirm the ignored local evidence files are not staged:

```bash
git check-ignore -v .env.local docs/commercialization/commercial-evidence-intake.local.json docs/commercialization/live-gate-evidence.local.json docs/commercialization/commercial-evidence-records.local.json
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

## Blocker 1: Stripe Test Checkout

Goal: create a real Stripe test-mode Checkout Session through the deployed Supabase Edge Function, retrieve it from Stripe, and write a redacted proof artifact with `livemode=false`.

### Owner Inputs

| Variable | Required value |
| --- | --- |
| `SUPABASE_URL` or `VITE_SUPABASE_URL` | Target Supabase project URL |
| `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY` | Public anon key for the target project |
| `LIVE_SUPABASE_TEST_USER_EMAIL` or `STRIPE_TEST_USER_EMAIL` | Dedicated synthetic Supabase Auth test user |
| `LIVE_SUPABASE_TEST_USER_PASSWORD` or `STRIPE_TEST_USER_PASSWORD` | Password for the synthetic test user |
| `STRIPE_TEST_SECRET_KEY`, `STRIPE_TEST_RESTRICTED_KEY`, or `STRIPE_SECRET_KEY` | Test-mode Stripe key only: `sk_test_...` or `rk_test_...`. Prefer the test-specific names so live-MRR checks can keep using a live key. |
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

6. If this was a production Supabase function that normally uses live Stripe credentials, restore the live function secret after the test proof and re-run any owner-required checkout smoke. Keep the restoration note owner-held.

### Failure Triage

| Failure | Meaning | Fix |
| --- | --- | --- |
| `failed_non_test_stripe_key` | The resolved checkout key is live-mode or malformed | Add `STRIPE_TEST_SECRET_KEY=sk_test_...` or `STRIPE_TEST_RESTRICTED_KEY=rk_test_...`; only use `STRIPE_SECRET_KEY=sk_test_...` for a temporary proof shell |
| `edge-checkout-session-failed` | Supabase function did not return a valid Checkout Session | Check synthetic user auth, function deployment, function secrets, and test Price ID |
| Stripe says the Price does not exist | Test Price is from another account or another mode | Use a test-mode Price from the same Stripe account as the test key and function secret |
| Retrieved session is live-mode | The deployed function probably used a live Stripe key | Reconfigure the deployed function for test-mode proof or run against staging |

## Blocker 2: Live MRR Greater Than Zero

Goal: prove real live recurring revenue exists without exposing customers, subscription IDs, invoice IDs, or raw Stripe payloads.

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
      "redactionLevel": "public_segment_only",
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
      "redactionLevel": "public_quote_approved",
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

2. Edit `docs/commercialization/commercial-evidence-intake.local.json` locally. Do not commit it.

3. Prefer an environment salt so the salt is not written even to the local JSON:

```bash
export COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held-random-string-at-least-16-characters>"
```

4. Compose redacted records:

```bash
npm run compose:commercial-evidence-records -- --write --require-all
```

5. Verify redacted records:

```bash
npm run verify:commercial-evidence-records -- --require-all
```

6. Expected result:

- `docs/commercialization/commercial-evidence-records.local.json` is written and remains ignored.
- `acceptedDesignPartnerCount` is at least `3`.
- `acceptedOutcomeCount` is at least `1`.
- The tracked output, if refreshed later by closeout, contains salted hashes only.

### Failure Triage

| Failure | Meaning | Fix |
| --- | --- | --- |
| `hashSalt ... placeholder` | Salt is missing, short, or placeholder-looking | Use a random owner-held salt of 16+ characters |
| `partnerRef must not be a placeholder` | The local intake still uses sample values | Replace with stable owner-held refs |
| `designPartnerCommitments must be an array` | JSON shape is wrong | Start from the template and keep arrays |
| Partner/outcome count too low | Fewer than required accepted records | Add three partner commitments and one outcome |

## Final Closeout Sequence

Run this only after the Stripe test checkout, production calibration, authenticated live artifact e2e, live MRR, partner, and outcome gates are all real.

```bash
set -a
source .env.local
set +a

npm run verify:stripe-test-checkout
npm run verify:production-calibration
npm run verify:commercial-live-auth-e2e
npm run verify:stripe-live-mrr
npm run compose:live-gate-evidence -- --write --require-complete
npm run verify:live-gate-evidence -- --require-complete
npm run compose:commercial-evidence-records -- --write --require-all
npm run verify:commercial-evidence-records -- --require-all
npm run closeout:owner-evidence -- --write --refresh-tracked
```

Then run the standard Phase E gates:

```bash
npx tsc --noEmit
npm run lint
npm run verify:report-evidence
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
You are closing Part I owner evidence for the APO Dashboard repo. Work in /Users/sanjayb/Documents/newrepo/career-automation-insights-engine on branch phase-e-commercial-validation. Do not print or commit secrets, raw Stripe payloads, customer identities, partner names, partner emails, contracts, private quotes, or hash salts.

Follow docs/commercialization/part-i-owner-evidence-blocker-runbook.md exactly. Fix only the remaining gates:
1. Stripe test checkout: use STRIPE_SECRET_KEY=sk_test_... or rk_test_..., a matching test-mode STRIPE_TEST_PRICE_ID, a synthetic Supabase Auth user, and ensure the deployed create-checkout-session function creates a test-mode Checkout Session. Run npm run verify:stripe-test-checkout and require status=passed.
2. Live MRR: use STRIPE_LIVE_RESTRICTED_KEY=rk_live_... or STRIPE_LIVE_SECRET_KEY=sk_live_... and require at least one live active recurring subscription plus at least one paid live invoice. Run npm run verify:stripe-live-mrr and require status=passed. Do not simulate revenue.
3. Partner/outcome evidence: replace placeholders in docs/commercialization/commercial-evidence-intake.local.json with three permissioned partner refs and one permissioned outcome ref; use a non-placeholder owner-held COMMERCIAL_EVIDENCE_HASH_SALT. Run npm run compose:commercial-evidence-records -- --write --require-all and npm run verify:commercial-evidence-records -- --require-all.
4. Run npm run closeout:owner-evidence -- --write --refresh-tracked, then npx tsc --noEmit, npm run lint, npm run verify:report-evidence, npm run verify:secrets, npm run verify:commercial-trust, and npm run verify:commercial.

Commit only tracked redacted artifacts and ledgers. Never stage .env.local, docs/commercialization/*.local.json, raw intake, screenshots with private data, or salts.
```

# Phase E Commercial Validation Playbook

Status date: 2026-05-31

Phase E does not complete commercial validation. It prepares the instrumentation, partner-review workflow, and proof gates required before any commercial confidence score is raised.

## Evidence Gates

| Gate | Required evidence | Current status | Boundary |
| --- | --- | --- | --- |
| Live MRR > $0 | Stripe live-mode active subscription, payment transaction, and MRR export showing `total_mrr > 0` | Blocked on owner/live payment proof | Test-mode checkout and source code do not prove revenue |
| >=3 committed design partners | Named partners with accepted pilot scope, next step, and contact permission | Manual founder-led work required | A lead, sample download, or polite reply is not commitment |
| Documented outcomes | Permissioned case-study row with baseline workflow, artifact reviewed, outcome, quote, and explicit does-not-prove text | Template and fields prepared | A case study does not prove market-wide demand or career outcomes |
| Bootcamp CTA safe | Runtime has no placeholder price ID, or a real live Stripe price is supplied | Bootcamp checkout hidden pending live price | Hidden CTA does not prove bootcamp demand |

## Redacted Evidence Intake

Use `docs/commercialization/live-gate-evidence-template.json` only as a schema template. Put owner-held, redacted proof metadata in `docs/commercialization/live-gate-evidence.local.json` or pass another path with `LIVE_GATE_EVIDENCE_PATH`; the default local file is ignored by git. Run `npm run verify:live-gate-evidence` before `npm run verify:remediation-gates`.

The evidence file must contain artifact hashes and summary fields only. Do not store Stripe secret keys, Supabase service-role keys, raw Checkout Session payloads, customer emails, auth tokens, partner contact details, or private outcome notes in the repository. The verifier rejects high-confidence secret patterns and only upgrades a live/manual gate when the gate-specific redacted evidence item passes validation.

## Commercial Evidence Records

Use `docs/commercialization/commercial-evidence-records-template.json` only as a schema template. Put redacted founder-held partner and outcome records in `docs/commercialization/commercial-evidence-records.local.json`, pass another path to the standalone verifier with `--evidence`, or set `COMMERCIAL_EVIDENCE_RECORDS_PATH` when running the remediation ledger; the default local file is ignored by git. Run `npm run verify:commercial-evidence-records -- --require-partners`, `npm run verify:commercial-evidence-records -- --require-outcomes`, or `npm run verify:commercial-evidence-records -- --require-all` before relying on `npm run verify:remediation-gates` to mark the partner/outcome gates as externally proven.

The records file must contain hashes, segment labels, permission booleans, artifact reviewed labels, redaction level, and does-not-prove boundaries only. Do not store partner names, emails, phone numbers, contracts, raw notes, private quotes, or customer data in tracked files. A passing verifier proves only the presence of permissioned redacted records; it does not prove revenue, retention, causal impact, market-wide demand, or guaranteed career outcomes.

## Stripe Test Checkout Proof

Run `npm run verify:stripe-test-checkout` only with owner-controlled test credentials. The command signs in a dedicated synthetic Supabase Auth user, calls the deployed `create-checkout-session` Edge Function, retrieves the resulting Checkout Session from Stripe, and requires Stripe to report `livemode=false`. It writes `docs/commercialization/stripe-test-checkout-proof-latest.json` with hashes and redacted metadata only.

Required local or CI secret names:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` or `VITE_SUPABASE_URL` | Target Supabase project URL |
| `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY` | Public key used to sign in the synthetic user |
| `LIVE_SUPABASE_TEST_USER_EMAIL` or `STRIPE_TEST_USER_EMAIL` | Dedicated synthetic test user email |
| `LIVE_SUPABASE_TEST_USER_PASSWORD` or `STRIPE_TEST_USER_PASSWORD` | Dedicated synthetic test user password |
| `STRIPE_SECRET_KEY` | Stripe test-mode secret or restricted key; live-mode keys are rejected |
| `STRIPE_TEST_PRICE_ID` or `APO_STRIPE_TEST_PRICE_ID` | Stripe test-mode Price ID used for the Checkout Session |

Optional variables: `CHECKOUT_TEST_ORIGIN`, `STRIPE_TEST_TIER`, and `STRIPE_TEST_BILLING_PERIOD`. A passing test-mode Checkout Session still does not prove live revenue, webhook fulfillment, report-credit mutation, MRR, or bootcamp demand.

## Live MRR Proof

Run `npm run verify:stripe-live-mrr` only with owner-controlled live-mode Stripe credentials. The command lists live active subscriptions, checks fixed recurring subscription-item prices, looks for paid invoices for active subscriptions, and writes `docs/commercialization/stripe-live-mrr-proof-latest.json` with hashes and redacted metadata only. It does not create charges, refund charges, change subscriptions, store customer identities, or print raw Stripe payloads.

Required local or CI secret names:

| Variable | Purpose |
| --- | --- |
| `STRIPE_LIVE_SECRET_KEY`, `STRIPE_LIVE_RESTRICTED_KEY`, or `STRIPE_SECRET_KEY` | Live-mode Stripe key used for read-only subscription and invoice checks; test-mode keys are rejected |

Prefer a restricted read-only key with access to subscriptions and invoices. Optional variables: `STRIPE_LIVE_MRR_MAX_PAGES` and `STRIPE_LIVE_MRR_CURRENCY`. A passing live-MRR proof still does not prove retention, product-market fit, future revenue, accounting-recognized revenue, webhook fulfillment, or commercial outcomes.

## Production Calibration Proof

Run `npm run verify:production-calibration` only after the target Supabase project already has the approved calibration migrations, the deployed `calibrate-ece` Edge Function, function-level service-role secret, APO logs, and approved expert-assessment rows. The verifier invokes the deployed Edge Function with an anon key, validates that the response used `apo_overall_vs_expert_assessments`, requires ECE to be within `[0,1]`, and requires positive matched prediction pairs, expert rows, reliability bins, and a calibration run id. It writes `docs/commercialization/production-calibration-proof-latest.json` with hashes and redacted metadata only.

Required local or CI secret names:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` or `VITE_SUPABASE_URL` | Target Supabase project URL |
| `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY` | Public key used to invoke the deployed calibration function |

Optional variables: `CALIBRATION_DAYS`, `CALIBRATION_BIN_COUNT`, `CALIBRATION_SOURCE`, and `CALIBRATION_COHORT`. The deployed function itself must have `SUPABASE_SERVICE_ROLE_KEY` configured in Supabase function secrets; do not put service-role values in chat or tracked files. A passing production calibration run still does not prove scientific validity beyond the returned sample, future model performance, employment-decision validity, or partner/revenue traction.

## Activation And Retention Events

Use PostHog funnels and Supabase `analytics_events` exports with the same event contract:

| Event | Use | Boundary |
| --- | --- | --- |
| `search_success` | Search-to-APO funnel | Query strings are redacted/truncated before persistence |
| `activation_apo_result_viewed` | Primary APO activation candidate | Stores occupation code and latency, not private resume/student data |
| `activation_proof_artifact_created` | Coach/commercial artifact activation | Stores artifact type and buyer segment only |
| `commercial_lead_captured` | Consent-backed lead capture signal | Does not prove revenue or commitment |
| `founder_led_pilot_outreach_click` | Manual outreach learning | Clicks do not prove consent or buyer adoption |
| `checkout_completed` | Revenue conversion candidate | Must be reconciled to Stripe live-mode and active subscription state |

## Design-Partner Onboarding

1. Select segment: career coach, career center, workforce board, L&D, or paid pilot.
2. Confirm planning-only use: no hiring, firing, pay, promotion, discipline, layoff, or individual-ranking use.
3. Review an artifact: sample report, cohort proof pack, or role-level CSV audit.
4. Capture feedback: usefulness score, trust objection, missing source, local-data need, and next action.
5. Capture paid signal separately from encouragement.
6. Capture case-study permission and redaction level before using any quote.

## Case-Study Template

| Field | Prompt |
| --- | --- |
| `baseline_workflow` | What workflow existed before the APO proof artifact? |
| `artifact_reviewed` | Which exact artifact did the partner review? |
| `measured_change` | What changed after review? |
| `approved_quote` | What exact quote may be used publicly, and who approved it? |
| `does_not_prove` | Which claims are explicitly unsupported by this case study? |

## Source Anchors

- [PostHog retention docs](https://posthog.com/docs/product-analytics/retention), as of 2026-05-31: retention needs a start event and return event, and cohort sizes must be interpreted explicitly.
- [PostHog funnel docs](https://posthog.com/docs/product-analytics/funnels), as of 2026-05-31: funnels should use clear sequential steps and simple success events before adding optional complexity.
- [PostHog JavaScript docs](https://posthog.com/docs/libraries/js), as of 2026-05-31: identified users and SDK defaults are explicit setup choices.
- [Stripe Checkout Sessions](https://docs.stripe.com/payments/checkout-sessions) and [Stripe test mode](https://docs.stripe.com/test-mode), as of 2026-05-31: Checkout Sessions should reference real Stripe Price objects; test mode or sandbox objects do not prove live revenue.
- [Stripe Subscriptions list API](https://docs.stripe.com/api/subscriptions/list) and [Stripe Invoices list API](https://docs.stripe.com/api/invoices/list), as of 2026-06-01: active subscriptions and paid invoices can be read through the API; this repo stores only redacted proof metadata and hashes.

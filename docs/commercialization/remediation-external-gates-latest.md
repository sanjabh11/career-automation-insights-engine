# Remediation External Gates

Generated: 2026-06-03T08:52:30.104Z
Branch: `phase-e-commercial-validation`
Goal complete: no

This artifact is a non-mutating readiness ledger for the remaining APO Dashboard remediation gates. It records secret presence by variable name only and never stores secret values. It does not apply migrations, deploy functions, create Stripe sessions, query live customer data, or claim commercial validation.

| Gate | Status | Current evidence | Needed evidence |
| --- | --- | --- | --- |
| Phase A truth and claim reconciliation | locally_proven | Completion audit records route/proof-link crawl and forbidden-claim scan. | Keep route crawl and forbidden-claim scan current before merging Phase A. |
| Phase B public calibration/model-card artifacts | locally_proven_with_scope_limit | APO model card, task model card, calibration report, reliability curve, and calibration JSON are present. | Production accuracy still needs live APO logs joined to approved expert assessments. |
| Phase C embedding/runtime smoke path | locally_proven | `smoke:skill-adjacency` is wired to the embedding dimensionality/non-empty adjacency verifier. | Run `npm run smoke:skill-adjacency` after embedding or adjacency code changes. |
| Phase D global-English disclosure/mapping/adapter layer | satisfied_by_mapping_adapter_and_us_basis_disclosure | Global-English source registry, sample crosswalks, static verifier, source-fetch verifier, visible U.S.-basis disclosure, and source-registered local wage/outlook adapter gates are present. | If the product needs local wage values instead of disclosure, import source-dated ONS/Job Bank/JSA rows and test joins before display. |
| Phase E activation/retention/commercial validation instrumentation | locally_proven_with_scope_limit | Commercial validation gates, activation/retention catalog, onboarding checklist, and case-study template are implemented. | Live MRR, committed partners, and permissioned outcomes remain external evidence. |
| Redacted live-gate evidence intake verifier | locally_proven | A non-secret redacted evidence schema, template, and verifier are wired for the remaining credential-gated live proof gates. | Use `docs/commercialization/live-gate-evidence-template.json` as the shape for owner-held proof metadata and validate with `npm run verify:live-gate-evidence`. |
| Real Stripe test-mode checkout | blocked_non_test_stripe_key | Required secret/env names are present, but the resolved Stripe checkout key is not test-mode. Add `STRIPE_TEST_SECRET_KEY` or `STRIPE_TEST_RESTRICTED_KEY`, or temporarily use a test-mode `STRIPE_SECRET_KEY` for this proof run. | Owner-provided Stripe/Supabase test credentials, `STRIPE_TEST_PRICE_ID`, and a successful `npm run verify:stripe-test-checkout` artifact. |
| Production calibration run | ready_for_owner_live_run | Required secret/env names are present; run `npm run verify:production-calibration` only after the target project already has approved migrations, deployed `calibrate-ece`, function secrets, APO logs, and expert labels. | Owner-provided Supabase target URL/anon key, approved deployed calibration function with service-role secret configured in Supabase, live expert-label rows, APO logs, and a successful `npm run verify:production-calibration` artifact. |
| Authenticated live artifact e2e | ready_for_owner_live_run | Required secret/env names are present; run `npm run verify:commercial-live-auth-e2e` with a synthetic test user. | Passing live authenticated synthetic user run for artifact save/delete and deletion receipts. |
| Live MRR greater than zero | ready_for_owner_live_run | Required secret/env names are present; run `npm run verify:stripe-live-mrr` with a live-mode read-only Stripe key to check active subscriptions and paid invoices without printing secrets. | Owner-provided live-mode Stripe restricted/secret key and a successful `npm run verify:stripe-live-mrr` artifact showing active subscriptions, paid invoices, and redacted `total_mrr > 0` evidence. |
| Three committed design partners | blocked_missing_owner_evidence_records | Redacted commercial-evidence record verifier is ready; 0 unique accepted owner-held partner commitment hash(es) are attached. | At least three unique permissioned partner records validated by `npm run verify:commercial-evidence-records -- --require-partners`, with pilot scope, planning-only use, artifact reviewed, next step, and contact permission. |
| Permissioned documented outcomes | blocked_missing_owner_evidence_records | Redacted commercial-evidence record verifier is ready; 0 unique accepted owner-held documented outcome hash(es) are attached. | At least one permissioned outcome record validated by `npm run verify:commercial-evidence-records -- --require-outcomes`, with baseline workflow, artifact reviewed, measured change, quote approval, and does-not-prove text. |

## Remaining Manual Evidence

- Real Stripe test-mode checkout: Owner-provided Stripe/Supabase test credentials, `STRIPE_TEST_PRICE_ID`, and a successful `npm run verify:stripe-test-checkout` artifact.
- Production calibration run: Owner-provided Supabase target URL/anon key, approved deployed calibration function with service-role secret configured in Supabase, live expert-label rows, APO logs, and a successful `npm run verify:production-calibration` artifact.
- Authenticated live artifact e2e: Passing live authenticated synthetic user run for artifact save/delete and deletion receipts.
- Live MRR greater than zero: Owner-provided live-mode Stripe restricted/secret key and a successful `npm run verify:stripe-live-mrr` artifact showing active subscriptions, paid invoices, and redacted `total_mrr > 0` evidence.
- Three committed design partners: At least three unique permissioned partner records validated by `npm run verify:commercial-evidence-records -- --require-partners`, with pilot scope, planning-only use, artifact reviewed, next step, and contact permission.
- Permissioned documented outcomes: At least one permissioned outcome record validated by `npm run verify:commercial-evidence-records -- --require-outcomes`, with baseline workflow, artifact reviewed, measured change, quote approval, and does-not-prove text.

## Redacted Live Evidence Intake

Schema: `2026-05-31.apo-live-gate-evidence.v1`
Template: `docs/commercialization/live-gate-evidence-template.json`
Default local file: `docs/commercialization/live-gate-evidence.local.json`
Current file found: no
Accepted gates: none
Rejected gates: none
Validation errors: 0

The evidence verifier accepts only redacted metadata and owner-held artifact hashes. It rejects high-confidence secret patterns and does not print raw evidence contents.

## Redacted Commercial Evidence Records

Schema: `2026-06-01.apo-commercial-evidence-records.v1`
Template: `docs/commercialization/commercial-evidence-records-template.json`
Default local file: `docs/commercialization/commercial-evidence-records.local.json`
Current file found: no
Accepted design partner records: 0
Unique design partner hashes: 0
Accepted outcome records: 0
Unique outcome hashes: 0
Partner gate satisfied: no
Outcome gate satisfied: no
Validation errors: 0

The commercial evidence verifier accepts only redacted metadata and owner-held artifact hashes. Partner and outcome hashes must be unique. It rejects high-confidence secret and private-contact patterns and does not store partner names, contacts, contracts, private notes, raw quotes, customer data, or revenue amounts.

## Commands

```bash
npm run verify:remediation-gates
npm run verify:remediation-gates:write
```

Use `npm run verify:remediation-gates -- --live-evidence <path> --commercial-evidence <path> --require-complete` only when all external evidence has been attached and you want the read-only command to fail closed until every gate is proven. Use `npm run verify:remediation-gates:write -- --live-evidence <path> --commercial-evidence <path> --require-complete` when you also want to refresh this tracked artifact.

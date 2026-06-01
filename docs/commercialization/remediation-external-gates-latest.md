# Remediation External Gates

Generated: 2026-06-01T00:20:28.858Z
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
| Redacted live-gate evidence intake verifier | locally_proven | A non-secret redacted evidence schema, template, and verifier are wired for the remaining live/manual gates. | Use `docs/commercialization/live-gate-evidence-template.json` as the shape for owner-held proof metadata and validate with `npm run verify:live-gate-evidence`. |
| Real Stripe test-mode checkout | blocked_missing_owner_secret_or_live_evidence | Local checkout code is ready, but required secret/env names are absent: STRIPE_SECRET_KEY, SUPABASE_URL or VITE_SUPABASE_URL, SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY. | Owner-provided Stripe/Supabase test credentials and a successful Checkout Session from `create-checkout-session`. |
| Production calibration run | blocked_missing_owner_secret_or_live_evidence | Calibration code/artifacts are ready, but required secret/env names are absent: SUPABASE_URL or VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. | Approved Supabase migration/deploy, expert-label rows, APO logs, and `calibrate-ece` run output from the target project. |
| Authenticated live artifact e2e | blocked_missing_owner_secret_or_live_evidence | Verifier exists, but required secret/env names are absent: SUPABASE_URL or VITE_SUPABASE_URL, SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY, LIVE_SUPABASE_TEST_USER_EMAIL, LIVE_SUPABASE_TEST_USER_PASSWORD. | Passing live authenticated synthetic user run for artifact save/delete and deletion receipts. |
| Live MRR greater than zero | manual_external_evidence_required | No live Stripe subscription, payment transaction, or MRR export is stored in this repo. | Stripe live-mode and database evidence showing `total_mrr > 0`. |
| Three committed design partners | manual_external_evidence_required | Onboarding checklist exists, but named partner commitments are not stored in this repo. | At least three permissioned partner records with pilot scope, next step, and contact permission. |
| Permissioned documented outcomes | manual_external_evidence_required | Case-study capture template exists, but permissioned outcome records are not stored in this repo. | Permissioned case-study records with baseline workflow, artifact reviewed, outcome, quote approval, and does-not-prove text. |

## Remaining Manual Evidence

- Real Stripe test-mode checkout: Owner-provided Stripe/Supabase test credentials and a successful Checkout Session from `create-checkout-session`.
- Production calibration run: Approved Supabase migration/deploy, expert-label rows, APO logs, and `calibrate-ece` run output from the target project.
- Authenticated live artifact e2e: Passing live authenticated synthetic user run for artifact save/delete and deletion receipts.
- Live MRR greater than zero: Stripe live-mode and database evidence showing `total_mrr > 0`.
- Three committed design partners: At least three permissioned partner records with pilot scope, next step, and contact permission.
- Permissioned documented outcomes: Permissioned case-study records with baseline workflow, artifact reviewed, outcome, quote approval, and does-not-prove text.

## Redacted Live Evidence Intake

Schema: `2026-05-31.apo-live-gate-evidence.v1`
Template: `docs/commercialization/live-gate-evidence-template.json`
Default local file: `docs/commercialization/live-gate-evidence.local.json`
Current file found: no
Accepted gates: none
Rejected gates: none
Validation errors: 0

The evidence verifier accepts only redacted metadata and owner-held artifact hashes. It rejects high-confidence secret patterns and does not print raw evidence contents.

## Command

```bash
npm run verify:remediation-gates
```

Use `npm run verify:remediation-gates -- --require-complete` only when all external evidence has been attached and you want the command to fail closed until every gate is proven.

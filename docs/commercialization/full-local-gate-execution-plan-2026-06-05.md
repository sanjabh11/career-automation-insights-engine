# Full Local Commercial Gate Execution Plan

Generated: 2026-06-05
Status: plan-only, approval required before execution
Workflow: `.dynamic-workflows/commercial-full-local-gate-2026-06-05`

Post-execution supersession note, 2026-06-08: this file is retained as the historical approval-package artifact. The approved full-local verifier was later executed successfully; the canonical current proof is `docs/commercialization/commercial-verification-summary-latest.json`, which records `status=passed`, 78 planned steps, 0 failed steps, and `all_configured_release_gates_included`. The baseline below intentionally preserves the pre-execution approval state required by `npm run verify:commercial-full-local-approval-package`.

## Objective

Move the commercial launch-readiness proof from the default repo-local gate to the stronger optional local gate set by proving:

- accessibility smoke evidence
- full local browser journey evidence
- current public source URL evidence
- launch-evidence source URL alignment
- live closeout access source URL alignment
- production dependency audit status
- final `npm run verify:commercial-full` summary coverage

This phase must not run production deploys, live Supabase/Stripe commands, payment changes, customer outreach, destructive cleanup, credential rotation, or worker execution/export.

## Current Baseline

Current `docs/commercialization/commercial-verification-summary-latest.json` says:

- default core: included and passed
- accessibility smoke: not included
- browser journey: not included
- network and audit: not included
- full local gate: not included
- dynamic workflow executionApproved: false
- launch decision: `pilot-only`
- readiness status: `owner_evidence_required`
- remaining owner/live gates: `manual_wcag_evidence`, `real_stripe_test_checkout`, `live_mrr_gt_zero`, `three_committed_partners`, `documented_outcomes`

## Approval Gate

Do not execute the commands below until the plan-only gate is approved. After approval, run commands in the order shown. Stop on the first nonzero exit unless the failure is explicitly classified as a transient network issue and rerun is approved within the same phase.

## Step 1: Baseline Readback

Command:

```bash
npm run verify:commercial-summary-launch-readiness
```

Pass criteria:

- `ok: true`
- launch decision is `pilot-only`
- expected launch decision is `pilot-only`
- remaining gate IDs match owner closeout and remediation completion ledgers

Failure action:

- Fix summary or ledger alignment only if repo artifacts drifted.
- Do not downgrade or hide owner evidence gates.

## Step 2: Accessibility Smoke

Command:

```bash
npm run verify:commercial-a11y
```

Expected artifacts:

- `docs/commercialization/commercial-accessibility-audit-latest.json`
- `docs/commercialization/commercial-accessibility-audit-latest.md`

Pass criteria:

- route smoke passes for mobile, tablet, and desktop viewports
- generated audit records automated route checks
- manual WCAG review remains explicitly required

Failure action:

- Fix only concrete local UI/test issues: missing landmarks, missing H1, inaccessible control names, focus visibility, overflow, or route rendering failures.
- Do not claim WCAG conformance from this smoke test.

## Step 3: Browser Journey

Command:

```bash
npm run verify:commercial-browser
```

Expected proof:

- local Vite server starts
- Playwright browser launches
- commercial routes render without unhandled page errors
- owner-evidence command checklist mirrors the handoff artifact
- proof-pack interactions and downloads remain claim-bounded

Failure action:

- Fix user-facing route, selector, rendering, download, or local proof-boundary regressions only.
- Do not use this as production uptime, hosted behavior, or owner-held evidence proof.

## Step 4: Network Source Refresh

Commands:

```bash
node scripts/verify-source-manifest.mjs --write
node scripts/verify-launch-evidence-sources.mjs --fetch --write
node scripts/verify-live-closeout-access-sources.mjs --fetch --write
node scripts/generate-launch-evidence-manifest.mjs --write --validate
```

Expected artifacts:

- `docs/commercialization/source-verification-latest.json`
- `docs/commercialization/source-refresh-manifest.md`
- `docs/commercialization/launch-evidence-source-audit-latest.json`
- `docs/commercialization/live-closeout-access-source-audit-latest.json`
- `docs/commercialization/live-closeout-readiness-latest.json`
- refreshed `docs/commercialization/launch-evidence-latest.json`
- refreshed `docs/commercialization/launch-evidence-latest.md`

Pass criteria:

- official source registry pages are reachable or fail with classified source-specific evidence
- launch evidence source URLs match the source-audit artifact
- live closeout access source URLs match Supabase/GitHub official references without proving account access
- launch decision remains `pilot-only`
- gap IDs still match the owner/remediation ledgers

Failure action:

- Separate public-source drift from transient network failure.
- Update source expectations only with current, source-backed evidence.
- Do not weaken or remove source claims to force a green check.

## Step 5: Production Dependency Audit

Command:

```bash
npm audit --omit=dev --audit-level=high
```

Pass criteria:

- exit code 0
- no high or critical production dependency advisories

Failure action:

- Prefer lockfile-level or minimally scoped package upgrades.
- Re-run typecheck, commercial lint, and affected verifiers after any dependency change.
- If an advisory needs a breaking major upgrade, stop and plan the upgrade separately.

## Step 6: Full Local Commercial Gate

Command:

```bash
npm run verify:commercial-full
```

Expected summary evidence:

- `releaseGateCoverage.default_core.includedInThisInvocation: true`
- `releaseGateCoverage.default_core.passedInThisInvocation: true`
- `releaseGateCoverage.accessibility_smoke.includedInThisInvocation: true`
- `releaseGateCoverage.accessibility_smoke.passedInThisInvocation: true`
- `releaseGateCoverage.browser_journey.includedInThisInvocation: true`
- `releaseGateCoverage.browser_journey.passedInThisInvocation: true`
- `releaseGateCoverage.network_and_audit.includedInThisInvocation: true`
- `releaseGateCoverage.network_and_audit.passedInThisInvocation: true`
- `releaseGateCoverage.full_local_gate.includedInThisInvocation: true`
- `releaseGateCoverage.full_local_gate.passedInThisInvocation: true`
- post-summary artifact redaction passes
- post-summary launch-readiness alignment passes

Failure action:

- Fix only the failing lane.
- Rerun focused lane first, then rerun `npm run verify:commercial-full`.
- Preserve `commercialReadinessState.launchDecision: pilot-only` while owner evidence gates remain open.

## Step 7: Final Readbacks

Commands:

```bash
npm run verify:commercial-summary-launch-readiness
git diff --check
node -e "const fs=require('fs'); const s=JSON.parse(fs.readFileSync('docs/commercialization/commercial-verification-summary-latest.json','utf8')); console.log(JSON.stringify({status:s.status,plannedStepCount:s.plannedStepCount,passedStepCount:s.passedStepCount,failedStepCount:s.failedStepCount,releaseGateCoverage:s.releaseGateCoverage,readiness:s.commercialReadinessState}, null, 2));"
```

Pass criteria:

- summary status is `passed`
- no failed steps
- full local gate is included and passed
- readiness status remains accurate
- no tracked diff whitespace errors

## Stop Conditions

Stop and ask before:

- any production deploy
- any live Supabase or Stripe command
- any command requiring owner-held secrets
- any payment change
- any customer outreach
- any destructive file, database, account, or cloud-resource action
- any worker export or worker execution from the dynamic workflow backlog
- any launch-decision upgrade beyond `pilot-only`

## Evidence Boundary

A full-local pass would prove a stronger local and public-source verification surface. It would still not prove owner-held Stripe evidence, live MRR, real Stripe test checkout, three committed partners, documented outcomes, manual WCAG conformance, legal compliance, production uptime, procurement acceptance, or commercial-ready status.

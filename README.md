# Career Automation Insights Engine

As of 2026-06-01, this repository contains the APO Dashboard: a Vite, React, TypeScript, Supabase, Stripe/Whop, and Gemini application for career automation-exposure research and coaching workflows.

The repository is maintained as a reviewable decision-support codebase. Its strongest current signals are active maintenance, pull-request evidence, CI regression gates, data-provenance checks, and redacted commercial proof templates; it does not claim broad adoption, scientific validation, or commercial traction.

The product should be described as a decision-support tool. It estimates automation exposure and transition options from O*NET-centered occupation data, LLM-assisted task analysis, and commercial proof-pack workflows. It does not predict job loss, make employment decisions, certify scientific validity, or prove local labor-market outcomes.

## Repository Presentation

GitHub metadata and public-review framing should stay grounded in what this repository can prove:

| Weak signal | Current handling | Approved framing |
| --- | --- | --- |
| Repository description | The GitHub repository description is set to "Decision-support APO dashboard for career automation exposure, proof-pack review, CI regression gates, and source-labeled workforce data pipelines." | Cite this as scope, not adoption. |
| License visibility | The repository uses MIT licensing in `LICENSE`; GitHub will expose the license field after the license file is present on the default branch. | Say "MIT-licensed source code" only when the current branch or default branch includes `LICENSE`. |
| Stars and popularity | Stars are not used as evidence of maturity or adoption. | Emphasize active maintenance, PR review, CI checks, regression tests, and source-labeled data-pipeline maintenance. |
| External applications | Reviewer-facing copy should be operational rather than promotional. | Focus on how Codex helps reduce maintainer burden across PR review, CI failures, regression coverage, Supabase/Stripe/Gemini integration checks, and data-source refresh work. |

## Current Evidence Boundary

| Area | Current evidence | Boundary |
| --- | --- | --- |
| Frontend app | React routes for occupation search, APO analysis, validation, resources, quality, outcomes, pricing, coach reports, proof-pack gallery, and commercial lead operations. | Route registration and build proof are not the same as live production proof. |
| APO estimates | `calculate-apo` combines Gemini task analysis with deterministic scoring and logs outputs. Phase B calibration artifacts are served from `public/docs`. | Treat scores as decision-support estimates. Local fixture/source-backed calibration artifacts do not prove production calibration against live expert labels. |
| Skill adjacency | `calculate-skill-adjacency` uses `gemini-embedding-001`; `npm run smoke:skill-adjacency` checks embedding dimensionality and non-empty adjacency. | Smoke coverage proves the embedding path, not full occupation-by-occupation adjacency quality. |
| Validation artifacts | APO/task model cards, calibration report, reliability curve, and calibration JSON are served from `public/docs`. | These artifacts document the current method and fixture evidence; they do not certify scientific validity. |
| Commercial proof pack | Report evidence, trust-boundary, data-provenance, and commercial release verifiers exist. | Some verifiers generate timestamped docs; live secrets/payment proof remain owner-controlled. |
| Payments | Stripe subscription price IDs exist for Defender and Coach Pro; bootcamp checkout is hidden with no runtime placeholder price ID. | Live checkout success, live MRR, and bootcamp demand are not proven. |
| Localization | O*NET/BLS-centered U.S. data is the current wage/outlook backbone. Phase D adds 20 sample ESCO, UK SOC, Canada NOC, and Australia ANZSCO mappings plus source-registered UK/Canada/Australia wage/outlook adapter contracts and a visible U.S.-basis disclosure. | UK, Canada, and Australia wage/outlook values are not localized until source-dated adapter joins are imported and validated. |

## Source Anchors

External context used for current claims, as of 2026-05-31:

- Google Gemini embeddings API: https://ai.google.dev/api/embeddings
- ILO Generative AI and Jobs 2025 update: https://www.ilo.org/publications/generative-ai-and-jobs-2025-update
- OpenAI/Eloundou occupational exposure paper: https://openai.com/index/gpts-are-gpts/
- Anthropic Economic Index, January 2026: https://www.anthropic.com/research/anthropic-economic-index-january-2026-report
- WEF Future of Jobs Report 2025: https://www.weforum.org/reports/the-future-of-jobs-report-2025/
- NIST AI Risk Management Framework: https://www.nist.gov/itl/ai-risk-management-framework
- ESCO API: https://esco.ec.europa.eu/en/about-esco/escopedia/escopedia/esco-api
- ONS ASHE occupation earnings dataset: https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/occupation2digitsocashetable2
- Statistics Canada NOC 2021: https://www.statcan.gc.ca/en/subjects/standard/noc/2021/indexV1
- Canada Job Bank wage methodology: https://www.jobbank.gc.ca/trend-analysis/search-wages/wage-methodology
- Canada Job Bank 3-year employment outlook methodology: https://www.jobbank.gc.ca/trend-analysis/search-job-outlooks/outlooks-methodology
- ABS ANZSCO 2022 Australian update: https://www.abs.gov.au/statistics/classifications/anzsco-australian-and-new-zealand-standard-classification-occupations/2022
- Jobs and Skills Australia occupation profiles: https://www.jobsandskills.gov.au/data/occupation-and-industry-profiles/occupations

## What Is Implemented Now

- Vite/React app shell with lazy-loaded routes and shadcn/Tailwind UI.
- Supabase Edge Functions for APO analysis, resume analysis, crosswalk, counselor reports, market intelligence, skill adjacency, bridge roles, and commercial proof-pack flows.
- Postgres migrations for APO logs, O*NET enrichment, calibration scaffolding, expert assessments, monetization, subscriptions, resume proof artifacts, and commercial lead operations.
- Public APO/task model cards, calibration report, reliability plot, and calibration JSON.
- Global-English crosswalk/disclosure scaffolding for O*NET to ESCO, UK SOC, Canada NOC, and Australia ANZSCO sample coverage, plus source-registered UK/Canada/Australia wage/outlook adapter contracts.
- Commercial verifiers for report evidence, secret hygiene, trust boundaries, data provenance, release checks, live Supabase readiness, route smoke, and redacted owner-held evidence records.
- Activation/retention instrumentation, commercial validation gates, design-partner onboarding checklist, and case-study capture template.
- Stripe subscription utilities with real Defender and Coach Pro price IDs.

## What Is Not Yet Proven

- Scientific validation of APO estimates.
- Live production checkout success.
- Live Supabase data coverage for every commercial claim.
- Production calibration against live APO logs and sourced expert-label rows.
- UK/Canada/Australia localized wage and outlook values from source-dated adapter joins.
- Paid customer traction, MRR, or partner outcomes.

## Local Development

```bash
npm install
npm run dev
npx tsc --noEmit
npm run lint
npm run verify:report-evidence
npm run verify:secrets
npm run verify:commercial-trust
```

Some commercial verifiers intentionally regenerate timestamped evidence docs. Use them deliberately in PRs and review generated diffs before committing:

```bash
npm run verify:commercial
```

## Maintenance And Review Focus

| Workflow | Command or artifact | Use |
| --- | --- | --- |
| PR review baseline | `npx tsc --noEmit`, `npm run lint`, `npm run verify:secrets` | Catch TypeScript, lint, and secret hygiene regressions before review. |
| Proof-pack regression | `npm run verify:commercial` | Rebuild commercial evidence ledgers, run trust/data-provenance/build checks, and smoke commercial routes. |
| Runtime smoke | `.github/workflows/phase-c-runtime-smoke.yml`, `npm run smoke:skill-adjacency`, `npm run e2e:smoke` | Keep embedding, APO, crosswalk, checkout, report-export, and proof-boundary flows from drifting. |
| Source/data maintenance | `npm run verify:data-provenance`, `npm run verify:sources` | Track source-labeled artifacts, checksums, and official-source refresh boundaries. |
| Owner-held evidence | `npm run compose:live-gate-evidence`, `npm run compose:commercial-evidence-records` | Convert owner-run proof artifacts or partner/outcome intake into redacted, gitignored local evidence files. |

See `CONTRIBUTING.md` for the pull-request checklist and claim-boundary rules.

## License

MIT. See `LICENSE`.

## Canonical Status

See `STATUS.md` for the active phase ledger, verification baseline, known blockers, and remediation sequence. Older status, summary, completion, and deployment-status documents are archived under `docs/archive/` to avoid conflicting product claims.

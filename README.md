# Career Automation Insights Engine

As of 2026-05-31, this repository contains the APO Dashboard: a Vite, React, TypeScript, Supabase, Stripe/Whop, and Gemini application for career automation-exposure research and coaching workflows.

The product should be described as a decision-support tool. It estimates automation exposure and transition options from O*NET-centered occupation data, LLM-assisted task analysis, and commercial proof-pack workflows. It does not predict job loss, make employment decisions, certify scientific validity, or prove local labor-market outcomes.

## Current Evidence Boundary

| Area | Current evidence | Boundary |
| --- | --- | --- |
| Frontend app | React routes for occupation search, APO analysis, validation, resources, quality, outcomes, pricing, coach reports, proof-pack gallery, and commercial lead operations. | Route registration and build proof are not the same as live production proof. |
| APO estimates | `calculate-apo` combines Gemini task analysis with deterministic scoring and logs outputs. | Calibration against sourced expert assessments is not complete. Treat scores as estimates. |
| Skill adjacency | `calculate-skill-adjacency` and pgvector schema exist. | Phase C must switch embeddings to a dedicated embedding model and add smoke tests. |
| Validation artifacts | Validation UI and calibration tables/functions exist. | No public model cards, ablations report, reliability plot, or calibration PDF is served in Phase A. |
| Commercial proof pack | Report evidence, trust-boundary, data-provenance, and commercial release verifiers exist. | Some verifiers generate timestamped docs; live secrets/payment proof remain owner-controlled. |
| Payments | Stripe subscription price IDs exist for Defender and Coach Pro. | Bootcamp pricing still has a placeholder and must be hidden or replaced before use. |
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
- Global-English crosswalk/disclosure scaffolding for O*NET to ESCO, UK SOC, Canada NOC, and Australia ANZSCO sample coverage, plus source-registered UK/Canada/Australia wage/outlook adapter contracts.
- Commercial verifiers for report evidence, secret hygiene, trust boundaries, data provenance, release checks, live Supabase readiness, and route smoke.
- Stripe subscription utilities with real Defender and Coach Pro price IDs.

## What Is Not Yet Proven

- Scientific validation of APO estimates.
- Live production checkout success.
- Live Supabase data coverage for every commercial claim.
- Public calibration report, reliability plot, or model cards.
- UK/Canada/Australia localized wage and outlook values from source-dated adapter joins.
- Paid customer traction, MRR, or partner outcomes.
- Full lint cleanliness; current baseline lint still fails on existing active, backup, and archived code.

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

## Canonical Status

See `STATUS.md` for the active phase ledger, verification baseline, known blockers, and remediation sequence. Older status, summary, completion, and deployment-status documents are archived under `docs/archive/` to avoid conflicting product claims.

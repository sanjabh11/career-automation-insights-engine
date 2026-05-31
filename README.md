# Career Automation Insights Engine

As of 2026-05-31, this repository contains the APO Dashboard: a Vite, React, TypeScript, Supabase, Stripe/Whop, and Gemini application for career automation-exposure research and coaching workflows.

The product should be described as a decision-support tool. It estimates automation exposure and transition options from O*NET-centered occupation data, LLM-assisted task analysis, and commercial proof-pack workflows. It does not predict job loss, make employment decisions, certify scientific validity, or prove local labor-market outcomes.

## Current Evidence Boundary

| Area | Current evidence | Boundary |
| --- | --- | --- |
| Frontend app | React routes for occupation search, APO analysis, validation, resources, quality, outcomes, pricing, coach reports, proof-pack gallery, and commercial lead operations. | Route registration and build proof are not the same as live production proof. |
| APO estimates | `calculate-apo` combines Gemini task analysis with deterministic scoring and logs outputs. Phase B calibration artifacts are served from `public/docs`. | Treat scores as decision-support estimates. Local fixture/source-backed calibration artifacts do not prove production calibration against live expert labels. |
| Skill adjacency | `calculate-skill-adjacency` uses `gemini-embedding-001`; `npm run smoke:skill-adjacency` checks embedding dimensionality and non-empty adjacency. | Smoke coverage proves the embedding path, not full occupation-by-occupation adjacency quality. |
| Validation artifacts | APO/task model cards, calibration report, reliability curve, and calibration JSON are served from `public/docs`. | These artifacts document the current method and fixture evidence; they do not certify scientific validity. |
| Commercial proof pack | Report evidence, trust-boundary, data-provenance, and commercial release verifiers exist. | Some verifiers generate timestamped docs; live secrets/payment proof remain owner-controlled. |
| Payments | Stripe subscription price IDs exist for Defender and Coach Pro; bootcamp checkout is hidden with no runtime placeholder price ID. | Live checkout success, live MRR, and bootcamp demand are not proven. |
| Localization | O*NET/BLS-centered U.S. data remains the wage/outlook backbone; 20 sample occupations have ESCO, UK SOC, Canada NOC, and Australia ANZSCO mapping coverage with a visible U.S.-basis disclosure. | UK, Canada, and Australia wage/outlook values are not yet localized. |

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
- Jobs and Skills Australia occupation profiles: https://www.jobsandskills.gov.au/data/occupation-and-industry-profiles/occupations

## What Is Implemented Now

- Vite/React app shell with lazy-loaded routes and shadcn/Tailwind UI.
- Supabase Edge Functions for APO analysis, resume analysis, crosswalk, counselor reports, market intelligence, skill adjacency, bridge roles, and commercial proof-pack flows.
- Postgres migrations for APO logs, O*NET enrichment, calibration scaffolding, expert assessments, monetization, subscriptions, resume proof artifacts, and commercial lead operations.
- Public APO/task model cards, calibration report, reliability plot, and calibration JSON.
- Global-English crosswalk/disclosure scaffolding for O*NET to ESCO, UK SOC, Canada NOC, and Australia ANZSCO sample coverage.
- Commercial verifiers for report evidence, secret hygiene, trust boundaries, data provenance, release checks, live Supabase readiness, and route smoke.
- Activation/retention instrumentation, commercial validation gates, design-partner onboarding checklist, and case-study capture template.
- Stripe subscription utilities with real Defender and Coach Pro price IDs.

## What Is Not Yet Proven

- Scientific validation of APO estimates.
- Live production checkout success.
- Live Supabase data coverage for every commercial claim.
- Production calibration against live APO logs and sourced expert-label rows.
- UK/Canada/Australia localized wage and outlook values.
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

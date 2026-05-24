# AI Work Transition Proof Pack Progress

Generated: 2026-05-24
Branch: `commercialization-proof-packs`

## Frozen Execution Goal

Build Career Automation Insights Engine into a source-labeled AI work transition proof-pack platform. The product should help individuals, coaches, career centers, workforce boards, and L&D teams understand task-level AI exposure, skill change, emerging GenAI-era roles, transition actions, and human-review boundaries.

This is not positioned as a layoff predictor, hiring/firing decision system, or Lightcast-level market-intelligence product until licensed market data is integrated.

## Research Checkpoint

| Signal | What It Supports | Product Decision |
|---|---|---|
| [BLS AI employment projections](https://www.bls.gov/opub/mlr/2025/article/incorporating-ai-impacts-in-bls-employment-projections.htm) | AI impact varies by occupation, task, adoption, and institutional context. | Keep task-level exposure, but make caveats visible. |
| [Anthropic Economic Index](https://www.anthropic.com/news/the-anthropic-economic-index) and [labor-market research](https://www.anthropic.com/research/labor-market-impacts) | Observed AI use differs from theoretical capability; task exposure is not automatic job loss. | Separate automatable, AI-assisted, and human-led work. |
| [OECD AI Capability Indicators](https://www.oecd.org/en/publications/introducing-the-oecd-ai-capability-indicators_be745f04-en.html) | Capability indicators can be mapped to task and occupational requirements. | Treat exposure as capability gap analysis, not destiny. |
| [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) | Trustworthy AI requires documentation, measurement, governance, and risk boundaries. | Evidence cards and review states are mandatory for institutional use. |
| [ADA AI hiring guidance](https://www.ada.gov/resources/ai-guidance/) | AI in employment contexts can create discrimination and accessibility risk. | Reports must say they are not employment-decision tools. |
| [WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/) | Accessibility is part of buyer trust and institutional readiness. | A11y verification stays a pre-outreach gate. |
| [Lightcast Talent Transform](https://lightcast.io/products/software/talent-transform-update), [Gloat](https://gloat.com/use-cases-agents/skill-framework-agent/), [Workera](https://www.workera.ai/product-overview) | Commercial competitors emphasize skills, workforce intelligence, and taxonomy depth. | Use open-source proof packs now; keep licensed-data adapters explicit. |

## Adversarial Analysis

| Risk | Loophole | Fix Implemented Or Planned | Confidence After Fix |
|---|---|---|---:|
| Overclaiming job loss | Users may read high exposure as layoff probability. | Evidence cards explicitly state exposure is not job loss, screening, or employment decision proof. | 95% |
| Weak evidence trail | Buyer cannot tell why a claim exists. | Shared evidence card model requires sources, confidence, timestamp, caveat, "does not prove", and review status. | 96% |
| Generic skill advice | Existing app can feel like a calculator, not a transition report. | Proof pack adds skill-change ledger with protect, upgrade, replace, and learn-next actions. | 92% |
| Fake role invention | AI-era roles could look like official occupations. | Role radar labels all entries as emerging signals and caveats non-official status. | 94% |
| Institutional misuse | Workforce buyers could use scores for employee decisions. | Workforce report states role/task-level planning only and requires review for unmapped rows. | 95% |
| Market-data depth gap | Licensed providers have stronger posting data. | Source manifest keeps Lightcast/ESCO as adapter-ready boundaries until licensed data exists. | 91% |
| Review state not persistent enough | HTML report shows review state, but section-level database workflow is still limited. | Current report-level review markers implemented; section-level persistence remains Phase 5. | 84% |
| Browser/a11y proof gap | Static/build proof can miss UI regressions. | Route smoke passes; full browser and a11y gates remain required before outreach. | 86% |

## Progress Chart

| Milestone | Done | Pending | Rating /5 | Move To Next? |
|---|---|---|---:|---|
| Phase 0: Stabilize branch and CI | Clean GitHub checkout, branch, commercial scripts, build gate, route smoke, commercial index, trust/data provenance checks. | Push branch, collaborator invite verification, GitHub CI evidence. | 4 | Yes for local implementation; no for launch. |
| Phase 1: Evidence Card Engine | Shared evidence-card renderer, report integration, NIST source, verifier wired into `verify:commercial`. | Full browser visual proof and CI. | 5 | Yes. |
| Phase 2: Task Exposure Split | Individual, coach, and workforce reports render automatable, AI-assisted, human-led, and emerging task buckets. | O*NET task-time weighting and validated adoption signals. | 4 | Yes for MVP proof pack. |
| Phase 3: Skill Change Ledger | Reports render growing, stable, declining, changing, unknown states and protect, upgrade, replace, learn-next actions. | Live labor-market validation and licensed posting adapters. | 4 | Yes for MVP proof pack. |
| Phase 4: AI-Era Role Radar | 20+ caveated emerging roles mapped to skills, sources, adjacent roles, and confidence. | Posting-level validation and taxonomy crosswalk. | 4 | Yes for MVP proof pack. |
| Phase 5: Human Review Workflow | Evidence cards and reports show review state; workforce CSV rows retain review boundaries. | Section-level reviewer persistence, reviewer identity, client-ready approval workflow. | 3 | Start next. |
| Phase 6: Outreach Pack | Feature/gap analysis exists; sample report routes exist. | Pilot page, LinkedIn assets, coach/workforce artifact bundle, CRM/email workflow. | 3 | Start after Phase 5 core gate. |

## Phase Checklists

| Phase | Exit Checklist |
|---|---|
| 0 | `npm run verify:commercial`, `npm run index:commercial`, `git diff --check`, branch pushed, CI green. |
| 1 | Every commercial report section has source IDs, confidence, timestamp, caveat, "does not prove", and review state. |
| 2 | Reports visibly split work into automatable, AI-assisted, human-led, and emerging task buckets. |
| 3 | Skills show status plus action, and no skill recommendation appears without source and caveat. |
| 4 | Role radar avoids official-occupation claims and every role has caveat, confidence, and source IDs. |
| 5 | Report sections can move through auto-generated, review-required, reviewed, and client-ready states. |
| 6 | Individual, coach, and workforce proof artifacts plus outreach scripts are ready for bounded pilots. |

## Next Execution Focus

1. Persist section-level review status for proof-pack sections.
2. Add a pilot outreach pack route or document bundle that links to individual, coach, and workforce sample artifacts.
3. Run full browser, a11y, source, audit, and GitHub CI gates before external outreach.
4. Add O*NET task-time weighting and local posting validation before making stronger market-intelligence claims.

# Pilot Outreach Pack

Generated: 2026-05-24
Branch: `commercialization-proof-packs`

## Market Position

Category: source-labeled AI work transition proof packs.

USP: not just what AI may automate, but what changes, what grows, what to learn next, what new roles are emerging, and what evidence supports every claim.

Bounded pilot promise: produce reviewed AI work-transition reports for individuals, coaches, career centers, workforce boards, and L&D teams. Do not claim layoffs, hiring decisions, or licensed market-intelligence depth.

## Pilot Offers

Primary gallery route: `/proof-pack-gallery`

Gallery evidence boundary: every buyer path and exported CRM row must carry source IDs, source labels, confidence, caveat, "does not prove", and human-review state. The gallery is a market-test artifact, not proof of live CRM performance, local hiring demand, course/provider endorsement, or provider-backed labor-market intelligence.

| Offer | Buyer | Deliverable | Success Metric | Boundary |
|---|---|---|---|---|
| Individual transition report | Career changer, coach client | One occupation proof pack with task split, skill ledger, role radar, learning/provider boundary, local labor-market appendix boundary, evidence cards, and review state. | User can explain three next actions and three caveats after reading. | Not a guarantee of local hiring, future employment, wage, or training outcome. |
| Coach sample-report bundle | Coach, resume writer, counselor | White-label sample report and client-ready discussion guide. | Coach books 3-5 paid discovery sessions using sample artifact. | Coach review required before client delivery; course/provider choices and local-market claims need separate review. |
| Workforce CSV audit | Workforce board, L&D, HR | CSV role exposure rollup with executive report skeleton and review queue. | Buyer identifies 2-3 safe pilot roles and review owners. | Not employee ranking, employment decision support, local-demand proof, or training-vendor procurement advice. |

## LinkedIn Strategy

| Week | Post Theme | Call To Action |
|---:|---|---|
| 1 | "AI risk is the wrong first question. Task change is the useful one." | Comment with an occupation for a sample task split. |
| 1 | Show one anonymized proof-pack section: task split plus "does not prove" card. | Invite coaches/counselors to review a sample. |
| 2 | "Skills do not just disappear; some need protection, some need upgrading." | Offer a skill-change ledger sample. |
| 2 | AI-era roles as search signals, not official occupations. | Ask workforce leaders which roles need validation. |
| 3 | Workforce board/L&D pilot: CSV role audit with human review boundary. | Invite 3 pilot organizations. |
| 4 | Evidence-first career guidance: sources, caveats, confidence, review state. | Link to sample report and discovery form. |

## Direct Outreach Scripts

### Career Coach

Hi {name}, I am piloting a source-labeled AI work-transition report for career coaches. It separates a client's occupation into automatable, AI-assisted, human-led, and emerging work, then adds a skill-change ledger, caveated AI-era role options, and evidence cards with "does not prove" boundaries. Would you review one sample report and tell me whether it would help your client conversations?

### Workforce Leader

Hi {name}, I am building a workforce CSV audit that summarizes role-level AI exposure without ranking employees or making employment decisions. The output is an executive proof pack with source IDs, caveats, confidence, and review-required rows. Would a small pilot across 10-25 role titles be useful for your planning team?

### Career Center

Hi {name}, I am looking for feedback on an AI work-transition proof pack for students and alumni. It turns occupation data into a reviewed report showing changing tasks, skills to protect or learn next, emerging role signals, and evidence boundaries. Could I send a sample for counselor feedback?

## Top 20 Product Recommendations

| Rank | Recommendation | Common Or Uncommon | Priority | Implementation Potential | Current Status |
|---:|---|---|---|---|---|
| 1 | Evidence cards on every major claim | Uncommon in public calculators | High | High | Implemented |
| 2 | "Does not prove" boundaries | Uncommon | High | High | Implemented |
| 3 | Task exposure split instead of one risk score | Common idea, uncommon presentation | High | High | Implemented |
| 4 | Skill-change ledger with actions | Common in talent platforms, uncommon in public career tools | High | High | Implemented with all five states, per-row confidence, review state, source IDs, and caveats |
| 5 | Human review state per report section | Uncommon | High | Medium | Implemented for rendered reports, artifact metadata, staff section approval UI, final artifact approval event, and non-legal review attestation |
| 6 | AI-era role radar with caveated emerging status | Uncommon | High | High | Implemented with role-level review, taxonomy, posting-validation, search-term, source, and caveat boundaries |
| 7 | Workforce CSV proof pack | Common enterprise need, uncommon bounded proof artifact | High | High | Implemented skeleton |
| 8 | Coach-branded sample report | Common sales tactic | High | High | Implemented skeleton |
| 9 | Privacy and deletion proof | Common enterprise requirement | High | Medium | Partly implemented |
| 10 | Accessibility gate before outreach | Common requirement, often skipped | High | Medium | Scripted and passing locally; expand before enterprise launch |
| 11 | O*NET task-time weighting | Common research need | High | Medium | O*NET 30.3 Task Ratings migration, ingest boundary, runtime weighting helper, and verifier implemented; target Supabase ingest/export checksum pending |
| 12 | BLS/OEWS wage and employment context | Common | Medium | Medium | Adapter-ready |
| 13 | ESCO skill taxonomy crosswalk | Common in EU/global products | Medium | Medium | Adapter-ready |
| 14 | Licensed posting-data validation | Common in paid platforms | Medium | Low until licensed | Pending |
| 15 | Reviewer identity and approval audit log | Common institutional workflow | High | Medium | Implemented as section/final artifact events plus downloadable review attestation; live Supabase application pending |
| 16 | Local labor-market proof appendix | Uncommon for public tools | Medium | Medium | Implemented as source-labeled appendix boundary; buyer-selected local snapshots pending |
| 17 | Course/provider recommendation boundary | Common | Medium | Medium | Implemented as source-labeled learning/provider boundary; live provider catalog and outcome validation pending |
| 18 | Cohort reporting for career centers | Common institutional need | Medium | Medium | Pending |
| 19 | CRM/email automation for leads | Common commercial need | High | High | Source-labeled CRM-import CSV implemented; live CRM/email sync pending |
| 20 | Public sample gallery by occupation | Common marketing pattern | Medium | High | Implemented as `/proof-pack-gallery` with outreach evidence cards; deployed-domain analytics pending |

## Common Recommendations

Skills taxonomy, task-level exposure, workforce dashboards, reports, lead capture, CRM follow-up, accessibility, source citations, and enterprise governance are common buyer expectations.

## Uncommon Differentiators

The strongest differentiators are the combination of evidence cards, explicit "does not prove" boundaries, caveated emerging-role radar, human-review state, and proof-pack artifacts for both coach and workforce buyers.

## Outreach Readiness Checklist

| Gate | Required Before Outreach | Status |
|---|---|---|
| Core commercial gate | `npm run verify:commercial` | Passing locally |
| Evidence verifier | `npm run verify:report-evidence` | Passing locally |
| Browser journey | `npm run verify:commercial-browser` | Passing locally |
| Accessibility smoke | `npm run verify:commercial-a11y` | Passing locally |
| Source refresh | `npm run verify:sources` | Passing locally |
| Security audit | `npm audit --omit=dev --audit-level=high` | Passing locally |
| Sample gallery | `/proof-pack-gallery` with source-labeled evidence cards and CRM CSV export | Implemented locally |
| GitHub CI | Hardened workflow template, pushed branch, and hosted workflow run | Template ready; workflow installation and hosted run pending GitHub auth with `workflow` scope |

# Commercialization Gap Analysis and Marketable Feature Plan

Date: 2026-05-24
Branch: `commercialization-proof-packs`
Scope: Career Automation Insights Engine, clean GitHub checkout

## Executive Positioning

The strongest commercial wedge is not "generic AI career advice." The product is more sellable as a source-labeled automation exposure and career transition intelligence platform for three buyer groups:

1. Career coaches, resume writers, and education counselors who need white-label client reports.
2. Workforce leaders who need role-level AI exposure audits before reskilling investments.
3. Individuals who need explainable occupation, resume, and skill transition guidance.

The repo already has useful assets for this positioning: occupation risk pages, sample reports, coach pages, resume analyzer, counselor reports, enterprise dashboard, skill adjacency, bridge roles, and responsible AI pages. The commercialization gap is that these surfaces need stronger persistence, source provenance, auditability, buyer-specific workflows, and claim discipline.

## 90% Confidence Loop

Current confidence: **95% for the bounded proof-pack commercialization strategy after the latest loophole fixes**, not for a full enterprise talent-intelligence platform claim.

This confidence is factual only under these boundaries:

1. The first sellable product is a **source-labeled automation exposure proof pack** for coaches and workforce pilots.
2. Marketing avoids saying the product predicts layoffs, replaces HR judgment, or is already equivalent to Lightcast/Eightfold/Gloat/SkyHive/Reejig.
3. Reports keep visible source versions, confidence, caveats, deletion/privacy messaging, and employment-decision disclaimers.
4. Paid pilots stay narrow: coach sample reports, SEO report lead capture, and workforce CSV audit review.

Loop findings and fixes:

| Loop | Loophole found | Fix applied or required | Confidence after fix |
|---:|---|---|---:|
| 1 | Strategy relied on O*NET/BLS/WEF but missed newer observed-AI-use and task-capability research. | Added Anthropic Economic Index, OpenAI GDPval, and BLS AI Monthly Labor Review to the source manifest and verification gate. | 82% |
| 2 | Risk of overclaiming "world-class" before enterprise-grade integrations, browser e2e, and licensed labor-market data exist. | Reframed claim to "bounded, source-labeled proof-pack pilot" until integrations, CI, browser tests, and provider adapters are verified. | 87% |
| 3 | Enterprise competitors already sell broad skills/talent operating systems. | Wedge narrowed away from full HCM replacement toward faster explainable artifacts for coaches, career centers, workforce boards, and mid-market L&D. | 90% |
| 4 | Current app still has local/runtime and GitHub-auth blockers. | Kept blockers explicit: GitHub push/invite needs re-auth, Supabase local DB lint needs local Postgres, full repo lint remains legacy-failing. | 90% bounded confidence |
| 5 | 2026 competitors emphasize skill graphs, HRIS/LMS integrations, automated taxonomy harmonization, policy workflows, and audit trails. | Kept first wedge away from full skills-intelligence platform scope; added observed-exposure and accessibility/employment guidance sources so report claims stay planning-only. | 90% bounded confidence |
| 6 | Offline lead fallback could preserve too much report content on a local browser. | Changed local retry queue to redact full report HTML, expire entries after seven days, and retry lead persistence after a later successful capture. | 91% bounded confidence for pilot outreach |
| 7 | Consent capture lacked a clear privacy-policy destination. | Added `/privacy` route and linked it from SEO report and coach sample consent copy. | 91% bounded confidence for pilot outreach |
| 8 | Route smoke did not prove the rendered app survived missing Supabase env vars. | Hardened the Supabase client to warn instead of throwing, verified public commercial routes in Browser, and added `npm run verify:commercial-trust` as a repeatable guardrail. | 92% bounded confidence for public pilot pages |
| 9 | Codebase indexing was still manual and could drift as commercial routes and RPCs changed. | Added `npm run index:commercial`, which regenerates Markdown and JSON indexes from actual route, script, source-manifest, and Supabase migration files. | 93% bounded confidence for repo-operational readiness |
| 10 | Browser proof still depended on manual notes rather than a committed repeatable commercial journey test. | Added `npm run verify:commercial-browser` with Playwright checks for privacy, coach sample report consent/popup/offline redaction, SEO report consent/popup/offline redaction, and workforce CSV audit parsing. | 94% bounded confidence for commercial pilot readiness |
| 11 | Local seed data and source/provenance code could drift without hash-level evidence. | Added `npm run verify:data-provenance`, which hashes the WEF economics CSV, occupation-risk seed, O*NET ingest boundary, source manifest, and report provenance renderer. | 95% bounded confidence for proof-pack data discipline |
| 12 | Accessibility and responsive proof could still be claimed from intent rather than rendered commercial-route evidence, and automated smoke could be mistaken for WCAG conformance. | Added `npm run verify:commercial-a11y`, which checks commercial routes across mobile, tablet, and desktop for one H1, a main landmark, horizontal overflow, accessible control names, and visible keyboard tab stops. The gate now writes `commercial-accessibility-audit-latest.md/json` with WCAG 2.2/WCAG-EM/WAI references, a manual checklist, and an explicit non-conformance boundary. Fixed `/for-coaches`, `/enterprise-dashboard`, resume upload, and progress-bar overflow issues found by the gate. | 95% bounded confidence with stronger commercial UX proof |
| 13 | Task exposure weighting could quietly imply live O*NET Task Ratings even when only local schema and seed proxies are verified. | Added `npm run verify:onet-task-ratings-live`, a non-mutating deployed Supabase proof gate that fails on missing Task Rating columns or missing ingested O*NET 30.3 rating rows. | 95% bounded confidence with explicit no-live-rating-claim boundary |

Confidence should drop below 90% again if the positioning expands to "enterprise talent operating system," if report claims omit source caveats, or if paid outreach starts before lead persistence and artifact delivery have been verified in the target deployment.

## Market Context

The market is already crowded with enterprise skills intelligence, talent marketplaces, and labor-market data providers. The app should avoid competing head-on with full HCM suites. It should sell a narrower, faster, more explainable "automation exposure proof pack" that plugs into coaching, education, and workforce planning workflows.

Reference landscape:

| Segment | Examples | Implication for this app |
|---|---|---|
| Labor-market and skills data | Lightcast, BLS, O*NET, ESCO | Compete by combining open/public data with transparent source labels and coach/workforce artifacts. |
| Enterprise talent intelligence and work-architecture platforms | Eightfold, SkyHive/Cornerstone, Gloat, Reejig | Avoid full talent operating system scope; focus on explainable audit packs and transition reports. |
| Career coaching and reskilling | FutureFit AI, LinkedIn Learning, Coursera, Guild-style pathways | Differentiate with occupation automation risk, bridge roles, and white-label coach outputs. |
| AI governance and HR risk | NIST AI RMF, EEOC AI/employment guidance, ISO/IEC 42001-style management systems | Make disclaimers, source confidence, deletion proof, and human review visible in every sellable report. |
| AI work exposure research and capability benchmarks | Anthropic Economic Index, OpenAI GDPval, BLS AI Monthly Labor Review | Use these to improve claim discipline: observed AI use and task capability are not the same as job displacement. |

Fresh market refresh notes from the May 2026 web check:

- O*NET Resource Center lists **O*NET Database 30.3** as the current production release in May 2026; O*NET Web Services API v2.0 remains the correct integration surface for registered developer access.
- BLS OEWS tables now expose **May 2025** wage/employment estimates, released in May 2026, while BLS API access remains a separate series API rather than a direct substitute for OEWS table ingestion.
- W3C WCAG 2.2 is the current accessibility target, with new criteria such as focus-not-obscured, target size, redundant entry, and accessible authentication that matter for commercial lead/report flows.
- NIST AI RMF remains the right governance scaffold, and its April 2026 critical-infrastructure profile concept note makes the workforce/utility-sector caveat especially relevant for enterprise pilots.
- Eightfold's public Forrester Q1 2026 page confirms the skills-intelligence category is active and crowded, with buyer criteria around skills inference, ontology management, agentic AI, and explainable models.
- Lightcast, Gloat, and Workera public positioning shows that enterprise buyers expect labor-market data depth, skills graphs, HRIS/LMS integrations, verified skills evidence, and ROI/readiness workflows. This strengthens the case for a narrow proof-pack wedge rather than a full HCM replacement.
- OECD Skills Outlook 2025 emphasizes agile, data-driven lifelong learning and says modernized career guidance can help close information gaps and channel people toward training.
- Lightcast's AI skills outlook and documentation reinforce that job-posting intelligence is updated much faster than traditional labor data, but needs source, deduplication, taxonomy, and revision caveats.
- Bipartisan Policy Center's May 2026 AI skills dashboard analysis reports rapidly growing AI-skills demand across geographies and non-tech sectors, which supports a sellable "what skills are changing" product wedge.
- LINC Pro and NexPath-style career guidance products show that evidence-based assessments, O*NET/ESCO grounding, advisor oversight, privacy-first design, and personalized roadmaps are now table stakes for serious career guidance tools.

## Top 10 Sellable Features

| Rank | Feature | Buyer | Confidence | Current state | What makes it sellable | Gap to best-in-class |
|---:|---|---|---:|---|---|---|
| 1 | White-label coach sample reports | Coaches, resume writers | 95% | `/sample-report`, `/for-coaches` exist and now include source caveats | Fast demo-to-paid pilot path | Add saved coach accounts, logo/theme upload, report credits, client history, Stripe pricing. |
| 2 | Supabase-backed SEO report lead capture | Individuals, coaches | 95% | Implemented in `SEOReportDownload` with Supabase fallback, stable report artifact IDs, staff lead ops route, consent capture, privacy link, and redacted retry queue | Converts organic occupation traffic into commercial leads | Add email workflow, CRM integration, and deployed-domain validation. |
| 3 | Workforce CSV exposure audit | HR, L&D, workforce planners | 93% | Audit builder added to enterprise dashboard with staff-gated Supabase save/load, SOC/O*NET review queue, broader deterministic local suggestions, confidence-banded coverage, and downloadable executive HTML report | Simple enterprise wedge without HRIS integration first | Add full O*NET-backed candidate index, signed PDF/storage delivery, and department recommendations. |
| 4 | Source provenance and caveat registry | All buyers | 95% | Shared source manifest and registry added for O*NET, BLS EP/OEWS/LAUS/QCEW, CareerOneStop-ready, Census ACS-ready, WEF, Anthropic Economic Index, Anthropic observed exposure, OpenAI GDPval, BLS AI MLR, WCAG 2.2, ADA AI hiring guidance, ESCO-ready, Lightcast-ready, SerpAPI-ready, LLM output, plus live proof gates for commercial Supabase objects and O*NET Task Ratings rows | Builds trust and reduces overclaim risk | Add automated refresh jobs, exported-table checksums, per-score evidence cards, local-market snapshots, and imported benchmark adapters only when terms allow. |
| 5 | Resume-to-automation risk analyzer | Individuals, coaches | 91% | Existing route with deletion receipts, redacted proof artifacts, and a server-side upload parser boundary for validated non-persistent receipts | Strong viral/free tool and coach upsell | Live parser deployment, production PDF/DOC/DOCX extraction, malware-scan policy, bias testing, and exportable client packet. |
| 6 | Bridge role and skill transition planner | Individuals, education, workforce | 92% | Existing routes/components in repo | Converts risk insight into action | Add pathway confidence, program/course matching, local labor demand, time/cost estimates. |
| 7 | Counselor report generator | Schools, workforce boards, coaches | 92% | Route now includes client report generation plus downloadable aggregate-only career-center cohort proof pack with FERPA-style privacy, NACE outcome boundary, source-labeled evidence cards, and CSV/HTML exports | Institutional buyer wedge | Add live batch consent, approved roster import, small-cell suppression policy, artifact persistence, and source-labeled PDF. |
| 8 | Responsible AI and employment decision guardrails | Enterprise, institutional buyers | 94% | Responsible AI pages and new report notices exist | Required for serious HR/workforce conversations | Add policy checklist, audit logs, model cards, accessibility conformance notes. |
| 9 | Occupation/industry SEO risk pages | Organic growth | 93% | Many routes already exist | Low-cost inbound acquisition | Add fresh data refresh, structured schema, canonical report download, conversion experiments. |
| 10 | Skill adjacency and market signal overlays | Workforce, education, individuals | 90% | Existing graph/tooling, data adapters partially present | Differentiates beyond simple risk score | Add ESCO/Lightcast adapter, job posting signals, confidence scoring, stale-data warnings. |

## Current vs Needed Gap Analysis

| Capability | Current evidence in repo | Needed for commercial readiness | Priority |
|---|---|---|---|
| Lead capture | Supabase `commercial_leads` migration, deduping capture RPC, consent text/timestamp fields, client helper, stable artifact IDs, staff-gated ops route, CSV export, staff artifact open/download action, privacy link, and redacted browser retry queue added | Email automation, CRM integration, deployed-domain validation | High |
| Report persistence | Client-rendered report HTML can be stored as stable `commercial_report_artifacts` records, linked to leads, opened by staff from lead ops, logged through visible staff delivery/review events, and bundled into a downloadable proof-pack delivery packet with attestation, event history, source IDs, hashes, and decision boundaries | Signed storage URLs, PDF export, resend workflow, and richer delivery analytics | High |
| Coach workflow | Sample report generator, coach page, saved preview branding, brand colors/footer/contact fields, and optional Supabase lead/artifact capture added | Authenticated white-label account settings, client roster, report-credit fulfillment loop, logo upload | High |
| Career-center cohort reporting | Counselor route includes an aggregate-only cohort proof pack with segment rows, privacy/outcome boundaries, evidence cards, and downloadable HTML/CSV exports | Live batch consent, approved roster import, small-cell suppression policy, staff persistence, and institution-specific outcome evidence | Medium |
| Workforce audit | CSV audit skeleton, staff-gated saved imports, role rows, unmapped review queue, broader local deterministic SOC suggestions, confidence-banded suggestion coverage, visible suggestion-catalog count, and downloadable executive HTML report added | Full O*NET-backed candidate ranking, signed PDF/storage delivery, department recommendations | High |
| Provenance | Shared source manifest and report registry added with verified source versions, timestamps, confidence, caveats, claim boundaries, `npm run verify:sources` official-page checks, `npm run verify:data-provenance` local artifact checksums, `npm run verify:resume-parser-live` for deployed parser receipt proof, and `npm run verify:onet-task-ratings-live` for deployed O*NET Task Ratings schema/row proof. Source coverage now includes O*NET, BLS EP/OEWS/LAUS/QCEW, CareerOneStop-ready, Census ACS-ready, WEF, Anthropic Economic Index, Anthropic observed exposure, OpenAI GDPval, BLS AI MLR, WCAG 2.2, ADA AI hiring guidance, EEOC employment-selection guidance, CFPB employment algorithmic score circular, ESCO, NIST, Lightcast-ready, SerpAPI-ready, and LLM output. | Scheduled source freshness checks, live imported-table checksums from Supabase exports, score-level evidence citations, local-market snapshot storage, and imported Anthropic/OpenAI benchmark adapters only when licensing/terms allow | High |
| Data breadth | O*NET-centered with BLS/WEF/ESCO/Lightcast/SerpAPI-ready registry, plus local/live gates that separate O*NET Task Ratings readiness from live deployed row proof. The latest live O*NET proof shows target `kvunnankqgfokeufvsrv` missing the Task Ratings metadata columns. | Actual O*NET Task Ratings migration/ingest in target Supabase, exported checksums, ESCO mapping, BLS/OEWS refresh, licensed Lightcast/job-posting adapter | High |
| Trust/compliance | Resume deletion receipt RPC/table, UI receipt display, raw-text redaction metadata, source/caveat boundary, employment decision disclaimers, resume analysis proof-pack metadata, resume evidence cards, parser boundary display, authenticated user-owned redacted resume proof artifact persistence with deletion receipts, non-mutating live Supabase deployed-object proof gate, dedicated live parser receipt verifier, redacted latest-attempt artifacts, hashed live Supabase deployment runbook/packet, non-legal proof-pack delivery packet, downloadable institutional readiness packet with risk rows, AI RMF controls, WCAG gate, employment-decision boundary, evidence cards, caveats, and next actions, plus a generated WCAG 2.2 accessibility audit packet with WCAG-EM/manual-review boundary added | Target Supabase migrations are not yet applied according to the live proof artifact; after credentialed migration application and function deploy, add authenticated live e2e proof for staff review, resume deletion, parser receipts, and redacted artifact save/delete, plus completed manual WCAG evidence, buyer acceptable-use signoff, and buyer-specific EEOC/ADA/FCRA review before employment-adjacent institutional delivery | High |
| Resume parsing | Browser text/paste route with warning; saved analysis deletion now returns a bounded app-level receipt; `parse-resume` validates uploaded files server-side with extension, size, signature, and non-persistence controls; `analyze-resume` links parser receipts into source-labeled proof metadata; UI displays parser/readiness caveats, parser receipt details, downloadable resume work-transition proof report, redacted signed-in proof artifacts, and bounded rewrite drafts; `npm run verify:resume-parser-live` checks deployed text, PDF-adapter-pending, and unsupported-file receipt behavior when credentials exist | Deploy `parse-resume`/`analyze-resume` in target Supabase, run live redacted-artifact/deletion/parser e2e proof, add dedicated PDF/DOC/DOCX parser adapter, malware-scan policy, and institution-specific consent workflow before storing detailed resume rows | Medium |
| Revenue operations | Pricing and monetization tables exist | Working purchase flow for report credits, invoices, fulfillment states | Medium |
| Analytics | PostHog events exist | Funnel dashboards for coach report, SEO report, enterprise audit | Medium |
| Quality gates | Build passes; focused lint on touched files passes; `npm run verify:commercial` orchestrates commercial index, trust, deployment packet, data provenance, scoped lint, production build, and route smoke; `npm run verify:commercial-a11y` covers responsive/accessibility smoke and writes `commercial-accessibility-audit-latest.md/json`; `npm run verify:commercial-browser` exercises privacy, coach sample, SEO report, and workforce CSV audit journeys; `npm run verify:commercial-deployment` generates the credential-gated Supabase deployment packet; `npm run verify:resume-parser-live` gates deployed parser receipt claims; `npm run verify:onet-task-ratings-live` gates deployed O*NET Task Ratings claims; `.github/workflows/commercial-proof-pack.yml` uses Node 24-compatible action wrappers with Node 20 retained as the app test runtime | Repo-wide lint cleanup, full visual snapshots, completed manual WCAG conformance evidence, live O*NET/BLS table checksum exports, and recurring hosted CI drift monitoring after each push | Medium |
| Codebase index | `npm run index:commercial` generates `commercialization-codebase-index.md` and `.json` from actual routes, package scripts, source registry IDs, and commercial Supabase SQL objects | Extend index to cover deployed URL evidence, CI artifacts, and billing fulfillment state after push/deploy access is restored | High |
| Outreach assets | Product pages, sample outputs, proof-pack gallery, CRM CSV, and institutional readiness packet exist | Live LinkedIn campaign tracking, demo deck, case-study template, buyer-specific landing pages, and deployed-domain analytics | Medium |

## Top 20 Recommendations From Two Research Tracks

Research Track A: market and buyer research.

1. Lead with "automation exposure proof packs," not generic career guidance.
2. Package a coach pilot: 10 white-label reports, branded sample, email support, and feedback call.
3. Package a workforce pilot: CSV upload, role exposure rollup, unmapped SOC review, and executive memo.
4. Keep enterprise scope narrow until audit artifacts are repeatable.
5. Use bounded language: "planning signal," "pilot," "source-labeled," and "human-reviewed."
6. Build trust as a feature: source versions, caveats, confidence, deletion proof, and human review.
7. Add ESCO for international expansion but keep U.S. reports tied to SOC/O*NET/BLS first.
8. Add Lightcast or job posting data only after a licensed/compliant adapter is ready.
9. Use LinkedIn founder-led content to validate demand before heavy feature expansion.
10. Create buyer-specific demos that separate observed AI use, model capability, and employment outcomes instead of one broad homepage.

Research Track B: codebase and product research.

11. Move build/deploy tools out of runtime dependencies.
12. Keep `npm audit --omit=dev --audit-level=high` clean before outreach.
13. Keep report artifact generation in one shared provenance framework.
14. Convert local-only report flows to persisted Supabase flows.
15. Add database-backed workflow state before adding more UI pages.
16. Add route-level smoke tests for commercial routes.
17. Add a source refresh manifest before claiming current O*NET/BLS versions in every row.
18. Add e2e checks for lead capture, report generation, workforce CSV parsing, and deletion proof.
19. Create a data-provider adapter boundary before integrating paid data.
20. Reduce repo-wide lint debt gradually, starting with commercial routes and shared libraries.

## Common and Uncommon Recommendations

Common across both tracks:

| Recommendation | Why it matters |
|---|---|
| Narrow the first commercial wedge | Avoids competing directly with full HCM/talent platforms. |
| Make source provenance visible | Builds trust and supports regulated buyer conversations. |
| Convert reports into persisted artifacts | Enables sales follow-up, support, billing, and evidence. |
| Keep claims bounded | Reduces legal, HR, and credibility risk. |
| Add buyer-specific pilots | Makes outreach concrete and measurable. |
| Keep production vulnerability gate clean | Required before serious commercial outreach. |
| Separate observed AI use, AI capability, and employment outcomes | Prevents misleading automation-risk claims. |

Uncommon but differentiating:

| Recommendation | Differentiation potential |
|---|---|
| Deletion proof for resume analyses | Strong trust signal for coaches and job seekers. |
| Unmapped SOC review queue for workforce CSVs | Implemented as a staff workflow so messy HR data is reviewable without pretending full automation. |
| Source-level confidence per report section | More defensible than a single opaque risk score. |
| Dual benchmark framing with Anthropic Economic Index plus OpenAI GDPval | Explains both observed AI-use patterns and frontier capability progress without collapsing them into one score. |
| Coach-branded pilot packets | Faster sales path than building a full subscription suite first. |
| Learning/provider recommendation boundary | Lets the product say what to learn next without pretending to endorse courses, vendors, credentials, or job outcomes. |
| Local labor-market proof appendix | Lets the product discuss local context while separating OEWS, LAUS, QCEW, ACS, CareerOneStop, postings, and licensed-data boundaries. |
| Aggregate career-center cohort pack | Turns student/alumni cohort needs into a privacy-bounded workshop and advising artifact instead of an individual ranking tool. |
| Data-provider adapter boundary | Lets the app expand beyond O*NET without locking into one vendor. |

## Prioritized Implementation Backlog

| Priority | Feature | Implementation potential | Proof of completion |
|---|---|---:|---|
| High | Lead admin and CRM export | High | Staff-only Supabase RPCs, table view, consent visibility, CSV export, report artifact open/download action, privacy route, redacted retry queue, route smoke. |
| High | Coach white-label sample artifacts | High | Browser-saved brand name, colors, contact/footer settings reflected in sample report HTML; optional coach email saves the sample lead and artifact to Supabase lead ops. |
| High | Workforce audit persistence and executive artifact | High | Staff-only Supabase RPCs store CSV source, role rows, audit metrics, and reload list; audit builder exports a source-labeled executive HTML report with SOC review queue and decision-boundary disclaimers. |
| High | Report artifact storage | High | Stable report artifact ID generated for SEO report downloads, linked to captured leads, retrievable by staff, logged on staff open/download, visible in lead ops history, and downloadable as a reviewed proof-pack delivery packet after attestation. |
| High | Source refresh and data checksum manifests | Medium | Shared source manifest module plus `npm run verify:sources` official-page evidence, `npm run verify:data-provenance` local artifact checksums, and `npm run verify:onet-task-ratings-live` deployed schema/row proof; next add schedule and live Supabase table checksums. |
| High | Commercial route smoke and e2e tests | Medium | `npm run smoke:commercial` covers route registration and HTTP app-shell responses; `npm run verify:commercial-browser` covers commercial browser interactions, report popups, consent gating, offline redaction, and workforce CSV parsing; `npm run verify:commercial-a11y` covers responsive/accessibility smoke across key commercial routes. |
| High | Commercial trust-boundary verifier | High | `npm run verify:commercial-trust` checks Supabase-env fallback, privacy routing, consent privacy links, offline queue redaction, and expanded source guardrail registration. |
| High | Commercial codebase index | High | `npm run index:commercial` generates route/module/RPC/source/verification maps as Markdown and JSON for handoff and drift control. |
| High | Commercial release orchestrator and CI workflow | High | `npm run verify:commercial` runs the core local commercial proof gate; `.github/workflows/commercial-proof-pack.yml` is installed with read-only permissions, Node 24-compatible action wrappers, Playwright a11y/journey gates, and manual/scheduled source/audit checks. Hosted push and manual runs are verified for the current branch and must be re-inspected after each future workflow-affecting push before claiming CI-green status. |
| High | Institutional readiness packet | High | Proof-pack gallery exports an HTML trust packet and CSV risk register with AI RMF controls, WCAG 2.2 gate, employment-decision boundary, live proof blockers, evidence cards, source IDs, confidence, caveats, review state, and next actions. |
| Medium | Server-side resume parser | Medium | `parse-resume` accepts multipart file uploads, enforces a 2MB cap, validates extension/signature, extracts only UTF-8 text in memory, returns a non-persistence receipt, and leaves PDF/DOC/DOCX as `parser_adapter_pending`; `analyze-resume` carries the receipt into evidence cards and parser boundaries. |
| Medium | Career-center cohort persistence | Medium | Approved roster import, aggregate segment builder, small-cell suppression, counselor review notes, and saved cohort proof-pack artifacts. |
| Medium | Deterministic SOC suggestion service | Medium | Review queue shows ranked local O*NET/SOC candidates before staff approval, with expanded common-role seeds and 50%/75% confidence coverage in the executive skeleton. |
| Medium | Payment/report credits | Medium | Stripe checkout, credits ledger, report generation decrements credit. |
| Medium | LinkedIn outreach assets | High | Founder posts, DM scripts, pilot landing page, and sample report link. |
| Medium | Accessibility audit | Medium | `npm run verify:commercial-a11y` generates WCAG 2.2 audit packet with route evidence, WCAG-EM boundary, manual checklist, and fixed critical issues on commercial routes; complete screen-reader, contrast, focus, target-size, error-state, and accessible-authentication notes before institutional delivery. |
| Medium | Data-provider adapters | Medium | ESCO adapter first, Lightcast placeholder with licensing guard. |
| Low | Full talent marketplace features | Low | Defer until pilots prove buyer demand. |
| Low | AI chatbot expansion | Medium | Defer unless it improves report creation or support. |
| Low | Broad international localization | Medium | Start after ESCO mapping and country-specific labor data plan. |

## LinkedIn and Market Outreach Strategy

Target personas:

1. Independent career coaches and resume writers.
2. University career center directors.
3. Workforce board leaders.
4. HR/L&D leaders in mid-market companies.
5. AI transformation consultants who need workforce audit artifacts.

Offer ladder:

| Stage | Offer | CTA |
|---|---|---|
| Awareness | Public post: "Which parts of your job are automatable?" | Try free occupation report. |
| Interest | Sample white-label coach report | Comment or DM "REPORT". |
| Pilot | 10 branded client reports for coaches | Book pilot call. |
| Workforce | CSV role exposure audit | Send anonymized role CSV. |
| Expansion | Monthly source-labeled report pack | Convert to subscription or retainer. |

LinkedIn content sequence:

1. Week 1: Founder story plus the problem of vague AI career advice.
2. Week 1: Before/after example of a source-labeled occupation risk report.
3. Week 2: Coach-focused post with white-label sample.
4. Week 2: Workforce CSV audit example with no individual employee decisions.
5. Week 3: Trust post explaining O*NET/BLS/WEF/source caveats.
6. Week 3: Resume analyzer trust/deletion proof demo.
7. Week 4: Invite 10 coaches and 3 workforce teams into paid pilots.

Outbound DM:

```text
Hi {name}, I am building a source-labeled AI automation risk report tool for career coaches and workforce teams. It turns an occupation or role list into a client-ready report with O*NET/BLS/WEF caveats and human-review disclaimers.

I am opening a small pilot for coaches: 10 branded sample reports plus feedback support. Would it be useful if I generated one sample for a role your clients often ask about?
```

## Immediate Next Build Steps

1. Apply artifact-review and resume-deletion-receipt migrations in Supabase, deploy `parse-resume` and `analyze-resume`, rerun `npm run verify:commercial-live-supabase` and `npm run verify:resume-parser-live` until they pass, seed `commercial_staff` for the first staff user, and confirm live text-upload parser receipts plus redacted artifact save/delete receipts before file-upload pilots.
2. Apply the O*NET Task Ratings migration and ingest in the target Supabase project, rerun `npm run verify:onet-task-ratings-live` until it passes, and export checksums before any live task-time or rating-weight claims.
3. Expand SOC/O*NET suggestions from the broadened local seed catalog to a full O*NET occupation index or Supabase search RPC.
4. Add signed storage URL or PDF export, resend workflow, and richer delivery analytics for staff-opened artifacts.
5. Add a dedicated PDF/DOC/DOCX parser adapter only after malware-scan policy, timeout/size evidence, and deletion proof are in place; keep current PDF/DOC/DOCX uploads adapter-pending in outreach language.
6. Complete the manual checklist in `docs/commercialization/commercial-accessibility-audit-latest.md`, then expand Playwright coverage from current responsive/accessibility smoke to visual snapshots, axe-style rule checks, and live resume deletion receipt proof.
7. Schedule source verification, export live Supabase O*NET/BLS table checksums, and attach per-report evidence cards.
8. Convert the pilot privacy notice into reviewed legal Terms/Privacy copy before broad paid outreach.

## Source References Checked

- O*NET Database releases: https://www.onetcenter.org/db_releases.html
- O*NET Web Services API reference: https://services.onetcenter.org/reference/
- BLS Employment Projections: https://www.bls.gov/emp/
- BLS OEWS: https://www.bls.gov/oes/
- BLS OEWS tables: https://www.bls.gov/oes/tables.htm
- BLS LAUS data overview: https://www.bls.gov/lau/data-overview.htm
- BLS QCEW data overview: https://www.bls.gov/cew/data-overview.htm
- BLS Public Data API: https://www.bls.gov/developers/
- CareerOneStop API Overview: https://github.com/CareerOneStop/API-Overview
- Census ACS Data via API: https://www.census.gov/programs-surveys/acs/data/data-via-api.html
- FERPA PII guidance: https://studentprivacy.ed.gov/content/personally-identifiable-information-education-records
- NACE First-Destination Standards: https://www.naceweb.org/job-market/graduate-outcomes/first-destination/standards-and-protocols/
- ESCO overview: https://esco.ec.europa.eu/en/about-esco/what-esco
- ESCO Services API: https://esco.ec.europa.eu/en/use-esco/use-esco-services-api
- World Economic Forum Future of Jobs Report 2025: https://www.weforum.org/publications/the-future-of-jobs-report-2025/
- Anthropic Economic Index: https://www.anthropic.com/research/the-anthropic-economic-index
- Anthropic labor market impacts / observed exposure: https://www.anthropic.com/research/labor-market-impacts
- Anthropic Economic Index March 2026 update: https://www.anthropic.com/research/economic-index-march-2026-report
- OpenAI GDPval overview: https://openai.com/index/gdpval
- OpenAI GDPval leaderboard: https://evals.openai.com/gdpval/leaderboard
- OpenAI GDPval paper record: https://arxiv.org/abs/2510.04374
- BLS AI impacts in employment projections: https://www.bls.gov/opub/mlr/2025/article/incorporating-ai-impacts-in-bls-employment-projections.htm
- AI Workforce Consortium ICT in Motion 2025: https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2025/m09/ai-workforce-consortium-finds-78-of-ict-roles-now-include-ai-technical-skills-while-human-skills-gain-priority-for-responsible-tech-adoption.html
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- ADA AI hiring guidance: https://www.ada.gov/resources/ai-guidance/
- NIST AI Risk Management Framework: https://www.nist.gov/itl/ai-risk-management-framework
- EEOC AI and algorithmic fairness resources: https://www.eeoc.gov/ai
- Lightcast: https://lightcast.io/
- Lightcast enterprise talent intelligence: https://lightcast.io/solutions/enterprise
- Gloat product platform: https://gloat.com/product/
- Workera product overview: https://www.workera.ai/product-overview
- Eightfold public Forrester Q1 2026 skills-intelligence landscape page: https://eightfold.ai/learn/the-skills-intelligence-solutions-landscape/
- OECD Skills Outlook 2025: https://www.oecd.org/en/publications/oecd-skills-outlook-2025_26163cd3-en.html
- Lightcast Global AI Skills Outlook: https://lightcast.io/resources/research/the-lightcast-global-ai-skills-outlook
- Bipartisan Policy Center AI Skills Dashboard analysis: https://bipartisanpolicy.org/article/navigating-skills-trends-data-dashboard-analysis-april-2026/
- LINC Pro: https://lincpro.app/
- Eightfold AI: https://eightfold.ai/
- Gloat: https://gloat.com/
- SkyHive: https://www.skyhive.ai/
- Reejig: https://www.reejig.com/

# Commercialization Codebase Index

Generated: 2026-05-24T04:13:33.565Z
Branch: `commercialization-proof-packs`
Purpose: Maintain a repo-grounded index of the commercial proof-pack surfaces, persistence boundaries, source registry, and verification gates.

## Indexed Commercial Routes

| Route | Component | Import |
| --- | --- | --- |
| `/` | `Index` | eager import or inline component |
| `/automation-risk/:occupation` | `AutomationRiskLandingPage` | ./pages/AutomationRiskLandingPage |
| `/enterprise-dashboard` | `EnterpriseTeamDashboard` | ./pages/EnterpriseTeamDashboard |
| `/for-coaches` | `ForCoachesPage` | ./pages/ForCoachesPage |
| `/operations/leads` | `CommercialLeadOpsPage` | ./pages/CommercialLeadOpsPage |
| `/pricing` | `PricingPage` | ./pages/PricingPage |
| `/privacy` | `PrivacyPage` | ./pages/PrivacyPage |
| `/sample-report` | `SampleReportPage` | ./pages/SampleReportPage |
| `/tools/counselor-reports` | `CounselorReportGenerator` | ./components/CounselorReportGenerator |
| `/tools/resume-analyzer` | `ResumeAnalyzer` | ./components/ResumeAnalyzer |
| `/workshops` | `WorkshopBookingPage` | ./pages/WorkshopBookingPage |

## Feature-To-Code Map

| Feature | Buyer | Routes | Current Proof | Primary Files |
| --- | --- | --- | --- | --- |
| SEO report lead capture | Individuals, coaches, inbound SEO visitors | `/automation-risk/:occupation` | Consent-gated report download, artifact persistence, deduping RPC, offline retry queue, provenance in report HTML. | `src/components/SEOReportDownload.tsx`<br/>`src/lib/commercialLeads.ts`<br/>`src/lib/commercialReportArtifacts.ts`<br/>`supabase/migrations/20260523000100_create_commercial_leads.sql` |
| White-label coach sample reports | Career coaches, resume writers, education counselors | `/for-coaches`, `/sample-report` | Brand colors, contact details, consent-gated artifact capture, source/caveat block, sample watermark. | `src/pages/ForCoachesPage.tsx`<br/>`src/pages/SampleReportPage.tsx`<br/>`src/lib/commercialLeads.ts`<br/>`src/lib/reportProvenance.ts` |
| Workforce CSV exposure audit | HR, L&D, workforce boards, AI transformation consultants | `/enterprise-dashboard` | CSV parsing, role exposure rollup, saved audits, review queue, broader local SOC suggestions, staff mapping boundary, downloadable executive HTML report. | `src/pages/EnterpriseTeamDashboard.tsx`<br/>`src/lib/commercialWorkforceAudits.ts`<br/>`src/lib/socSuggestions.ts`<br/>`src/lib/workforceExecutiveReport.ts`<br/>`supabase/migrations/20260523000100_create_commercial_leads.sql` |
| Commercial lead operations | Founder, sales, support, pilot operations | `/operations/leads` | Staff-gated lead list, status updates, notes, CSV export, artifact open/download event logging. | `src/pages/CommercialLeadOpsPage.tsx`<br/>`src/lib/commercialLeadOps.ts`<br/>`src/lib/commercialReportArtifacts.ts`<br/>`supabase/migrations/20260523000100_create_commercial_leads.sql` |
| Source provenance and claim boundaries | All buyers, especially institutional and workforce pilots | `/sample-report`, `/automation-risk/:occupation`, `/enterprise-dashboard` | Versioned source registry, confidence/caveats, report HTML provenance block, official source verification artifact, local data checksum manifest. | `src/lib/sourceManifest.ts`<br/>`src/lib/reportProvenance.ts`<br/>`scripts/verify-source-manifest.mjs`<br/>`scripts/verify-commercial-data-provenance.mjs`<br/>`docs/commercialization/source-refresh-manifest.md`<br/>`docs/commercialization/data-provenance-checksums.md` |
| AI Work Transition Proof Pack | Individuals, coaches, career centers, workforce boards, L&D teams | `/sample-report`, `/automation-risk/:occupation`, `/enterprise-dashboard` | Downloadable reports now include source-labeled evidence cards, task exposure split, skill-change ledger, caveated AI-era role radar, “does not prove” boundaries, generated timestamps, confidence, and review-state markers. | `src/lib/reportEvidenceCards.ts`<br/>`src/lib/workTransitionProofPack.ts`<br/>`src/components/SEOReportDownload.tsx`<br/>`src/pages/SampleReportPage.tsx`<br/>`src/lib/workforceExecutiveReport.ts`<br/>`scripts/verify-report-evidence.mjs` |
| Privacy and responsible-use trust boundary | Individuals, coaches, institutional reviewers | `/privacy`, `/tools/resume-analyzer`, `/responsible-ai` | Privacy notice, missing-Supabase fallback, deletion/employment-decision messaging, consent and local-queue guardrail verifier. | `src/pages/PrivacyPage.tsx`<br/>`src/components/ResumeAnalyzer.tsx`<br/>`src/pages/ResponsibleAIPage.tsx`<br/>`src/integrations/supabase/client.ts`<br/>`scripts/verify-commercial-trust-boundaries.mjs` |
| Counselor report generator | Schools, workforce boards, coaches | `/tools/counselor-reports` | Route exists as institutional wedge; still needs batch consent and commercial artifact integration. | `src/components/CounselorReportGenerator.tsx`<br/>`supabase/migrations/20251213000003_white_label_configs.sql` |

## Supabase Commercial Persistence Boundary

Tables:
- `public.commercial_leads`
- `public.commercial_report_artifact_events`
- `public.commercial_report_artifacts`
- `public.commercial_staff`
- `public.commercial_workforce_audit_rows`
- `public.commercial_workforce_audits`

RPC functions:
- `public.capture_commercial_lead` (granted)
- `public.create_commercial_report_artifact` (granted)
- `public.create_commercial_workforce_audit` (granted)
- `public.get_commercial_leads` (granted)
- `public.get_commercial_report_artifact` (granted)
- `public.get_commercial_report_artifact_events` (granted)
- `public.get_commercial_workforce_audit` (granted)
- `public.is_commercial_staff` (granted)
- `public.list_commercial_workforce_audits` (granted)
- `public.list_commercial_workforce_review_rows` (granted)
- `public.log_commercial_report_artifact_event` (granted)
- `public.update_commercial_lead_status` (granted)
- `public.update_commercial_workforce_row_mapping` (granted)

Policies:
- Commercial staff can read own staff record
- Public can create commercial leads

## Source Registry Coverage

- `ada-ai-hiring-guidance`
- `anthropic-economic-index`
- `anthropic-observed-exposure`
- `bls-ai-mlr-2025`
- `bls-emp`
- `bls-oews`
- `esco`
- `lightcast`
- `llm-output`
- `nist-ai-rmf`
- `onet`
- `openai-gdpval`
- `serpapi`
- `wcag-22`
- `wef-foj-2025`

## Verification And Run Commands

| Script | Command |
| --- | --- |
| `build` | `vite build` |
| `build:dev` | `vite build --mode development` |
| `dev` | `vite` |
| `index:commercial` | `node scripts/generate-commercialization-index.mjs` |
| `lint` | `eslint .` |
| `lint:commercial` | `node scripts/lint-commercial-scope.mjs` |
| `smoke:commercial` | `node scripts/smoke-commercial-routes.mjs` |
| `verify:commercial` | `node scripts/verify-commercial-release.mjs` |
| `verify:commercial-a11y` | `node scripts/verify-commercial-accessibility.mjs` |
| `verify:commercial-browser` | `node scripts/verify-commercial-browser.mjs` |
| `verify:commercial-full` | `node scripts/verify-commercial-release.mjs --with-a11y --with-network --with-journey` |
| `verify:commercial-network` | `node scripts/verify-commercial-release.mjs --with-network` |
| `verify:commercial-trust` | `node scripts/verify-commercial-trust-boundaries.mjs` |
| `verify:data-provenance` | `node scripts/verify-commercial-data-provenance.mjs --write` |
| `verify:report-evidence` | `node scripts/verify-report-evidence.mjs` |
| `verify:sources` | `node scripts/verify-source-manifest.mjs --write` |

Required commercial pre-demo gate:

1. `npm run verify:commercial`
2. `npm run verify:commercial-a11y` or `npm run verify:commercial -- --with-a11y` when Chromium startup is stable
3. `npm run verify:sources` when DNS/network access is available
4. `npm audit --omit=dev --audit-level=high` when registry access is available
5. `npm run verify:commercial-browser` when macOS/CI browser startup is stable enough for the full lead/report/workforce journey

CI boundary:

- `.github/workflows/commercial-proof-pack.yml` runs `npm ci`, installs Playwright Chromium, and runs `npm run verify:commercial -- --with-a11y`.

## Remaining Index Gaps

- Full repo lint is still legacy-failing outside the commercial proof-pack files.
- Browser QA now has committed commercial Playwright journey and responsive/accessibility smoke harnesses, but full visual snapshots and formal WCAG audit coverage still need expansion.
- `npm run verify:commercial-full` includes accessibility, network, and full browser journey gates, but these remain environment-dependent until DNS, npm registry access, and Chromium startup are stable.
- Proof-pack output now has static and route-smoke verification; richer scoring still needs O*NET task-time imports, local labor-market validation, and licensed job-posting adapters before Lightcast-level market claims.
- Supabase local DB lint needs a running local database on `127.0.0.1:54322`.
- GitHub collaborator invite, push, and PR remain blocked until GitHub CLI tokens are re-authenticated.
- ESCO, Lightcast, and live market search are adapter boundaries, not imported scoring sources.
- Local seed artifacts have checksums, but production O*NET/BLS imported database-table checksums still need a live Supabase data export.

## Machine-Readable Companion

See `docs/commercialization/commercialization-codebase-index.json` for the same index as JSON.

# Commercialization Codebase Index

Generated: 2026-06-01T10:33:49.743Z
Branch: `phase-e-commercial-validation`
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
| `/proof-pack-gallery` | `ProofPackGalleryPage` | ./pages/ProofPackGalleryPage |
| `/sample-report` | `SampleReportPage` | ./pages/SampleReportPage |
| `/tools/counselor-reports` | `CounselorReportGenerator` | ./components/CounselorReportGenerator |
| `/tools/resume-analyzer` | `ResumeAnalyzer` | ./components/ResumeAnalyzer |
| `/workshops` | `WorkshopBookingPage` | ./pages/WorkshopBookingPage |

## Feature-To-Code Map

| Feature | Buyer | Routes | Current Proof | Primary Files |
| --- | --- | --- | --- | --- |
| Pilot proof-pack gallery and outreach assets | Coaches, career centers, workforce boards, L&D pilot sponsors | `/proof-pack-gallery`, `/sample-report`, `/automation-risk/:occupation`, `/enterprise-dashboard` | Public proof-pack gallery, launch readiness command center, function governance dashboard, buyer-specific sample routes, occupation sample shelf, bounded pilot caveats, downloadable institutional readiness packet, downloadable CRM-import outreach CSV, and pilot validation worksheet CSV. | `src/pages/ProofPackGalleryPage.tsx`<br/>`src/lib/commercialLaunchGate.ts`<br/>`src/lib/commercialLaunchReadiness.ts`<br/>`src/lib/supabaseFunctionGovernance.ts`<br/>`src/lib/institutionalReadinessPacket.ts`<br/>`docs/commercialization/pilot-outreach-pack.md`<br/>`scripts/verify-commercial-browser.mjs`<br/>`scripts/verify-commercial-trust-boundaries.mjs`<br/>`scripts/verify-supabase-function-governance.mjs` |
| Institutional readiness and governance packet | Career centers, workforce boards, L&D teams, institutional pilot reviewers | `/proof-pack-gallery` | Downloadable trust packet now includes an institutional risk register, AI RMF Govern/Map/Measure/Manage controls, WCAG 2.2 accessibility gate, manual WCAG evidence worksheet, buyer acceptable-use signoff checklist, generated accessibility audit packet with manual WCAG checklist, employment-decision boundary, live proof blockers, evidence cards, CSV risk register, and acceptance checklist CSV for buyer review. | `src/lib/institutionalReadinessPacket.ts`<br/>`src/pages/ProofPackGalleryPage.tsx`<br/>`scripts/verify-report-evidence.mjs`<br/>`scripts/verify-commercial-browser.mjs`<br/>`scripts/verify-commercial-accessibility.mjs`<br/>`scripts/verify-commercial-data-provenance.mjs`<br/>`docs/commercialization/commercial-accessibility-audit-latest.md`<br/>`docs/commercialization/commercial-accessibility-audit-latest.json` |
| Commercial proof-pack CI workflow | Founder, maintainer, pilot reviewers |  | GitHub Actions workflow is installed with read-only permissions, commercial build/route/evidence checks, Playwright a11y/browser journey checks, a generated WCAG 2.2 audit packet with manual review boundary, optional authenticated live e2e for a synthetic Supabase Auth test user, plus manual/scheduled source and production audit checks. | `.github/workflows/commercial-proof-pack.yml`<br/>`docs/commercialization/commercial-proof-pack.workflow.yml`<br/>`docs/commercialization/live-supabase-deployment-runbook.md`<br/>`scripts/verify-commercial-release.mjs`<br/>`scripts/generate-commercial-supabase-deployment-packet.mjs`<br/>`scripts/verify-commercial-live-auth-e2e.mjs`<br/>`scripts/verify-commercial-browser.mjs`<br/>`scripts/verify-commercial-accessibility.mjs`<br/>`docs/commercialization/commercial-accessibility-audit-latest.md` |
| SEO report lead capture | Individuals, coaches, inbound SEO visitors | `/automation-risk/:occupation` | Consent-gated report download, artifact persistence, deduping RPC, offline retry queue, provenance in report HTML. | `src/components/SEOReportDownload.tsx`<br/>`src/lib/commercialLeads.ts`<br/>`src/lib/commercialReportArtifacts.ts`<br/>`supabase/migrations/20260523000100_create_commercial_leads.sql` |
| White-label coach sample reports | Career coaches, resume writers, education counselors | `/for-coaches`, `/sample-report` | Brand colors, contact details, consent-gated artifact capture, source/caveat block, sample watermark. | `src/pages/ForCoachesPage.tsx`<br/>`src/pages/SampleReportPage.tsx`<br/>`src/lib/commercialLeads.ts`<br/>`src/lib/reportProvenance.ts` |
| Workforce CSV exposure audit | HR, L&D, workforce boards, AI transformation consultants | `/enterprise-dashboard` | CSV parsing, role exposure rollup, saved audits, review queue, broader local SOC suggestions, staff mapping boundary, downloadable executive HTML report. | `src/pages/EnterpriseTeamDashboard.tsx`<br/>`src/lib/commercialWorkforceAudits.ts`<br/>`src/lib/socSuggestions.ts`<br/>`src/lib/workforceExecutiveReport.ts`<br/>`supabase/migrations/20260523000100_create_commercial_leads.sql` |
| Commercial lead operations | Founder, sales, support, pilot operations | `/operations/leads` | Staff-gated lead list, status updates, outreach stage/channel/priority/sequence/follow-up tracking, response metrics, notes, standard CSV export, unsubscribe-safe campaign CSV with tracked proof-pack links, provider suppression handoff CSV, A/B campaign variants, analytics event names, conversion goals, suppression reasons, variant-level response reporting, artifact open/download event logging, section-level review/client-ready event logging, final artifact client-ready approval, and downloadable human-review attestation. | `src/pages/CommercialLeadOpsPage.tsx`<br/>`src/lib/commercialLeadOps.ts`<br/>`src/lib/commercialReportArtifacts.ts`<br/>`supabase/migrations/20260523000100_create_commercial_leads.sql`<br/>`supabase/migrations/20260524000200_add_commercial_artifact_review_events.sql`<br/>`supabase/migrations/20260525172048_add_commercial_outreach_pipeline.sql`<br/>`supabase/migrations/20260526000100_add_commercial_outreach_response_metrics.sql` |
| Commercial launch gate and payment fulfillment boundary | Founder, pilot operations, paid proof-pack buyers | `/proof-pack-gallery`, `/pricing`, `/for-coaches`, `/operations/leads` | Launch gate now separates owner-held secrets, public function review, legacy function sprawl, outreach automation, provider data, accessibility, and payment fulfillment. The proof-pack gallery includes a launch readiness command center, payment fulfillment status, function governance dashboard, public/no-JWT launch decisions, required evidence checklists, source freshness view, manual WCAG checklist, and pilot feedback capture plan. Checkout helpers pass authenticated Supabase JWTs, the deployed checkout Edge Function verifies callers for subscription and credit checkout, and Stripe webhook credit purchases add report credits plus transaction records. | `src/lib/commercialLaunchGate.ts`<br/>`src/lib/commercialLaunchReadiness.ts`<br/>`src/lib/supabaseFunctionGovernance.ts`<br/>`src/lib/stripe.ts`<br/>`supabase/functions/create-checkout-session/index.ts`<br/>`supabase/functions/stripe-webhook/index.ts`<br/>`scripts/verify-report-evidence.mjs`<br/>`scripts/verify-commercial-trust-boundaries.mjs`<br/>`scripts/verify-supabase-function-governance.mjs` |
| Source provenance and claim boundaries | All buyers, especially institutional and workforce pilots | `/sample-report`, `/automation-risk/:occupation`, `/enterprise-dashboard` | Versioned source registry, confidence/caveats, report HTML provenance block, official source verification artifact, local data checksum manifest. | `src/lib/sourceManifest.ts`<br/>`src/lib/reportProvenance.ts`<br/>`scripts/verify-source-manifest.mjs`<br/>`scripts/verify-commercial-data-provenance.mjs`<br/>`docs/commercialization/source-refresh-manifest.md`<br/>`docs/commercialization/data-provenance-checksums.md` |
| Local labor-market snapshot packet | Career centers, workforce boards, L&D teams, institutional pilot reviewers | `/proof-pack-gallery` | Proof-pack gallery now exports a local labor-market snapshot HTML/CSV packet that lists required geography, source vintage, query metadata, reviewer notes, source IDs, caveats, and does-not-prove boundaries before any local-demand, wage, training, posting, or provider-backed claim becomes client-ready. | `src/lib/localLaborMarketSnapshot.ts`<br/>`src/pages/ProofPackGalleryPage.tsx`<br/>`scripts/verify-commercial-browser.mjs`<br/>`scripts/verify-report-evidence.mjs`<br/>`scripts/verify-commercial-data-provenance.mjs` |
| AI Work Transition Proof Pack | Individuals, coaches, career centers, workforce boards, L&D teams | `/sample-report`, `/automation-risk/:occupation`, `/enterprise-dashboard` | Downloadable reports now include source-labeled evidence cards, task exposure split with proxy weight basis, skill-change ledger with all five states plus per-row confidence/review/caveats, AI-era role radar with role-level review/taxonomy/posting-validation boundaries, learning/provider recommendation boundaries, local labor-market proof appendix boundaries, "does not prove" boundaries, generated timestamps, confidence, section-level review workflow, persisted review metadata, staff review/client-ready event logging, final artifact approval, and human-review attestation. O*NET 30.3 Task Ratings migration, ingest boundary, runtime helper, and verifier are implemented before replacing proxy weights. | `src/lib/reportEvidenceCards.ts`<br/>`src/lib/workTransitionProofPack.ts`<br/>`src/components/SEOReportDownload.tsx`<br/>`src/pages/SampleReportPage.tsx`<br/>`src/lib/workforceExecutiveReport.ts`<br/>`supabase/lib/scripts/ingest_onet_metadata.ts`<br/>`supabase/migrations/20260524000300_add_onet_task_rating_metadata.sql`<br/>`scripts/verify-onet-task-ratings-ingest.mjs`<br/>`scripts/verify-report-evidence.mjs` |
| Privacy and responsible-use trust boundary | Individuals, coaches, institutional reviewers | `/privacy`, `/tools/resume-analyzer`, `/responsible-ai`, `/trust-center` | Privacy notice, missing-Supabase fallback, bounded resume deletion receipt RPC/table, server-side resume parser boundary with upload validation and non-persistence receipt, live parse-resume receipt verifier, raw resume text redaction stub, resume analysis proof-pack metadata, parser boundary, source-labeled evidence cards, downloadable resume proof report, authenticated redacted resume proof artifact persistence, artifact deletion receipt, optional signed-in live synthetic e2e verifier for artifact save/delete and resume-analysis deletion receipts, buyer-facing commercial trust center with AI RMF/risk-register/live-blocker/payment-proof/function-governance sections, downloadable trust packet and risk CSV, copyable rewrite draft packet with caveats, deletion/employment-decision messaging, consent and local-queue guardrail verifier. | `src/pages/PrivacyPage.tsx`<br/>`src/components/ResumeAnalyzer.tsx`<br/>`src/lib/resumeAnalysisPrivacy.ts`<br/>`src/lib/resumeProofReportArtifacts.ts`<br/>`src/pages/ResponsibleAIPage.tsx`<br/>`src/integrations/supabase/client.ts`<br/>`supabase/functions/parse-resume/index.ts`<br/>`supabase/functions/analyze-resume/index.ts`<br/>`supabase/migrations/20260524000400_add_resume_deletion_receipts.sql`<br/>`supabase/migrations/20260524000500_add_resume_proof_report_artifacts.sql`<br/>`docs/commercialization/live-supabase-deployment-runbook.md`<br/>`scripts/generate-commercial-supabase-deployment-packet.mjs`<br/>`scripts/verify-commercial-trust-boundaries.mjs`<br/>`scripts/verify-resume-parser-live.mjs`<br/>`scripts/verify-commercial-live-auth-e2e.mjs` |
| Counselor report generator | Schools, workforce boards, coaches | `/tools/counselor-reports` | Route now includes a downloadable aggregate-only career-center cohort proof pack with source-labeled cohort segments, FERPA-style privacy boundary, NACE first-destination outcome boundary, evidence cards, CSV export, and advisor-review requirements. Live authenticated batch consent and commercial artifact persistence remain pending. | `src/components/CounselorReportGenerator.tsx`<br/>`src/lib/careerCenterCohortProofPack.ts`<br/>`supabase/migrations/20251213000003_white_label_configs.sql` |

## Supabase Commercial Persistence Boundary

Tables:
- `public.commercial_leads`
- `public.commercial_report_artifact_events`
- `public.commercial_report_artifacts`
- `public.commercial_staff`
- `public.commercial_workforce_audit_rows`
- `public.commercial_workforce_audits`
- `public.resume_analysis_deletion_receipts`
- `public.resume_proof_report_artifact_deletion_receipts`
- `public.resume_proof_report_artifacts`

RPC functions:
- `public.capture_commercial_lead` (granted)
- `public.create_commercial_report_artifact` (granted)
- `public.create_commercial_workforce_audit` (granted)
- `public.create_resume_proof_report_artifact` (granted)
- `public.delete_resume_analysis_with_receipt` (granted)
- `public.delete_resume_proof_report_artifact_with_receipt` (granted)
- `public.get_commercial_leads` (granted)
- `public.get_commercial_report_artifact` (granted)
- `public.get_commercial_report_artifact_events` (granted)
- `public.get_commercial_workforce_audit` (granted)
- `public.is_commercial_staff` (granted)
- `public.list_commercial_workforce_audits` (granted)
- `public.list_commercial_workforce_review_rows` (granted)
- `public.log_commercial_report_artifact_event` (granted)
- `public.update_commercial_lead_outreach_plan` (granted)
- `public.update_commercial_lead_response_metrics` (granted)
- `public.update_commercial_lead_status` (granted)
- `public.update_commercial_workforce_row_mapping` (granted)
- `public.update_resume_proof_report_artifact_updated_at`

Policies:
- Commercial staff can read own staff record
- Public can create commercial leads
- Service role can manage redacted resume proof artifacts
- Service role can manage resume deletion receipts
- Service role can manage resume proof artifact deletion receipts
- Users can read own redacted resume proof artifacts
- Users can read own resume deletion receipts
- Users can read own resume proof artifact deletion receipts

## Source Registry Coverage

- `ada-ai-hiring-guidance`
- `ai-workforce-consortium-2025`
- `anthropic-economic-index`
- `anthropic-observed-exposure`
- `bls-ai-mlr-2025`
- `bls-emp`
- `bls-laus`
- `bls-oews`
- `bls-qcew`
- `careeronestop-api`
- `census-acs-api`
- `cfpb-employment-algorithmic-scores`
- `dol-ai-literacy-framework`
- `eeoc-employment-selection-procedures`
- `esco`
- `ferpa-student-privacy`
- `iso-42001`
- `lightcast`
- `llm-output`
- `nace-career-readiness`
- `nace-first-destination`
- `nist-ai-rmf`
- `oecd-skills-outlook-2025`
- `onet`
- `onet-scales-reference`
- `onet-task-categories`
- `onet-task-ratings`
- `onet-task-statements`
- `openai-gdpval`
- `owasp-file-upload`
- `serpapi`
- `supabase-edge-functions`
- `wcag-22`
- `wef-foj-2025`
- `workera-positioning`

## Verification And Run Commands

| Script | Command |
| --- | --- |
| `build` | `vite build` |
| `build:dev` | `vite build --mode development` |
| `dev` | `vite` |
| `e2e:smoke` | `playwright test` |
| `index:commercial` | `node scripts/generate-commercialization-index.mjs` |
| `lint` | `eslint .` |
| `lint:commercial` | `node scripts/lint-commercial-scope.mjs` |
| `smoke:commercial` | `node scripts/smoke-commercial-routes.mjs` |
| `smoke:skill-adjacency` | `node scripts/verify-skill-adjacency-embedding.mjs` |
| `verify:claim-boundaries` | `node scripts/verify-claim-boundaries.mjs` |
| `verify:commercial` | `node scripts/verify-commercial-release.mjs` |
| `verify:commercial-a11y` | `node scripts/verify-commercial-accessibility.mjs` |
| `verify:commercial-browser` | `node scripts/verify-commercial-browser.mjs` |
| `verify:commercial-deployment` | `node scripts/generate-commercial-supabase-deployment-packet.mjs` |
| `verify:commercial-evidence-records` | `node scripts/verify-commercial-evidence-records.mjs` |
| `verify:commercial-evidence-records:write` | `node scripts/verify-commercial-evidence-records.mjs --write` |
| `verify:commercial-full` | `node scripts/verify-commercial-release.mjs --with-a11y --with-network --with-journey` |
| `verify:commercial-live-auth-e2e` | `node scripts/verify-commercial-live-auth-e2e.mjs --write` |
| `verify:commercial-live-supabase` | `node scripts/verify-commercial-live-supabase.mjs --write` |
| `verify:commercial-network` | `node scripts/verify-commercial-release.mjs --with-network` |
| `verify:commercial-trust` | `node scripts/verify-commercial-trust-boundaries.mjs` |
| `verify:commercial-validation` | `node scripts/verify-phase-e-commercial-validation.mjs` |
| `verify:data-provenance` | `node scripts/verify-commercial-data-provenance.mjs --write` |
| `verify:global-english` | `node scripts/verify-global-english-localization.mjs` |
| `verify:global-english-sources` | `node scripts/verify-global-english-localization.mjs --with-source-fetch` |
| `verify:live-closeout-readiness` | `node scripts/verify-live-closeout-readiness.mjs` |
| `verify:live-gate-evidence` | `node scripts/verify-live-gate-evidence.mjs` |
| `verify:onet-task-ratings` | `node scripts/verify-onet-task-ratings-ingest.mjs` |
| `verify:onet-task-ratings-live` | `node scripts/verify-onet-task-ratings-live.mjs --write` |
| `verify:production-calibration` | `node scripts/verify-production-calibration-run.mjs --write` |
| `verify:remediation-gates` | `node scripts/verify-remediation-external-gates.mjs` |
| `verify:remediation-gates:write` | `node scripts/verify-remediation-external-gates.mjs --write` |
| `verify:repo-presentation` | `node scripts/verify-repo-presentation.mjs` |
| `verify:repo-presentation:github` | `node scripts/verify-repo-presentation.mjs --with-github-api` |
| `verify:repo-presentation:write` | `node scripts/verify-repo-presentation.mjs --with-github-api --write` |
| `verify:report-evidence` | `node scripts/verify-report-evidence.mjs` |
| `verify:resume-parser-live` | `node scripts/verify-resume-parser-live.mjs --write` |
| `verify:secrets` | `node scripts/verify-secret-hygiene.mjs` |
| `verify:sources` | `node scripts/verify-source-manifest.mjs --write` |
| `verify:stripe-live-mrr` | `node scripts/verify-stripe-live-mrr.mjs --write` |
| `verify:stripe-test-checkout` | `node scripts/verify-stripe-test-checkout.mjs --write` |
| `verify:supabase-function-governance` | `node scripts/verify-supabase-function-governance.mjs` |

Required commercial pre-demo gate:

1. `npm run verify:commercial` to regenerate the codebase index, trust-boundary checks, data-provenance checksums, remediation external-gate ledger, commercial lint/build checks, and route smoke proof
2. `npm run verify:commercial-a11y` or `npm run verify:commercial -- --with-a11y` when Chromium startup is stable; this writes `docs/commercialization/commercial-accessibility-audit-latest.md` and `.json`
3. `npm run verify:sources` when DNS/network access is available
4. `npm audit --omit=dev --audit-level=high` when registry access is available
5. `npm run verify:commercial-browser` when macOS/CI browser startup is stable enough for the full lead/report/workforce journey

CI boundary:

- `.github/workflows/commercial-proof-pack.yml` is the installed GitHub Actions workflow. It uses Node 24-compatible action wrappers, keeps Node 20 as the app test runtime, runs the commercial proof-pack gate with Playwright a11y and browser journey checks on push/PR across `main`, `live-auth-e2e-closeout`, and the Phase A-E remediation branch chain, refreshes the remediation external-gate ledger through `verify:commercial`, and runs source verification plus production audit on manual or scheduled runs. Hosted run evidence must be checked after each workflow-affecting push.

## Remaining Index Gaps

- Browser QA now has committed commercial Playwright journey and responsive/accessibility smoke harnesses plus a generated WCAG 2.2 audit packet, but full visual snapshots and completed manual WCAG conformance evidence still need expansion.
- `npm run verify:commercial-full` includes accessibility, network, and full browser journey gates, but these remain environment-dependent until DNS, npm registry access, and Chromium startup are stable.
- Proof-pack output now has static and route-smoke verification plus section-level review metadata, proxy task-weight basis, per-row skill caveats, and role-level review/taxonomy/posting-validation boundaries; O*NET Task Ratings schema/import/runtime boundaries exist, but richer scoring still needs target Supabase ingest/export checksums, local labor-market validation, and licensed job-posting adapters before Lightcast-level market claims.
- Human-review state is preserved in generated report HTML and artifact/audit metadata; staff UI transitions, final artifact approval, non-legal review attestation, resume deletion receipts, the server-side resume parser boundary, the live parser receipt verifier, and the optional signed-in synthetic artifact/deletion e2e verifier are implemented. Live Supabase commercial schema/RPC proof now passes, while paid PDF/DOCX parser adapters, malware scanning, completed authenticated e2e run evidence, and formal e-signature/PDF storage remain Phase 5 hardening work.
- Phase 6 now has a public proof-pack gallery, local labor-market snapshot packet, CRM-import CSV, tracked outreach links, and A/B variant reporting, but deployed-domain analytics ingestion, email automation, unsubscribe webhook sync-back, and a live CRM sync remain pending before scaled outreach.
- Supabase local DB lint needs a running local database on `127.0.0.1:54322`.
- GitHub local tracking and the installed workflow are present, but direct remote branch, collaborator access, hosted push CI, and hosted manual source/audit evidence must be re-confirmed from a network-available shell after each workflow-affecting push.
- ESCO, Lightcast, and live market search are adapter boundaries, not imported scoring sources.
- Local seed artifacts, the local labor-market snapshot packet, and O*NET Task Ratings import boundaries have checksums, but production O*NET/BLS imported database-table checksums and true O*NET Task Ratings task-time weights still need a live Supabase data export.

## Machine-Readable Companion

See `docs/commercialization/commercialization-codebase-index.json` for the same index as JSON.

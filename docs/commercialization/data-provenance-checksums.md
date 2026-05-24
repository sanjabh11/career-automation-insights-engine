# Data Provenance Checksums

Generated: 2026-05-24T10:32:14.927Z
Source verification artifact: `docs/commercialization/source-verification-latest.json`
Source verification generated: 2026-05-24T09:52:12.192Z
All referenced current-source checks passed: yes
Current-source verification required for this local checksum pass: no

This file records hash-level evidence for local commercial data artifacts and source/provenance code used by the proof-pack flows. It is not a substitute for licensed provider imports, but it prevents silent drift in the current seed data and ingestion boundaries.

| Artifact | Label | Path | Type | Rows/Lines | SHA-256 | Source IDs | Status |
|---|---|---|---|---:|---|---|---|
| `wef-economics-csv` | WEF economics CSV seed | `public/data/econ_wef.csv` | csv | 1,740 | `cedb403873db0637...` | `wef-foj-2025` | pass |
| `occupation-risk-seed` | SEO occupation risk seed | `src/data/occupationRiskData.ts` | typescript-seed | 1,043 | `4b5826d0fb62c3a8...` | `onet`, `bls-emp`, `bls-oews`, `wef-foj-2025` | pass |
| `onet-ingest-boundary` | O*NET metadata ingestion boundary | `supabase/lib/scripts/ingest_onet_metadata.ts` | ingestion-script | 378 | `8226fee512c1378c...` | `onet` | pass |
| `onet-task-ratings-ingest-script` | O*NET Task Ratings ingest script | `supabase/lib/scripts/ingest_onet_metadata.ts` | ingestion-script | 378 | `8226fee512c1378c...` | `onet` | pass |
| `source-manifest-module` | Source manifest module | `src/lib/sourceManifest.ts` | source-registry | 513 | `0d3073320c18301b...` | `onet`, `onet-task-statements`, `onet-task-ratings`, `onet-task-categories`, `onet-scales-reference`, `bls-emp`, `bls-oews`, `bls-laus`, `bls-qcew`, `careeronestop-api`, `census-acs-api`, `wef-foj-2025`, `oecd-skills-outlook-2025`, `ai-workforce-consortium-2025`, `nace-career-readiness`, `nace-first-destination`, `ferpa-student-privacy`, `dol-ai-literacy-framework`, `anthropic-economic-index`, `anthropic-observed-exposure`, `openai-gdpval`, `bls-ai-mlr-2025`, `wcag-22`, `nist-ai-rmf`, `ada-ai-hiring-guidance`, `iso-42001`, `esco`, `lightcast`, `workera-positioning`, `serpapi`, `llm-output` | pass |
| `report-evidence-card-module` | Report evidence card renderer | `src/lib/reportEvidenceCards.ts` | report-runtime | 91 | `2a82837b74fe7871...` | `onet`, `bls-ai-mlr-2025`, `nist-ai-rmf`, `llm-output` | pass |
| `career-center-cohort-proof-pack-module` | Career-center cohort proof pack renderer | `src/lib/careerCenterCohortProofPack.ts` | report-runtime | 368 | `3dae5215d7067f4b...` | `onet`, `ferpa-student-privacy`, `nace-career-readiness`, `nace-first-destination`, `dol-ai-literacy-framework`, `bls-oews`, `bls-laus`, `bls-qcew`, `census-acs-api`, `wef-foj-2025`, `anthropic-observed-exposure`, `openai-gdpval`, `bls-ai-mlr-2025`, `nist-ai-rmf`, `wcag-22`, `llm-output` | pass |
| `work-transition-proof-pack-module` | AI work transition proof pack renderer | `src/lib/workTransitionProofPack.ts` | report-runtime | 1,523 | `c9151cfd5c86de0a...` | `onet`, `wef-foj-2025`, `oecd-skills-outlook-2025`, `ai-workforce-consortium-2025`, `nace-career-readiness`, `dol-ai-literacy-framework`, `anthropic-economic-index`, `anthropic-observed-exposure`, `openai-gdpval`, `bls-ai-mlr-2025`, `bls-oews`, `bls-laus`, `bls-qcew`, `careeronestop-api`, `census-acs-api`, `wcag-22`, `nist-ai-rmf`, `ada-ai-hiring-guidance`, `esco`, `lightcast`, `serpapi`, `llm-output` | pass |
| `report-provenance-module` | Report provenance renderer | `src/lib/reportProvenance.ts` | report-runtime | 135 | `7e022db47a018150...` | `onet`, `bls-emp`, `bls-oews`, `wef-foj-2025`, `llm-output` | pass |
| `workforce-executive-report-module` | Workforce executive report artifact renderer | `src/lib/workforceExecutiveReport.ts` | report-runtime | 234 | `4ad0baba8eac8298...` | `onet`, `bls-emp`, `bls-oews`, `wef-foj-2025`, `llm-output` | pass |
| `commercial-report-artifacts-module` | Commercial report artifact review runtime | `src/lib/commercialReportArtifacts.ts` | report-runtime | 376 | `f36c7b1c4714ec8d...` | `nist-ai-rmf`, `ada-ai-hiring-guidance`, `iso-42001`, `llm-output` | pass |
| `resume-deletion-receipt-client` | Resume analysis deletion receipt client | `src/lib/resumeAnalysisPrivacy.ts` | privacy-runtime | 75 | `dd2d0e3fbe2f4a42...` | `nist-ai-rmf`, `ada-ai-hiring-guidance`, `llm-output` | pass |
| `resume-deletion-receipt-migration` | Resume analysis deletion receipt migration | `supabase/migrations/20260524000400_add_resume_deletion_receipts.sql` | supabase-migration | 145 | `26cbcd73f5380890...` | `nist-ai-rmf`, `ada-ai-hiring-guidance`, `llm-output` | pass |
| `resume-analysis-edge-retention-boundary` | Resume analysis edge-function retention boundary | `supabase/functions/analyze-resume/index.ts` | edge-function | 172 | `e39a79a9d7811d7b...` | `nist-ai-rmf`, `ada-ai-hiring-guidance`, `llm-output` | pass |
| `proof-pack-gallery-page` | Phase 6 proof-pack gallery and outreach CSV | `src/pages/ProofPackGalleryPage.tsx` | commercial-page | 455 | `33120b2419a182fd...` | `nace-career-readiness`, `nace-first-destination`, `ferpa-student-privacy`, `dol-ai-literacy-framework`, `nist-ai-rmf`, `ada-ai-hiring-guidance`, `wcag-22`, `lightcast`, `workera-positioning`, `serpapi`, `llm-output` | pass |
| `commercial-proof-pack-ci-workflow-template` | Commercial proof-pack CI workflow template | `docs/commercialization/commercial-proof-pack.workflow.yml` | ci-workflow-template | 39 | `9517990489338e18...` | `nist-ai-rmf`, `wcag-22`, `llm-output` | pass |
| `commercial-proof-pack-ci-workflow-installed` | Commercial proof-pack CI workflow installed | `.github/workflows/commercial-proof-pack.yml` | ci-workflow | 39 | `9517990489338e18...` | `nist-ai-rmf`, `wcag-22`, `llm-output` | pass |
| `onet-task-rating-metadata-migration` | O*NET Task Rating metadata migration | `supabase/migrations/20260524000300_add_onet_task_rating_metadata.sql` | supabase-migration | 45 | `b719ea4ba88bed94...` | `onet`, `onet-task-statements`, `onet-task-ratings`, `onet-task-categories`, `onet-scales-reference` | pass |
| `artifact-review-event-migration` | Artifact review event migration | `supabase/migrations/20260524000200_add_commercial_artifact_review_events.sql` | supabase-migration | 87 | `f0179f9e596e98e0...` | `nist-ai-rmf`, `ada-ai-hiring-guidance`, `llm-output` | pass |

## Caveats

- `wef-economics-csv`: Local WEF-derived economics seed used for directional macro context; not a complete live labor-market feed.
- `occupation-risk-seed`: Hand-curated SEO seed data; do not claim full O*NET 30.3/BLS-backed scoring until refreshed imports are checksum-verified.
- `onet-ingest-boundary`: Ingestion utility boundary only; it proves import mechanics exist, not that current production tables are refreshed.
- `onet-task-ratings-ingest-script`: Task Ratings import can populate O*NET 30.3 importance/frequency metadata, but reports must not claim task-time precision until the target Supabase table export is checksum-verified.
- `source-manifest-module`: Commercial source registry; adapter-ready records are not imported provider-backed data.
- `report-evidence-card-module`: Shared report evidence card renderer; evidence cards still depend on correct source assignment in each report flow.
- `career-center-cohort-proof-pack-module`: Career-center cohort proof packs are aggregate-only planning artifacts; live batch consent, institution-approved outcome reporting, and artifact persistence remain pending.
- `work-transition-proof-pack-module`: Emerging role radar, skill-change ledger, learning/provider boundary, local labor-market appendix, and section-level review workflow are planning signals; provider-backed market validation remains adapter-ready.
- `report-provenance-module`: Runtime report trust layer; each generated report still needs its own source snapshot and artifact event history.
- `workforce-executive-report-module`: Client-side pilot artifact renderer; final enterprise reporting still needs signed storage, PDF generation, and delivery/audit events.
- `commercial-report-artifacts-module`: Review attestation is a non-legal delivery traceability artifact, not an electronic signature or compliance certification.
- `resume-deletion-receipt-client`: Deletion receipt client proves an app-level saved analysis deletion request can return a bounded receipt; it does not prove external provider logs, exports, or backups are deleted.
- `resume-deletion-receipt-migration`: Deletion receipts are app-level proof for the resume_analyses row and do not certify legal compliance, backup deletion, or model-provider retention behavior.
- `resume-analysis-edge-retention-boundary`: Edge-function retention metadata documents raw-text redaction and receipt availability; live deployment and provider-log controls must still be verified separately.
- `proof-pack-gallery-page`: Public sample gallery and CRM import CSV are outreach enablement artifacts; they do not prove live CRM automation or deployed-domain analytics.
- `commercial-proof-pack-ci-workflow-template`: Reference workflow template for commercial proof-pack CI; the installed .github workflow and hosted run evidence are tracked separately.
- `commercial-proof-pack-ci-workflow-installed`: Installed GitHub Actions workflow runs commercial proof-pack gates on push/PR; hosted green-run evidence must still be inspected after push.
- `onet-task-rating-metadata-migration`: Schema support for O*NET Task Ratings does not prove the migration has been applied or populated in the target Supabase project.
- `artifact-review-event-migration`: Staff review events create an append-only readiness trail; they do not replace legal, accessibility, or labor-relations review.

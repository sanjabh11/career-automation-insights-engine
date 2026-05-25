#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const SOURCE_MANIFEST_PATH = 'src/lib/sourceManifest.ts';
const SOURCE_VERIFICATION_PATH = 'docs/commercialization/source-verification-latest.json';
const JSON_OUTPUT = 'docs/commercialization/data-provenance-checksums.json';
const MD_OUTPUT = 'docs/commercialization/data-provenance-checksums.md';

const artifacts = [
  {
    id: 'wef-economics-csv',
    label: 'WEF economics CSV seed',
    path: 'public/data/econ_wef.csv',
    type: 'csv',
    sourceIds: ['wef-foj-2025'],
    expectedHeaders: ['source', 'source_url', 'as_of_year', 'evidence_note'],
    caveat: 'Local WEF-derived economics seed used for directional macro context; not a complete live labor-market feed.',
  },
  {
    id: 'occupation-risk-seed',
    label: 'SEO occupation risk seed',
    path: 'src/data/occupationRiskData.ts',
    type: 'typescript-seed',
    sourceIds: ['onet', 'bls-emp', 'bls-oews', 'wef-foj-2025'],
    expectedSnippets: ['export const occupationRiskData', 'overallRisk', 'bridgeRole', 'reskillingSuggestions'],
    caveat: 'Hand-curated SEO seed data; do not claim full O*NET 30.3/BLS-backed scoring until refreshed imports are checksum-verified.',
  },
  {
    id: 'onet-ingest-boundary',
    label: 'O*NET metadata ingestion boundary',
    path: 'supabase/lib/scripts/ingest_onet_metadata.ts',
    type: 'ingestion-script',
    sourceIds: ['onet'],
    expectedSnippets: ['<path-to-onet-csv-root>', 'Job Zones.txt', 'Tools Used.txt', 'Task Statements.txt', 'Task Ratings.txt', 'Task Categories.txt', 'SUPABASE_SERVICE_ROLE_KEY'],
    caveat: 'Ingestion utility boundary only; it proves import mechanics exist, not that current production tables are refreshed.',
  },
  {
    id: 'onet-task-ratings-ingest-script',
    label: 'O*NET Task Ratings ingest script',
    path: 'supabase/lib/scripts/ingest_onet_metadata.ts',
    type: 'ingestion-script',
    sourceIds: ['onet'],
    expectedSnippets: ['ingestTaskStatementsAndRatings', 'Task Statements.txt', 'Task Ratings.txt', 'Task Categories.txt', 'scaleId === "IM"', 'scaleId === "RT"', 'scaleId === "FT"', 'frequency_category', 'task_ratings_ingested_at'],
    caveat: 'Task Ratings import can populate O*NET 30.3 importance/frequency metadata, but reports must not claim task-time precision until the target Supabase table export is checksum-verified.',
  },
  {
    id: 'onet-task-ratings-live-ingest-runner',
    label: 'O*NET Task Ratings live ingest runner',
    path: 'scripts/run-onet-task-ratings-live-ingest.mjs',
    type: 'deployment-script',
    sourceIds: ['onet', 'onet-task-statements', 'onet-task-ratings', 'onet-task-categories'],
    expectedSnippets: ['SUPABASE_SERVICE_ROLE_KEY', 'assertServiceRoleAccepted', 'Task Statements', 'Task Ratings', 'Task Categories', 'ingest_onet_metadata.ts', 'project-ref'],
    caveat: 'Credential-safe runner for the target Supabase ingest; it still requires a valid target service-role key and live row verification before stronger task-time claims.',
  },
  {
    id: 'source-manifest-module',
    label: 'Source manifest module',
    path: SOURCE_MANIFEST_PATH,
    type: 'source-registry',
    sourceIds: ['onet', 'onet-task-statements', 'onet-task-ratings', 'onet-task-categories', 'onet-scales-reference', 'bls-emp', 'bls-oews', 'bls-laus', 'bls-qcew', 'careeronestop-api', 'census-acs-api', 'wef-foj-2025', 'oecd-skills-outlook-2025', 'ai-workforce-consortium-2025', 'nace-career-readiness', 'nace-first-destination', 'ferpa-student-privacy', 'dol-ai-literacy-framework', 'anthropic-economic-index', 'anthropic-observed-exposure', 'openai-gdpval', 'bls-ai-mlr-2025', 'wcag-22', 'nist-ai-rmf', 'owasp-file-upload', 'supabase-edge-functions', 'ada-ai-hiring-guidance', 'eeoc-employment-selection-procedures', 'cfpb-employment-algorithmic-scores', 'iso-42001', 'esco', 'lightcast', 'workera-positioning', 'serpapi', 'llm-output'],
    expectedSnippets: ['export const SOURCE_MANIFEST', 'claimBoundary', 'adapter-ready'],
    caveat: 'Commercial source registry; adapter-ready records are not imported provider-backed data.',
  },
  {
    id: 'report-evidence-card-module',
    label: 'Report evidence card renderer',
    path: 'src/lib/reportEvidenceCards.ts',
    type: 'report-runtime',
    sourceIds: ['onet', 'bls-ai-mlr-2025', 'nist-ai-rmf', 'llm-output'],
    expectedSnippets: ['export interface EvidenceCard', 'doesNotProve', 'reviewStatus', 'renderEvidenceCardsHtml'],
    caveat: 'Shared report evidence card renderer; evidence cards still depend on correct source assignment in each report flow.',
  },
  {
    id: 'career-center-cohort-proof-pack-module',
    label: 'Career-center cohort proof pack renderer',
    path: 'src/lib/careerCenterCohortProofPack.ts',
    type: 'report-runtime',
    sourceIds: ['onet', 'ferpa-student-privacy', 'nace-career-readiness', 'nace-first-destination', 'dol-ai-literacy-framework', 'bls-oews', 'bls-laus', 'bls-qcew', 'census-acs-api', 'wef-foj-2025', 'anthropic-observed-exposure', 'openai-gdpval', 'bls-ai-mlr-2025', 'nist-ai-rmf', 'wcag-22', 'llm-output'],
    expectedSnippets: ['CareerCenterCohortProofPack', 'buildCareerCenterCohortProofPack', 'buildCareerCenterCohortCsv', 'renderCareerCenterCohortProofPackHtml', 'data-career-center-cohort-proof-pack="true"', 'Career Center Cohort Evidence Cards', 'Aggregate reporting only', 'Outcome and placement boundary'],
    caveat: 'Career-center cohort proof packs are aggregate-only planning artifacts; live batch consent, institution-approved outcome reporting, and artifact persistence remain pending.',
  },
  {
    id: 'work-transition-proof-pack-module',
    label: 'AI work transition proof pack renderer',
    path: 'src/lib/workTransitionProofPack.ts',
    type: 'report-runtime',
    sourceIds: ['onet', 'wef-foj-2025', 'oecd-skills-outlook-2025', 'ai-workforce-consortium-2025', 'nace-career-readiness', 'dol-ai-literacy-framework', 'anthropic-economic-index', 'anthropic-observed-exposure', 'openai-gdpval', 'bls-ai-mlr-2025', 'bls-oews', 'bls-laus', 'bls-qcew', 'careeronestop-api', 'census-acs-api', 'wcag-22', 'nist-ai-rmf', 'ada-ai-hiring-guidance', 'esco', 'lightcast', 'serpapi', 'llm-output'],
    expectedSnippets: ['AI_ERA_ROLE_RADAR', 'TaskExposureBucket', 'SkillChangeStatus', 'LearningProviderBoundary', 'LocalLaborMarketSignal', 'local-labor-market-appendix', 'ProofPackSectionReview', 'getTransitionProofPackReviewMetadata', 'renderTransitionProofPackHtml', 'Source caveat', 'Role validation'],
    caveat: 'Emerging role radar, skill-change ledger, learning/provider boundary, local labor-market appendix, and section-level review workflow are planning signals; provider-backed market validation remains adapter-ready.',
  },
  {
    id: 'local-labor-market-snapshot-module',
    label: 'Local labor-market snapshot packet',
    path: 'src/lib/localLaborMarketSnapshot.ts',
    type: 'report-runtime',
    sourceIds: ['bls-oews', 'bls-laus', 'bls-qcew', 'careeronestop-api', 'census-acs-api', 'serpapi', 'lightcast'],
    expectedSnippets: ['LocalMarketSnapshotPacket', 'buildLocalLaborMarketSnapshotPacket', 'buildLocalLaborMarketSnapshotCsv', 'renderLocalLaborMarketSnapshotHtml', 'data-local-labor-market-snapshot="true"', 'BLS OEWS wage and employment context', 'BLS LAUS local labor-force pressure', 'BLS QCEW industry employment base', 'CareerOneStop occupation and training cross-check', 'Census ACS local access context', 'Reviewed posting snapshot', 'Licensed market-intelligence adapter', 'requiredSourceMetadata', 'claimBoundaries'],
    caveat: 'Buyer-ready local-market snapshot template; it does not prove local hiring demand, wages, placement outcomes, provider quality, or licensed market-intelligence depth until geography, source vintage, query metadata, and reviewer notes are attached.',
  },
  {
    id: 'report-provenance-module',
    label: 'Report provenance renderer',
    path: 'src/lib/reportProvenance.ts',
    type: 'report-runtime',
    sourceIds: ['onet', 'bls-emp', 'bls-oews', 'wef-foj-2025', 'llm-output'],
    expectedSnippets: ['renderReportProvenanceHtml', 'REPORT_TRUST_NOTICES', 'getReportSourceSnapshot'],
    caveat: 'Runtime report trust layer; each generated report still needs its own source snapshot and artifact event history.',
  },
  {
    id: 'workforce-executive-report-module',
    label: 'Workforce executive report artifact renderer',
    path: 'src/lib/workforceExecutiveReport.ts',
    type: 'report-runtime',
    sourceIds: ['onet', 'bls-emp', 'bls-oews', 'wef-foj-2025', 'llm-output'],
    expectedSnippets: ['buildWorkforceExecutiveReportHtml', 'downloadWorkforceExecutiveReport', 'Workforce Report Source Provenance'],
    caveat: 'Client-side pilot artifact renderer; final enterprise reporting still needs signed storage, PDF generation, and delivery/audit events.',
  },
  {
    id: 'commercial-report-artifacts-module',
    label: 'Commercial report artifact review runtime',
    path: 'src/lib/commercialReportArtifacts.ts',
    type: 'report-runtime',
    sourceIds: ['nist-ai-rmf', 'ada-ai-hiring-guidance', 'iso-42001', 'llm-output'],
    expectedSnippets: ['buildProofPackReviewAttestation', 'human_review_attestation', 'CommercialReportDeliveryPacket', 'buildCommercialReportDeliveryPacket', 'renderCommercialReportDeliveryPacketHtml', 'proof_pack_delivery_packet', 'reportHtmlHash', 'snapshotHash', 'legalSignature: false', 'isSupabaseConfigured', 'Supabase report artifact storage is not configured in this environment'],
    caveat: 'Review attestation and delivery packet are non-legal delivery traceability artifacts, not electronic signatures, compliance certifications, or employment-selection validations.',
  },
  {
    id: 'resume-deletion-receipt-client',
    label: 'Resume analysis deletion receipt client',
    path: 'src/lib/resumeAnalysisPrivacy.ts',
    type: 'privacy-runtime',
    sourceIds: ['nist-ai-rmf', 'ada-ai-hiring-guidance', 'eeoc-employment-selection-procedures', 'cfpb-employment-algorithmic-scores', 'llm-output'],
    expectedSnippets: ['ResumeDeletionReceipt', 'deleteResumeAnalysisWithReceipt', 'delete_resume_analysis_with_receipt', 'receiptHash', 'modelProviderBoundary'],
    caveat: 'Deletion receipt client proves an app-level saved analysis deletion request can return a bounded receipt; it does not prove external provider logs, exports, or backups are deleted.',
  },
  {
    id: 'resume-deletion-receipt-migration',
    label: 'Resume analysis deletion receipt migration',
    path: 'supabase/migrations/20260524000400_add_resume_deletion_receipts.sql',
    type: 'supabase-migration',
    sourceIds: ['nist-ai-rmf', 'ada-ai-hiring-guidance', 'eeoc-employment-selection-procedures', 'cfpb-employment-algorithmic-scores', 'llm-output'],
    expectedSnippets: ['resume_analysis_deletion_receipts', 'delete_resume_analysis_with_receipt', 'raw_text_retention_policy', 'model_provider_boundary', 'receipt_hash', 'Deletion receipt proves app-row deletion only'],
    caveat: 'Deletion receipts are app-level proof for the resume_analyses row and do not certify legal compliance, backup deletion, or model-provider retention behavior.',
  },
  {
    id: 'resume-analysis-edge-retention-boundary',
    label: 'Resume analysis edge-function retention boundary',
    path: 'supabase/functions/analyze-resume/index.ts',
    type: 'edge-function',
    sourceIds: ['nist-ai-rmf', 'ada-ai-hiring-guidance', 'owasp-file-upload', 'supabase-edge-functions', 'llm-output'],
    expectedSnippets: ['buildRetainedResumeStub', 'buildResumeAnalysisProofPack', 'resume_analysis_proof_boundary', 'resume-risk-score-boundary', 'resume-parser-retention-boundary', 'resume-server-parser-boundary', 'parser_receipt', 'serverParserReceiptId', 'proof_pack_summary', 'raw_resume_text_stored: false', 'saved_record_text_policy', 'deletion_receipt_available', 'model-provider logs, browser files, exports, and backups are outside this receipt'],
    caveat: 'Edge-function proof metadata documents raw-text redaction, parser receipt linkage, receipt availability, source-labeled evidence cards, and employment-decision boundaries; live deployment and provider-log controls must still be verified separately.',
  },
  {
    id: 'resume-server-parser-edge-boundary',
    label: 'Resume server-side parser boundary Edge Function',
    path: 'supabase/functions/parse-resume/index.ts',
    type: 'edge-function',
    sourceIds: ['owasp-file-upload', 'supabase-edge-functions', 'nist-ai-rmf', 'ada-ai-hiring-guidance'],
    expectedSnippets: ['MAX_RESUME_UPLOAD_BYTES', 'multipart/form-data', 'extension_allowlist', 'file_signature_check', 'max_upload_size_2mb', 'candidateFile.size > MAX_RESUME_UPLOAD_BYTES', 'no_public_storage_write', 'no_raw_resume_text_persistence', 'parser_adapter_pending', 'productionPdfDocxParser: false', 'not_computed_file_too_large', 'rawFileStored: false', 'rawResumeTextStored: false', 'deletionStatus: "not_persisted"', 'doesNotProve'],
    caveat: 'Parser boundary validates uploads, extracts text only for UTF-8 text files, and records non-persistence proof; PDF/DOC/DOCX extraction and malware scanning remain adapter-pending before paid upload workflows.',
  },
  {
    id: 'resume-parser-live-verifier',
    label: 'Live resume parser receipt verifier',
    path: 'scripts/verify-resume-parser-live.mjs',
    type: 'live-verifier',
    sourceIds: ['owasp-file-upload', 'supabase-edge-functions', 'nist-ai-rmf', 'ada-ai-hiring-guidance'],
    expectedSnippets: ['live-edge-function-parser-boundary', '/functions/v1/parse-resume', 'txt-success-boundary', 'pdf-adapter-pending-boundary', 'unsupported-file-rejection', 'rawFileStored must be false', 'rawResumeTextStored must be false', 'productionPdfDocxParser must be false until adapter proof exists', 'allow-missing-env'],
    caveat: 'Non-mutating deployed Edge Function proof gate; requires a project URL and anon key and proves only synthetic parser receipt behavior, not migration application, malware scanning, authenticated artifact e2e, or production PDF/DOC/DOCX extraction.',
  },
  {
    id: 'resume-analyzer-proof-report-ui',
    label: 'Resume analyzer downloadable proof report UI',
    path: 'src/components/ResumeAnalyzer.tsx',
    type: 'commercial-page',
    sourceIds: ['nist-ai-rmf', 'ada-ai-hiring-guidance', 'eeoc-employment-selection-procedures', 'cfpb-employment-algorithmic-scores', 'owasp-file-upload', 'supabase-edge-functions', 'wcag-22', 'llm-output'],
    expectedSnippets: ['getResumeProofReportHtml', 'parseResumeFileServerSide', "serverParse.error !== 'parser_adapter_pending'", 'Upload blocked by parser boundary', 'data-resume-proof-report="true"', 'data-resume-proof-report-redacted', 'data-resume-proof-artifact-boundary="true"', 'data-resume-server-parser-receipt="true"', 'data-resume-parser-receipt-boundary="true"', 'Resume Work Transition Proof Report', 'Download Proof Report', 'Save Redacted Artifact', 'Copy Rewrite Drafts', 'coaching draft only', 'resume-server-parser-boundary', 'Not a hiring, firing, promotion, compensation, layoff, screening, or eligibility decision tool'],
    caveat: 'Resume proof report download is a client-side coaching artifact; saved resume proof artifacts are redacted and user-owned. Production PDF/DOCX parsing, live parser deployment, external provider retention controls, and employment-decision validation remain separate work.',
  },
  {
    id: 'resume-proof-report-artifact-client',
    label: 'Resume proof-report artifact client',
    path: 'src/lib/resumeProofReportArtifacts.ts',
    type: 'privacy-runtime',
    sourceIds: ['nist-ai-rmf', 'ada-ai-hiring-guidance', 'eeoc-employment-selection-procedures', 'cfpb-employment-algorithmic-scores', 'llm-output'],
    expectedSnippets: ['createResumeProofReportArtifact', 'deleteResumeProofReportArtifactWithReceipt', 'create_resume_proof_report_artifact', 'delete_resume_proof_report_artifact_with_receipt', 'reportHtmlRedacted', 'resumeDetailRowsRedacted', 'rawResumeTextStored'],
    caveat: 'Client helper saves only redacted resume proof-report artifacts when Supabase is configured and the user is authenticated; it does not prove the target Supabase migration is applied or that external provider logs/backups are deleted.',
  },
  {
    id: 'resume-proof-report-artifact-migration',
    label: 'Resume proof-report artifact migration',
    path: 'supabase/migrations/20260524000500_add_resume_proof_report_artifacts.sql',
    type: 'supabase-migration',
    sourceIds: ['nist-ai-rmf', 'ada-ai-hiring-guidance', 'eeoc-employment-selection-procedures', 'cfpb-employment-algorithmic-scores', 'llm-output'],
    expectedSnippets: ['resume_proof_report_artifacts', 'resume_proof_report_artifact_deletion_receipts', 'create_resume_proof_report_artifact', 'delete_resume_proof_report_artifact_with_receipt', 'data-resume-proof-report-redacted="true"', 'Raw resume text stored: no', 'raw_resume_text_stored BOOLEAN NOT NULL DEFAULT FALSE', 'resume_detail_rows_redacted BOOLEAN NOT NULL DEFAULT TRUE', 'CHECK (raw_resume_text_stored = FALSE)', 'CHECK (resume_detail_rows_redacted = TRUE)', 'Users can read own redacted resume proof artifacts', 'GRANT SELECT ON public.resume_proof_report_artifacts TO authenticated'],
    caveat: 'Schema adds authenticated user-owned redacted artifact persistence and app-level deletion receipts; it does not apply itself to the live Supabase target or certify external retention deletion.',
  },
  {
    id: 'proof-pack-gallery-page',
    label: 'Phase 6 proof-pack gallery and outreach CSV',
    path: 'src/pages/ProofPackGalleryPage.tsx',
    type: 'commercial-page',
    sourceIds: ['nace-career-readiness', 'nace-first-destination', 'ferpa-student-privacy', 'dol-ai-literacy-framework', 'nist-ai-rmf', 'ada-ai-hiring-guidance', 'wcag-22', 'lightcast', 'workera-positioning', 'serpapi', 'llm-output'],
    expectedSnippets: ['data-proof-pack-gallery="phase-6-outreach"', 'career-center-cohort-report', 'Institutional readiness packet', 'Trust HTML', 'Risk CSV', 'Local market snapshot pack', 'Snapshot HTML', 'Snapshot CSV', 'data-local-market-snapshot-gallery="true"', 'CRM import pack', 'buildOutreachCsv', 'outreachEvidenceCards', 'source_ids', 'does_not_prove', 'NACE career readiness', 'NACE first-destination standards', 'FERPA student privacy', 'DOL AI literacy framework', 'Lightcast positioning', 'Workera positioning'],
    caveat: 'Public sample gallery, institutional readiness packet, local labor-market snapshot packet, and CRM import CSV are outreach enablement artifacts; they do not prove live CRM automation, deployed-domain analytics, local hiring demand, or institutional compliance.',
  },
  {
    id: 'institutional-readiness-packet-module',
    label: 'Institutional readiness risk packet',
    path: 'src/lib/institutionalReadinessPacket.ts',
    type: 'commercial-page',
    sourceIds: ['nist-ai-rmf', 'iso-42001', 'wcag-22', 'ada-ai-hiring-guidance', 'eeoc-employment-selection-procedures', 'cfpb-employment-algorithmic-scores', 'onet-task-ratings', 'lightcast', 'esco', 'serpapi', 'llm-output'],
    expectedSnippets: ['InstitutionalReadinessPacket', 'Institutional Risk Register', 'AI RMF Control Map', 'Employment Decision Boundary', 'WCAG 2.2 Accessibility Gate', 'Institutional Acceptance Gates', 'blocked_live_credentials', 'buyer_policy_required', 'Do not furnish individual reports to employers for employment purposes', 'Do not claim WCAG conformance', 'SUPABASE_DB_PASSWORD'],
    caveat: 'Institutional readiness packet is a buyer-review trust artifact; it does not certify WCAG conformance, legal compliance, employment-selection validation, or live Supabase state.',
  },
  {
    id: 'commercial-accessibility-audit-json',
    label: 'Commercial accessibility audit JSON artifact',
    path: 'docs/commercialization/commercial-accessibility-audit-latest.json',
    type: 'verification-artifact',
    sourceIds: ['wcag-22', 'ada-ai-hiring-guidance', 'llm-output'],
    expectedSnippets: ['automated_smoke_passed_manual_wcag_required', 'not a WCAG conformance claim', 'manualReviewChecklist', 'WCAG-EM', 'Focus Not Obscured', 'Target Size', 'Accessible Authentication', 'WAI Easy Checks', 'WAI-ARIA Authoring Practices'],
    caveat: 'Generated responsive/accessibility smoke artifact for scoped commercial routes; manual WCAG 2.2, screen-reader, contrast, form-error, and authentication review remains required before institutional delivery.',
  },
  {
    id: 'commercial-accessibility-audit-markdown',
    label: 'Commercial accessibility audit Markdown packet',
    path: 'docs/commercialization/commercial-accessibility-audit-latest.md',
    type: 'verification-artifact',
    sourceIds: ['wcag-22', 'ada-ai-hiring-guidance', 'llm-output'],
    expectedSnippets: ['Commercial WCAG 2.2 Accessibility Audit Packet', 'automated_smoke_passed_manual_wcag_required', 'not a WCAG conformance claim', 'Manual WCAG 2.2 Review Checklist', 'wcag-em-scope', 'focus-not-obscured', 'target-size', 'accessible-authentication', 'screen-reader-and-name-role-value', 'WAI-ARIA Authoring Practices', 'WCAG-EM'],
    caveat: 'Human-readable audit packet for buyer review; it is not a formal WCAG conformance statement and requires completed manual evidence before institutional delivery.',
  },
  {
    id: 'commercial-proof-pack-ci-workflow-template',
    label: 'Commercial proof-pack CI workflow template',
    path: 'docs/commercialization/commercial-proof-pack.workflow.yml',
    type: 'ci-workflow-template',
    sourceIds: ['nist-ai-rmf', 'wcag-22', 'llm-output'],
    expectedSnippets: ['name: Commercial Proof Pack', 'permissions:', 'contents: read', 'npm run verify:commercial -- --with-a11y --with-journey', 'npm run verify:commercial-network'],
    caveat: 'Reference workflow template for commercial proof-pack CI; the installed .github workflow and hosted run evidence are tracked separately.',
  },
  {
    id: 'commercial-proof-pack-ci-workflow-installed',
    label: 'Commercial proof-pack CI workflow installed',
    path: '.github/workflows/commercial-proof-pack.yml',
    type: 'ci-workflow',
    sourceIds: ['nist-ai-rmf', 'wcag-22', 'llm-output'],
    expectedSnippets: ['name: Commercial Proof Pack', 'permissions:', 'contents: read', 'npm run verify:commercial -- --with-a11y --with-journey', 'npm run verify:commercial-network'],
    caveat: 'Installed GitHub Actions workflow runs commercial proof-pack gates on push/PR; hosted green-run evidence must still be inspected after push.',
  },
  {
    id: 'commercial-live-supabase-verifier',
    label: 'Live Supabase commercial boundary verifier',
    path: 'scripts/verify-commercial-live-supabase.mjs',
    type: 'live-verifier',
    sourceIds: ['nist-ai-rmf', 'ada-ai-hiring-guidance', 'iso-42001', 'llm-output'],
    expectedSnippets: ['resume_analysis_deletion_receipts', 'delete_resume_analysis_with_receipt', 'resume_proof_report_artifacts', 'create_resume_proof_report_artifact', 'delete_resume_proof_report_artifact_with_receipt', 'log_commercial_report_artifact_event', 'non-mutating-public-api-boundary', 'missing-object-or-schema-cache', 'allow-missing-env'],
    caveat: 'Non-mutating deployed Supabase proof gate; requires a project URL and anon key and does not apply migrations, seed staff users, or prove authenticated resume artifact save/delete e2e.',
  },
  {
    id: 'commercial-supabase-deployment-packet',
    label: 'Commercial Supabase deployment packet generator',
    path: 'scripts/generate-commercial-supabase-deployment-packet.mjs',
    type: 'deployment-verifier',
    sourceIds: ['nist-ai-rmf', 'iso-42001', 'llm-output'],
    expectedSnippets: ['live-supabase-deployment-packet.json', 'live-supabase-deployment-runbook.md', 'SUPABASE_DB_PASSWORD', 'supabase db push --dry-run', 'supabase db push', "NOTIFY pgrst, 'reload schema'", 'combinedSqlSha256'],
    caveat: 'Deployment packet proves local migration ordering, hashes, and guardrail checks; it does not apply migrations or prove remote schema state without credentials.',
  },
  {
    id: 'commercial-supabase-deployment-runbook',
    label: 'Commercial Supabase deployment runbook',
    path: 'docs/commercialization/live-supabase-deployment-runbook.md',
    type: 'deployment-runbook',
    sourceIds: ['nist-ai-rmf', 'iso-42001', 'llm-output'],
    expectedSnippets: ['Live Supabase Deployment Runbook', 'SUPABASE_DB_PASSWORD', 'supabase migration list', 'supabase db push --dry-run', 'supabase db push', "NOTIFY pgrst, 'reload schema'", 'npm run verify:commercial-live-supabase', 'npm run verify:resume-parser-live', 'npm run verify:onet-task-ratings-live'],
    caveat: 'Runbook gives the credential-gated production deployment and verification sequence; it does not replace live migration proof or authenticated e2e checks.',
  },
  {
    id: 'onet-task-ratings-live-verifier',
    label: 'Live O*NET Task Ratings deployed proof verifier',
    path: 'scripts/verify-onet-task-ratings-live.mjs',
    type: 'live-verifier',
    sourceIds: ['onet', 'onet-task-statements', 'onet-task-ratings', 'onet-task-categories', 'onet-scales-reference'],
    expectedSnippets: ['onet_detailed_tasks', 'task_ratings_ingested_at', 'metadata-not-ingested', 'missing-column-or-schema-cache', 'non-mutating-public-api-task-rating-boundary', 'allow-missing-env'],
    caveat: 'Non-mutating deployed Supabase proof gate; requires a project URL and anon key and proves only schema/row presence, not migration application, ingest execution, or task-time precision.',
  },
  {
    id: 'onet-task-rating-metadata-migration',
    label: 'O*NET Task Rating metadata migration',
    path: 'supabase/migrations/20260524000300_add_onet_task_rating_metadata.sql',
    type: 'supabase-migration',
    sourceIds: ['onet', 'onet-task-statements', 'onet-task-ratings', 'onet-task-categories', 'onet-scales-reference'],
    expectedSnippets: ['onet_release_version', 'relevance_value', 'importance_n', 'frequency_category', 'frequency_percent', 'task_ratings_ingested_at'],
    caveat: 'Schema support for O*NET Task Ratings does not prove the migration has been applied or populated in the target Supabase project.',
  },
  {
    id: 'artifact-review-event-migration',
    label: 'Artifact review event migration',
    path: 'supabase/migrations/20260524000200_add_commercial_artifact_review_events.sql',
    type: 'supabase-migration',
    sourceIds: ['nist-ai-rmf', 'ada-ai-hiring-guidance', 'llm-output'],
    expectedSnippets: ['section_review_updated', 'section_client_ready', 'artifact_client_ready', 'log_commercial_report_artifact_event'],
    caveat: 'Staff review events create an append-only readiness trail; they do not replace legal, accessibility, or labor-relations review.',
  },
];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function countRows(source, type) {
  const lines = source.split(/\r?\n/).filter((line) => line.length > 0);
  if (type === 'csv') return Math.max(0, lines.length - 1);
  return lines.length;
}

function parseCsvHeader(source) {
  const [header = ''] = source.split(/\r?\n/, 1);
  return header.split(',').map((value) => value.trim());
}

function validateArtifactSource(artifact, source) {
  const failures = [];

  if (artifact.expectedHeaders) {
    const headers = parseCsvHeader(source);
    for (const header of artifact.expectedHeaders) {
      if (!headers.includes(header)) failures.push(`missing CSV header ${header}`);
    }
  }

  if (artifact.expectedSnippets) {
    for (const snippet of artifact.expectedSnippets) {
      if (!source.includes(snippet)) failures.push(`missing snippet ${snippet}`);
    }
  }

  return failures;
}

async function loadSourceVerification() {
  try {
    const parsed = JSON.parse(await readFile(SOURCE_VERIFICATION_PATH, 'utf8'));
    const passedIds = new Set(
      Array.isArray(parsed.results)
        ? parsed.results.filter((result) => result.passed).map((result) => result.id)
        : []
    );
    return {
      generatedAt: parsed.generatedAt || null,
      allPassed: parsed.allPassed === true,
      passedIds,
    };
  } catch {
    return {
      generatedAt: null,
      allPassed: false,
      passedIds: new Set(),
    };
  }
}

async function verifyManifestSourceIds() {
  const source = await readFile(SOURCE_MANIFEST_PATH, 'utf8');
  const ids = new Set(Array.from(source.matchAll(/id:\s*'([^']+)'/g), (match) => match[1]));
  const missing = artifacts.flatMap((artifact) =>
    artifact.sourceIds.filter((sourceId) => !ids.has(sourceId)).map((sourceId) => `${artifact.id}:${sourceId}`)
  );

  if (missing.length > 0) {
    throw new Error(`Data provenance references source IDs missing from source manifest: ${missing.join(', ')}`);
  }

  return ids;
}

function renderMarkdown(index) {
  const rows = index.artifacts.map((artifact) => [
    `\`${artifact.id}\``,
    artifact.label,
    `\`${artifact.path}\``,
    artifact.type,
    artifact.rows.toLocaleString(),
    `\`${artifact.sha256.slice(0, 16)}...\``,
    artifact.sourceIds.map((id) => `\`${id}\``).join(', '),
    artifact.passed ? 'pass' : `fail: ${artifact.failures.join('; ')}`,
  ]);

  const table = [
    '| Artifact | Label | Path | Type | Rows/Lines | SHA-256 | Source IDs | Status |',
    '|---|---|---|---|---:|---|---|---|',
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');

  return `# Data Provenance Checksums

Generated: ${index.generatedAt}
Source verification artifact: \`${SOURCE_VERIFICATION_PATH}\`
Source verification generated: ${index.sourceVerification.generatedAt || 'not available'}
All referenced current-source checks passed: ${index.sourceVerification.allPassed ? 'yes' : 'no'}
Current-source verification required for this local checksum pass: ${index.sourceVerification.requiredForPass ? 'yes' : 'no'}

This file records hash-level evidence for local commercial data artifacts and source/provenance code used by the proof-pack flows. It is not a substitute for licensed provider imports, but it prevents silent drift in the current seed data and ingestion boundaries.

${table}

## Caveats

${index.artifacts.map((artifact) => `- \`${artifact.id}\`: ${artifact.caveat}`).join('\n')}
`;
}

async function main() {
  const shouldWrite = process.argv.includes('--write');
  const requireSourceVerification = process.argv.includes('--require-source-verification');
  await verifyManifestSourceIds();
  const sourceVerification = await loadSourceVerification();

  const results = [];
  for (const artifact of artifacts) {
    const source = await readFile(artifact.path, 'utf8');
    const failures = validateArtifactSource(artifact, source);
    if (requireSourceVerification) {
      const unverifiedCurrentSourceIds = artifact.sourceIds.filter((sourceId) => {
        if (['lightcast', 'serpapi'].includes(sourceId)) return false;
        return !sourceVerification.passedIds.has(sourceId);
      });
      for (const sourceId of unverifiedCurrentSourceIds) {
        failures.push(`source verification not passing for ${sourceId}`);
      }
    }

    const result = {
      ...artifact,
      bytes: Buffer.byteLength(source),
      rows: countRows(source, artifact.type),
      sha256: sha256(source),
      failures,
      passed: failures.length === 0,
    };
    results.push(result);
    console.log(`${result.passed ? 'ok' : 'fail'} ${artifact.id} - ${artifact.label}`);
  }

  const index = {
    generatedAt: new Date().toISOString(),
    sourceManifestPath: SOURCE_MANIFEST_PATH,
    sourceVerificationPath: SOURCE_VERIFICATION_PATH,
    sourceVerification: {
      generatedAt: sourceVerification.generatedAt,
      allPassed: sourceVerification.allPassed,
      requiredForPass: requireSourceVerification,
    },
    allPassed: results.every((result) => result.passed),
    artifacts: results,
  };

  if (shouldWrite) {
    await mkdir('docs/commercialization', { recursive: true });
    await writeFile(JSON_OUTPUT, `${JSON.stringify(index, null, 2)}\n`);
    await writeFile(MD_OUTPUT, renderMarkdown(index));
    console.log(`wrote ${JSON_OUTPUT}`);
    console.log(`wrote ${MD_OUTPUT}`);
  }

  if (!index.allPassed) {
    process.exitCode = 1;
  }
}

await main();

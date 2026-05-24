#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const checks = [
  {
    id: 'supabase-env-fallback',
    file: 'src/integrations/supabase/client.ts',
    expected: [
      /export const isSupabaseConfigured = Boolean/,
      /Public pages will render/,
      /supabase-disabled\.invalid/,
      /persistSession: isSupabaseConfigured/,
    ],
  },
  {
    id: 'privacy-route',
    file: 'src/App.tsx',
    expected: [
      /const PrivacyPage = lazy\(\(\) => import\("\.\/pages\/PrivacyPage"\)\)/,
      /const ProofPackGalleryPage = lazy\(\(\) => import\("\.\/pages\/ProofPackGalleryPage"\)\)/,
      /path="\/privacy"/,
      /path="\/proof-pack-gallery"/,
    ],
  },
  {
    id: 'privacy-page-content',
    file: 'src/pages/PrivacyPage.tsx',
    expected: [
      /Privacy Policy/,
      /Local Fallback Queue/,
      /seven days/,
      /employment decisions/,
    ],
  },
  {
    id: 'seo-consent-privacy-link',
    file: 'src/components/SEOReportDownload.tsx',
    expected: [
      /<Link to="\/privacy"/,
      /disabled=\{loading \|\| !consentToContact\}/,
      /not an employment decision system/,
    ],
  },
  {
    id: 'coach-consent-privacy-link',
    file: 'src/pages/SampleReportPage.tsx',
    expected: [
      /<Link to="\/privacy"/,
      /disabled=\{isSavingArtifact \|\| captureConsentMissing\}/,
      /coachConsentText/,
    ],
  },
  {
    id: 'offline-queue-redaction',
    file: 'src/lib/commercialLeads.ts',
    expected: [
      /OFFLINE_QUEUE_TTL_MS = 7 \* 24 \* 60 \* 60 \* 1000/,
      /offline_queue_redacted_report_html/,
      /report_html: null/,
      /flushQueuedCommercialLeads/,
    ],
  },
  {
    id: 'resume-deletion-receipt-rpc',
    file: 'supabase/migrations/20260524000400_add_resume_deletion_receipts.sql',
    expected: [
      /resume_analysis_deletion_receipts/,
      /delete_resume_analysis_with_receipt/,
      /receipt_hash/,
      /raw_text_retention_policy/,
      /model_provider_boundary/,
      /Deletion receipt proves app-row deletion only/,
      /GRANT EXECUTE ON FUNCTION public\.delete_resume_analysis_with_receipt/,
    ],
  },
  {
    id: 'resume-deletion-receipt-client',
    file: 'src/lib/resumeAnalysisPrivacy.ts',
    expected: [
      /ResumeDeletionReceipt/,
      /deleteResumeAnalysisWithReceipt/,
      /delete_resume_analysis_with_receipt/,
      /sourceIds/,
      /receiptHash/,
    ],
  },
  {
    id: 'resume-deletion-receipt-ui',
    file: 'src/components/ResumeAnalyzer.tsx',
    expected: [
      /deleteResumeAnalysisWithReceipt/,
      /data-resume-deletion-receipt="true"/,
      /Deletion Receipt Created/,
      /Receipt hash:/,
      /modelProviderBoundary/,
      /Sources:/,
      /Caveat:/,
    ],
  },
  {
    id: 'resume-analysis-retention-boundary',
    file: 'supabase/functions/analyze-resume/index.ts',
    expected: [
      /buildRetainedResumeStub/,
      /raw_resume_text_stored: false/,
      /saved_record_text_policy/,
      /deletion_receipt_available/,
      /model-provider logs, browser files, exports, and backups are outside this receipt/,
    ],
  },
  {
    id: 'expanded-source-guardrails',
    file: 'src/lib/sourceManifest.ts',
    expected: [
      /id: 'anthropic-observed-exposure'/,
      /id: 'oecd-skills-outlook-2025'/,
      /id: 'ai-workforce-consortium-2025'/,
      /id: 'nace-career-readiness'/,
      /id: 'nace-first-destination'/,
      /id: 'ferpa-student-privacy'/,
      /id: 'dol-ai-literacy-framework'/,
      /id: 'bls-laus'/,
      /id: 'bls-qcew'/,
      /id: 'careeronestop-api'/,
      /id: 'census-acs-api'/,
      /id: 'wcag-22'/,
      /id: 'ada-ai-hiring-guidance'/,
      /id: 'iso-42001'/,
      /id: 'workera-positioning'/,
      /Task Ratings importance\/frequency fields/,
      /Do not claim WCAG conformance/,
    ],
  },
  {
    id: 'commercial-smoke-privacy-route',
    file: 'scripts/smoke-commercial-routes.mjs',
    expected: [/path: '\/privacy'/, /path: '\/proof-pack-gallery'/],
  },
  {
    id: 'proof-pack-gallery-page',
    file: 'src/pages/ProofPackGalleryPage.tsx',
    expected: [
      /data-proof-pack-gallery="phase-6-outreach"/,
      /individual-transition-report/,
      /coach-branded-sample/,
      /workforce-csv-audit/,
      /career-center-cohort-report/,
      /CRM import pack/,
      /CRM CSV/,
      /Planning artifact only/,
      /data-phase6-evidence-cards="true"/,
      /Sources:/,
      /Confidence:/,
      /Review state:/,
      /Does not prove:/,
      /NACE career readiness/,
      /NACE first-destination standards/,
      /FERPA student privacy/,
      /DOL AI literacy framework/,
      /Lightcast positioning/,
      /Workera positioning/,
      /must not be used for/,
    ],
  },
  {
    id: 'career-center-cohort-proof-pack-module',
    file: 'src/lib/careerCenterCohortProofPack.ts',
    expected: [
      /buildCareerCenterCohortProofPack/,
      /buildCareerCenterCohortCsv/,
      /renderCareerCenterCohortProofPackHtml/,
      /data-career-center-cohort-proof-pack="true"/,
      /Career Center Cohort Evidence Cards/,
      /Aggregate reporting only/,
      /Outcome and placement boundary/,
      /ferpa-student-privacy/,
      /nace-first-destination/,
      /doesNotProve/,
    ],
  },
  {
    id: 'counselor-cohort-proof-pack-ui',
    file: 'src/components/CounselorReportGenerator.tsx',
    expected: [
      /buildCareerCenterCohortProofPack/,
      /renderCareerCenterCohortProofPackHtml/,
      /buildCareerCenterCohortCsv/,
      /data-career-center-cohort-pack="true"/,
      /Cohort HTML/,
      /Cohort CSV/,
      /aggregate-only/,
      /student names, IDs, resumes/,
    ],
  },
  {
    id: 'commercial-browser-verifier',
    file: 'scripts/verify-commercial-browser.mjs',
    expected: [
      /verifyCoachSampleReport/,
      /verifySeoReportDownload/,
      /verifyWorkforceAuditBuilder/,
      /verifyCounselorCohortProofPack/,
      /verifyProofPackGallery/,
      /verifyOfflineQueueRedaction/,
      /career-center-cohort-report/,
      /Weight basis/,
      /Cohort HTML/,
      /Cohort CSV/,
      /CRM CSV/,
      /FERPA/,
      /NACE/,
      /source_ids/,
      /does_not_prove/,
    ],
  },
  {
    id: 'commercial-codebase-index-script',
    file: 'package.json',
    expected: [
      /"index:commercial": "node scripts\/generate-commercialization-index\.mjs"/,
      /"lint:commercial": "node scripts\/lint-commercial-scope\.mjs"/,
      /"verify:commercial": "node scripts\/verify-commercial-release\.mjs"/,
      /"verify:commercial-a11y": "node scripts\/verify-commercial-accessibility\.mjs"/,
      /"verify:commercial-browser": "node scripts\/verify-commercial-browser\.mjs"/,
      /"verify:commercial-full": "node scripts\/verify-commercial-release\.mjs --with-a11y --with-network --with-journey"/,
      /"verify:data-provenance": "node scripts\/verify-commercial-data-provenance\.mjs --write"/,
      /"verify:onet-task-ratings": "node scripts\/verify-onet-task-ratings-ingest\.mjs"/,
    ],
  },
  {
    id: 'commercial-release-verifier',
    file: 'scripts/verify-commercial-release.mjs',
    expected: [
      /DEFAULT_STEPS/,
      /NETWORK_STEPS/,
      /JOURNEY_STEPS/,
      /verify-onet-task-ratings-ingest\.mjs/,
      /--with-network/,
      /--with-a11y/,
      /--with-journey/,
    ],
  },
  {
    id: 'commercial-scoped-lint',
    file: 'scripts/lint-commercial-scope.mjs',
    expected: [
      /commercialLintFiles/,
      /src\/components\/SEOReportDownload\.tsx/,
      /src\/pages\/ProofPackGalleryPage\.tsx/,
      /src\/lib\/resumeAnalysisPrivacy\.ts/,
      /scripts\/verify-commercial-release\.mjs/,
      /scripts\/verify-onet-task-ratings-ingest\.mjs/,
      /src\/lib\/workforceExecutiveReport\.ts/,
    ],
  },
  {
    id: 'onet-task-ratings-ingest-boundary',
    file: 'scripts/verify-onet-task-ratings-ingest.mjs',
    expected: [
      /official-onet-source-checks/,
      /task-rating-migration/,
      /deno-task-rating-ingest/,
      /runtime-weighting-boundary/,
      /data-provenance-covers-task-ratings/,
    ],
  },
  {
    id: 'workforce-executive-report-artifact',
    file: 'src/lib/workforceExecutiveReport.ts',
    expected: [
      /buildWorkforceExecutiveReportHtml/,
      /downloadWorkforceExecutiveReport/,
      /not an employment decision system/,
      /Workforce Report Source Provenance/,
    ],
  },
  {
    id: 'commercial-artifact-review-events',
    file: 'supabase/migrations/20260524000200_add_commercial_artifact_review_events.sql',
    expected: [
      /section_review_updated/,
      /section_client_ready/,
      /artifact_client_ready/,
      /actor_user_id/,
      /log_commercial_report_artifact_event/,
    ],
  },
  {
    id: 'commercial-lead-ops-review-ui',
    file: 'src/pages/CommercialLeadOpsPage.tsx',
    expected: [
      /handleReviewSectionTransition/,
      /handleArtifactClientReady/,
      /data-proof-pack-review-section/,
      /proof_pack_review_action/,
      /proof_pack_artifact_client_ready/,
      /proof_pack_review_attestation/,
      /Human review attestation/,
      /Mark client-ready/,
      /Log artifact client-ready/,
      /artifact_client_ready/,
      /Reviewer note/,
    ],
  },
  {
    id: 'commercial-ci-workflow-template',
    file: 'docs/commercialization/commercial-proof-pack.workflow.yml',
    expected: [
      /name: Commercial Proof Pack/,
      /workflow_dispatch:/,
      /schedule:/,
      /permissions:\s*\n\s+contents: read/,
      /npm ci/,
      /npx playwright install --with-deps chromium/,
      /npm run verify:commercial -- --with-a11y --with-journey/,
      /npm run verify:commercial-network/,
    ],
  },
  {
    id: 'commercial-ci-workflow-installed',
    file: '.github/workflows/commercial-proof-pack.yml',
    expected: [
      /name: Commercial Proof Pack/,
      /pull_request:/,
      /push:/,
      /workflow_dispatch:/,
      /schedule:/,
      /permissions:\n  contents: read/,
      /actions\/checkout@v6/,
      /actions\/setup-node@v6/,
      /node-version: 20/,
      /npm ci/,
      /npx playwright install --with-deps chromium/,
      /npm run verify:commercial -- --with-a11y --with-journey/,
      /npm run verify:commercial-network/,
    ],
  },
  {
    id: 'commercial-accessibility-verifier',
    file: 'scripts/verify-commercial-accessibility.mjs',
    expected: [
      /verifyKeyboardFocus/,
      /horizontal overflow/,
      /missing main landmark/,
      /interactive controls missing accessible names/,
    ],
  },
  {
    id: 'commercial-data-provenance-script',
    file: 'scripts/verify-commercial-data-provenance.mjs',
    expected: [
      /wef-economics-csv/,
      /occupation-risk-seed/,
      /onet-ingest-boundary/,
      /onet-task-ratings-ingest-script/,
      /onet-task-rating-metadata-migration/,
      /resume-deletion-receipt-migration/,
      /sha256/,
      /source-verification-latest\.json/,
    ],
  },
  {
    id: 'commercial-data-provenance-docs',
    file: 'docs/commercialization/data-provenance-checksums.md',
    expected: [
      /Data Provenance Checksums/,
      /wef-economics-csv/,
      /occupation-risk-seed/,
      /onet-ingest-boundary/,
      /resume-deletion-receipt-migration/,
    ],
  },
  {
    id: 'commercial-codebase-index-doc',
    file: 'docs/commercialization/commercialization-codebase-index.md',
    expected: [
      /Commercialization Codebase Index/,
      /Indexed Commercial Routes/,
      /Feature-To-Code Map/,
      /Supabase Commercial Persistence Boundary/,
      /resume_analysis_deletion_receipts/,
      /delete_resume_analysis_with_receipt/,
      /Machine-Readable Companion/,
    ],
  },
  {
    id: 'commercial-codebase-index-json',
    file: 'docs/commercialization/commercialization-codebase-index.json',
    expected: [
      /"routes": \[/,
      /"featureMap": \[/,
      /"sourceIds": \[/,
      /"sql": \{/,
    ],
  },
];

async function main() {
  const failures = [];

  for (const check of checks) {
    const source = await readFile(check.file, 'utf8');
    const missing = check.expected.filter((pattern) => !pattern.test(source));

    if (missing.length > 0) {
      failures.push(`${check.id} missing ${missing.length} expected pattern(s) in ${check.file}`);
      console.log(`fail ${check.id}`);
    } else {
      console.log(`ok ${check.id}`);
    }
  }

  if (failures.length > 0) {
    console.error(`\nCommercial trust-boundary verification failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
    process.exitCode = 1;
  }
}

await main();

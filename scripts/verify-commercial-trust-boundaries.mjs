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
      /path="\/privacy"/,
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
    id: 'expanded-source-guardrails',
    file: 'src/lib/sourceManifest.ts',
    expected: [
      /id: 'anthropic-observed-exposure'/,
      /id: 'oecd-skills-outlook-2025'/,
      /id: 'ai-workforce-consortium-2025'/,
      /id: 'wcag-22'/,
      /id: 'ada-ai-hiring-guidance'/,
      /id: 'iso-42001'/,
      /Task Ratings importance\/frequency fields/,
      /Do not claim WCAG conformance/,
    ],
  },
  {
    id: 'commercial-smoke-privacy-route',
    file: 'scripts/smoke-commercial-routes.mjs',
    expected: [/path: '\/privacy'/],
  },
  {
    id: 'commercial-browser-verifier',
    file: 'scripts/verify-commercial-browser.mjs',
    expected: [
      /verifyCoachSampleReport/,
      /verifySeoReportDownload/,
      /verifyWorkforceAuditBuilder/,
      /verifyOfflineQueueRedaction/,
      /Weight basis/,
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
    ],
  },
  {
    id: 'commercial-release-verifier',
    file: 'scripts/verify-commercial-release.mjs',
    expected: [
      /DEFAULT_STEPS/,
      /NETWORK_STEPS/,
      /JOURNEY_STEPS/,
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
      /scripts\/verify-commercial-release\.mjs/,
      /src\/lib\/workforceExecutiveReport\.ts/,
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
      /npm ci/,
      /npx playwright install --with-deps chromium/,
      /npm run verify:commercial -- --with-a11y/,
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

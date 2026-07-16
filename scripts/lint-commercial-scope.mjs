#!/usr/bin/env node

import { spawn } from 'node:child_process';

export const commercialLintFiles = [
  'src/App.tsx',
  'src/components/NavigationPremium.tsx',
  'src/components/ResumeAnalyzer.tsx',
  'src/components/CounselorReportGenerator.tsx',
  'src/components/SEOReportDownload.tsx',
  'src/components/ShareableScoreBadge.tsx',
  'src/components/ui/progress.tsx',
  'src/integrations/supabase/client.ts',
  'src/pages/AutomationRiskLandingPage.tsx',
  'src/pages/EnterpriseTeamDashboard.tsx',
  'src/pages/ForCoachesPage.tsx',
  'src/pages/SampleReportPage.tsx',
  'src/pages/CommercialLeadOpsPage.tsx',
  'src/pages/PrivacyPage.tsx',
  'src/pages/ProofPackGalleryPage.tsx',
  'src/lib/commercialLeadOps.ts',
  'src/lib/commercialLaunchGate.ts',
  'src/lib/commercialLaunchReadiness.ts',
  'src/lib/commercialLeads.ts',
  'src/lib/commercialReportArtifacts.ts',
  'src/lib/commercialWorkforceAudits.ts',
  'src/lib/careerCenterCohortProofPack.ts',
  'src/lib/institutionalReadinessPacket.ts',
  'src/lib/localLaborMarketSnapshot.ts',
  'src/lib/reportProvenance.ts',
  'src/lib/reportEvidenceCards.ts',
  'src/lib/resumeAnalysisPrivacy.ts',
  'src/lib/resumeProofReportArtifacts.ts',
  'src/lib/socSuggestions.ts',
  'src/lib/sourceManifest.ts',
  'src/lib/stripe.ts',
  'src/lib/workTransitionProofPack.ts',
  'src/lib/workforceExecutiveReport.ts',
  'scripts/generate-commercialization-index.mjs',
  'scripts/generate-commercial-supabase-deployment-packet.mjs',
  'scripts/lint-commercial-scope.mjs',
  'scripts/smoke-commercial-routes.mjs',
  'scripts/verify-commercial-accessibility.mjs',
  'scripts/verify-commercial-artifact-redaction.mjs',
  'scripts/verify-commercial-browser.mjs',
  'scripts/verify-commercial-data-provenance.mjs',
  'scripts/verify-commercial-full-local-approval-package-fixtures.mjs',
  'scripts/verify-commercial-full-local-approval-package.mjs',
  'scripts/verify-commercial-live-supabase.mjs',
  'scripts/verify-commercial-release.mjs',
  'scripts/verify-commercial-summary-redaction-alignment.mjs',
  'scripts/verify-commercial-summary-redaction-alignment-fixtures.mjs',
  'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
  'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
  'scripts/verify-commercial-trust-boundaries.mjs',
  'scripts/verify-commercial-evidence-records-fixtures.mjs',
  'scripts/verify-commercial-evidence-intake-sources.mjs',
  'scripts/verify-commercial-evidence-intake-sources-fixtures.mjs',
  'scripts/verify-commercial-evidence-intake-packet-alignment.mjs',
  'scripts/verify-commercial-evidence-intake-packet-alignment-fixtures.mjs',
  'scripts/verify-commercial-worktree-hygiene-fixtures.mjs',
  'scripts/verify-commercial-worktree-hygiene.mjs',
  'scripts/hash-owner-evidence-artifacts.mjs',
  'scripts/verify-manual-wcag-evidence-fixtures.mjs',
  'scripts/verify-manual-wcag-review-packet-alignment.mjs',
  'scripts/verify-manual-wcag-review-packet-alignment-fixtures.mjs',
  'scripts/verify-manual-wcag-review-packet-sources.mjs',
  'scripts/verify-manual-wcag-review-packet-sources-fixtures.mjs',
  'scripts/verify-live-proof-run-packet-alignment.mjs',
  'scripts/verify-live-proof-run-packet-alignment-fixtures.mjs',
  'scripts/verify-live-proof-run-packet-sources.mjs',
  'scripts/verify-live-proof-run-packet-sources-fixtures.mjs',
  'scripts/verify-live-closeout-access-sources.mjs',
  'scripts/verify-live-closeout-access-sources-fixtures.mjs',
  'scripts/verify-live-proof-closeout-command-alignment.mjs',
  'scripts/verify-live-proof-closeout-command-alignment-fixtures.mjs',
  'scripts/verify-owner-action-queue-alignment-fixtures.mjs',
  'scripts/verify-owner-evidence-artifact-hasher-fixtures.mjs',
  'scripts/verify-owner-evidence-command-checklist-alignment-fixtures.mjs',
  'scripts/verify-owner-evidence-completion-drill-alignment-fixtures.mjs',
  'scripts/verify-owner-evidence-handoff-alignment-fixtures.mjs',
  'scripts/verify-owner-evidence-prep-readiness-alignment-fixtures.mjs',
  'scripts/verify-owner-evidence-runbook-alignment-fixtures.mjs',
  'scripts/verify-launch-evidence-alignment.mjs',
  'scripts/verify-launch-evidence-alignment-fixtures.mjs',
  'scripts/verify-launch-evidence-sources.mjs',
  'scripts/verify-launch-evidence-sources-fixtures.mjs',
  'scripts/verify-live-closeout-readiness.mjs',
  'scripts/verify-onet-task-ratings-ingest.mjs',
  'scripts/verify-owner-evidence-local-safety-fixtures.mjs',
  'scripts/verify-owner-evidence-local-safety.mjs',
  'scripts/verify-resume-parser-live.mjs',
  'scripts/verify-report-evidence.mjs',
  'scripts/verify-source-manifest.mjs',
  'scripts/verify-supabase-function-governance.mjs',
];

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

async function main() {
  const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const code = await run(executable, ['eslint', ...commercialLintFiles]);
  process.exitCode = code;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}

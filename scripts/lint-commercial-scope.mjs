#!/usr/bin/env node

import { spawn } from 'node:child_process';

export const commercialLintFiles = [
  'src/App.tsx',
  'src/components/ResumeAnalyzer.tsx',
  'src/components/CounselorReportGenerator.tsx',
  'src/components/SEOReportDownload.tsx',
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
  'src/lib/commercialLeads.ts',
  'src/lib/commercialReportArtifacts.ts',
  'src/lib/commercialWorkforceAudits.ts',
  'src/lib/careerCenterCohortProofPack.ts',
  'src/lib/reportProvenance.ts',
  'src/lib/reportEvidenceCards.ts',
  'src/lib/resumeAnalysisPrivacy.ts',
  'src/lib/socSuggestions.ts',
  'src/lib/sourceManifest.ts',
  'src/lib/workTransitionProofPack.ts',
  'src/lib/workforceExecutiveReport.ts',
  'scripts/generate-commercialization-index.mjs',
  'scripts/lint-commercial-scope.mjs',
  'scripts/smoke-commercial-routes.mjs',
  'scripts/verify-commercial-accessibility.mjs',
  'scripts/verify-commercial-browser.mjs',
  'scripts/verify-commercial-data-provenance.mjs',
  'scripts/verify-commercial-release.mjs',
  'scripts/verify-commercial-trust-boundaries.mjs',
  'scripts/verify-onet-task-ratings-ingest.mjs',
  'scripts/verify-report-evidence.mjs',
  'scripts/verify-source-manifest.mjs',
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

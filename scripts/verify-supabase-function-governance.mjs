#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const checks = [
  {
    id: 'governance-registry',
    path: 'src/lib/supabaseFunctionGovernance.ts',
    snippets: [
      'SupabaseFunctionGovernanceSummary',
      'activeFunctionCount: 100',
      'noJwtFunctionCount: 20',
      'nonDestructiveRule',
      'Do not delete live functions automatically',
      'stripe-checkout',
      'stripe-portal',
      'retire-after-approval',
      'create-checkout-session',
      'create-portal-session',
      'functionGovernanceApprovalChecklist',
    ],
  },
  {
    id: 'launch-readiness-model',
    path: 'src/lib/commercialLaunchReadiness.ts',
    snippets: [
      'commercialLaunchReadinessMilestones',
      'paymentFulfillmentStatusItems',
      'outreachSequenceTemplates',
      'sourceFreshnessDashboardRows',
      'manualWcagEvidenceChecklist',
      'pilotFeedbackCaptureFields',
      'buyerLandingPageRoadmap',
      'Report-credit checkout',
      'Stripe webhook fulfillment',
      'ManualWcagEvidenceItem',
      'Paid pilot signal',
    ],
  },
  {
    id: 'gallery-governance-surface',
    path: 'src/pages/ProofPackGalleryPage.tsx',
    snippets: [
      'data-launch-readiness-command-center="true"',
      'data-payment-fulfillment-status="true"',
      'data-outreach-sequence-builder="true"',
      'data-source-freshness-dashboard="true"',
      'data-manual-wcag-evidence-workspace="true"',
      'data-pilot-feedback-capture="true"',
      'data-buyer-landing-roadmap="true"',
      'data-supabase-function-governance="true"',
      'Owner approval required before deletion',
      'Deletion approval checklist',
      'supabaseFunctionGovernanceSummary.activeFunctionCount',
      'immediateFunctionRetirementCandidates',
      'publicNoJwtFunctionReviewItems',
    ],
  },
  {
    id: 'commercial-verifier-wiring',
    path: 'scripts/verify-commercial-release.mjs',
    snippets: [
      'Verify Supabase function governance and launch readiness',
      'scripts/verify-supabase-function-governance.mjs',
    ],
  },
];

function assertContains(source, snippet, check) {
  if (!source.includes(snippet)) {
    throw new Error(`${check.id} missing snippet in ${check.path}: ${snippet}`);
  }
}

async function read(path) {
  return readFile(path, 'utf8');
}

async function main() {
  for (const check of checks) {
    const source = await read(check.path);
    for (const snippet of check.snippets) {
      assertContains(source, snippet, check);
    }
    console.log(`ok ${check.id}`);
  }

  const pageSource = await read('src/pages/ProofPackGalleryPage.tsx');
  if (/supabase functions delete/.test(pageSource)) {
    throw new Error('ProofPackGalleryPage must not render executable delete commands.');
  }

  const governanceSource = await read('src/lib/supabaseFunctionGovernance.ts');
  const deleteCommandCount = (governanceSource.match(/supabase functions delete/g) || []).length;
  if (deleteCommandCount !== 2) {
    throw new Error(`Expected exactly two approval-ready legacy payment delete commands, found ${deleteCommandCount}.`);
  }

  for (const slug of ['stripe-checkout', 'stripe-portal']) {
    const slugPattern = new RegExp(`slug: "${slug}"[\\s\\S]*?action: "retire-after-approval"[\\s\\S]*?After owner approval`);
    if (!slugPattern.test(governanceSource)) {
      throw new Error(`${slug} must remain owner-approval-only before retirement.`);
    }
  }

  console.log('Supabase function governance verification passed.');
}

await main();

#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const checks = [
  {
    id: 'evidence-card-model',
    path: 'src/lib/reportEvidenceCards.ts',
    snippets: [
      'export interface EvidenceCard',
      'sourceIds',
      'confidence',
      'generatedAt',
      'caveat',
      'doesNotProve',
      'reviewStatus',
      'data-review-status',
      'renderEvidenceCardsHtml',
      'getEvidenceCardCss',
    ],
  },
  {
    id: 'transition-proof-pack-model',
    path: 'src/lib/workTransitionProofPack.ts',
    snippets: [
      'TaskExposureBucket',
      'SkillChangeStatus',
      'SkillAction',
      'AI_ERA_ROLE_RADAR',
      'buildOccupationTransitionProofPack',
      'buildWorkforceTransitionProofPack',
      'renderTransitionProofPackHtml',
      'data-proof-pack="ai-work-transition"',
      'Task Exposure Split',
      'Skill Change Ledger',
      'AI-Era Role Radar',
      'Proof Pack Evidence Cards',
    ],
  },
  {
    id: 'seo-report-proof-pack',
    path: 'src/components/SEOReportDownload.tsx',
    snippets: [
      'buildOccupationTransitionProofPack',
      'renderTransitionProofPackHtml',
      'getTransitionProofPackCss',
    ],
  },
  {
    id: 'coach-report-proof-pack',
    path: 'src/pages/SampleReportPage.tsx',
    snippets: [
      'buildOccupationTransitionProofPack',
      'renderTransitionProofPackHtml',
      'getTransitionProofPackCss',
    ],
  },
  {
    id: 'workforce-report-proof-pack',
    path: 'src/lib/workforceExecutiveReport.ts',
    snippets: [
      'buildWorkforceTransitionProofPack',
      'renderTransitionProofPackHtml',
      'getTransitionProofPackCss',
    ],
  },
  {
    id: 'nist-source-registered',
    path: 'src/lib/sourceManifest.ts',
    snippets: [
      "id: 'nist-ai-rmf'",
      'NIST AI Risk Management Framework',
    ],
  },
];

const coverageGroups = [
  {
    id: 'task-exposure-buckets',
    path: 'src/lib/workTransitionProofPack.ts',
    snippets: ['"automatable"', '"ai_assisted"', '"human_led"', '"emerging"'],
  },
  {
    id: 'skill-change-statuses',
    path: 'src/lib/workTransitionProofPack.ts',
    snippets: ['"growing"', '"stable"', '"declining"', '"changing"', '"unknown"'],
  },
  {
    id: 'skill-actions',
    path: 'src/lib/workTransitionProofPack.ts',
    snippets: ['"protect"', '"upgrade"', '"replace"', '"learn_next"'],
  },
  {
    id: 'human-review-states',
    path: 'src/lib/reportEvidenceCards.ts',
    snippets: ['"auto_generated"', '"staff_review_required"', '"staff_reviewed"', '"coach_reviewed"', '"client_ready"'],
  },
  {
    id: 'recommendation-boundaries',
    path: 'src/lib/workTransitionProofPack.ts',
    snippets: [
      'Task exposure is different from job loss or layoff prediction.',
      'doesNotProve: "That this person will lose work, should change jobs, or should be screened differently."',
      'doesNotProve: "That any individual employee should be hired, fired, promoted, or compensated differently."',
      'Emerging roles need posting-level validation before being marketed as stable career targets.',
      'not official occupation promises',
    ],
  },
  {
    id: 'rendered-proof-markers',
    path: 'src/lib/workTransitionProofPack.ts',
    snippets: [
      'class="proof-table task-exposure-split"',
      'class="proof-table skill-change-ledger"',
      'class="ai-era-role-radar"',
      'class="proof-review-state review-state"',
      'renderEvidenceCardsHtml(pack.evidenceCards, "Proof Pack Evidence Cards")',
    ],
  },
];

async function verifySnippetCheck(check) {
  const source = await readFile(check.path, 'utf8');
  const missing = check.snippets.filter((snippet) => !source.includes(snippet));
  return {
    id: check.id,
    path: check.path,
    passed: missing.length === 0,
    missing,
  };
}

async function verifyAiEraRoleCount() {
  const source = await readFile('src/lib/workTransitionProofPack.ts', 'utf8');
  const count = Array.from(source.matchAll(/status:\s*["']emerging-signal["']/g)).length;
  return {
    id: 'ai-era-role-radar-count',
    path: 'src/lib/workTransitionProofPack.ts',
    passed: count >= 20,
    missing: count >= 20 ? [] : [`expected at least 20 emerging roles, found ${count}`],
  };
}

async function main() {
  const results = [
    ...(await Promise.all([...checks, ...coverageGroups].map(verifySnippetCheck))),
    await verifyAiEraRoleCount(),
  ];

  for (const result of results) {
    if (result.passed) {
      console.log(`ok ${result.id}`);
    } else {
      console.error(`fail ${result.id} (${result.path}): ${result.missing.join('; ')}`);
    }
  }

  const failed = results.filter((result) => !result.passed);
  if (failed.length > 0) {
    console.error(`Report evidence verification failed with ${failed.length} failure(s).`);
    process.exitCode = 1;
    return;
  }

  console.log('Report evidence verification passed.');
}

await main();

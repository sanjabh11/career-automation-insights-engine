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
      'TaskWeightingMetadata',
      'SkillChangeStatus',
      'SkillAction',
      'confidence: EvidenceConfidence',
      'reviewStatus: ReportReviewStatus',
      'AiEraRoleTaxonomyStatus',
      'AiEraRoleMarketValidationStatus',
      'ProofPackSectionReview',
      'AI_ERA_ROLE_RADAR',
      'buildOccupationTransitionProofPack',
      'buildWorkforceTransitionProofPack',
      'getTransitionProofPackReviewMetadata',
      'renderTransitionProofPackHtml',
      'data-proof-pack="ai-work-transition"',
      'data-proof-pack-review-metadata',
      'data-review-workflow',
      'data-review-section-id',
      'Task Exposure Split',
      'Weight basis',
      'task-weighting-method',
      'Skill Change Ledger',
      'Source caveat',
      'Local demand for',
      'AI-Era Role Radar',
      'Human Review Workflow',
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
      'getTransitionProofPackReviewMetadata',
      'proof_pack_review_workflow',
    ],
  },
  {
    id: 'coach-report-proof-pack',
    path: 'src/pages/SampleReportPage.tsx',
    snippets: [
      'buildOccupationTransitionProofPack',
      'renderTransitionProofPackHtml',
      'getTransitionProofPackCss',
      'getTransitionProofPackReviewMetadata',
      'proof_pack_review_workflow',
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
    id: 'workforce-audit-review-metadata',
    path: 'src/pages/EnterpriseTeamDashboard.tsx',
    snippets: [
      'buildWorkforceTransitionProofPack',
      'getTransitionProofPackReviewMetadata',
      'proof_pack_review_workflow',
    ],
  },
  {
    id: 'lead-ops-section-review-ui',
    path: 'src/pages/CommercialLeadOpsPage.tsx',
    snippets: [
      'handleReviewSectionTransition',
      'handleArtifactClientReady',
      'proof_pack_review_action',
      'proof_pack_artifact_client_ready',
      'proof_pack_review_attestation',
      'Human review attestation',
      'Attestation JSON',
      'data-proof-pack-review-section',
      'Mark reviewed',
      'Mark client-ready',
      'Log artifact client-ready',
      'section_client_ready',
      'section_review_updated',
      'artifact_client_ready',
    ],
  },
  {
    id: 'phase6-outreach-evidence-gallery',
    path: 'src/pages/ProofPackGalleryPage.tsx',
    snippets: [
      'data-proof-pack-gallery="phase-6-outreach"',
      'outreachEvidenceCards',
      'data-phase6-evidence-cards="true"',
      'data-phase6-evidence-card="true"',
      'sourceIds',
      'confidence',
      'reviewStatus',
      'caveat',
      'doesNotProve',
      'source_ids',
      'does_not_prove',
      'nace-career-readiness',
      'dol-ai-literacy-framework',
      'Planning artifact only; not hiring, firing, layoff, or Lightcast-level market intelligence.',
    ],
  },
  {
    id: 'artifact-review-event-types',
    path: 'src/lib/commercialReportArtifacts.ts',
    snippets: [
      '"section_review_updated"',
      '"section_client_ready"',
      '"artifact_client_ready"',
      'ProofPackReviewAttestation',
      'buildProofPackReviewAttestation',
      'human_review_attestation',
      'snapshotHash',
    ],
  },
  {
    id: 'artifact-review-event-migration',
    path: 'supabase/migrations/20260524000200_add_commercial_artifact_review_events.sql',
    snippets: [
      'section_review_updated',
      'section_client_ready',
      'artifact_client_ready',
      'log_commercial_report_artifact_event',
      'actor_user_id',
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
    id: 'task-weighting-boundary',
    path: 'src/lib/workTransitionProofPack.ts',
    snippets: [
      '"seed_score_proxy"',
      '"onet_task_ratings_ready"',
      '"workforce_headcount_weighted"',
      'priorityWeight',
      'importanceProxy',
      'frequencyProxy',
      'buildOnetTaskRatingWeighting',
      'O*NET Task Ratings',
      'task-time precision',
      'O*NET 30.3 Task Ratings ingest and checksum gate',
      'doesNotProve: "That the displayed priority weight is true time allocation for a worker, employer, or occupation."',
    ],
  },
  {
    id: 'skill-change-statuses',
    path: 'src/lib/workTransitionProofPack.ts',
    snippets: ['"growing"', '"stable"', '"declining"', '"changing"', '"unknown"'],
  },
  {
    id: 'skill-row-boundaries',
    path: 'src/lib/workTransitionProofPack.ts',
    snippets: [
      'skill.confidence',
      'skill.reviewStatus',
      'skill.caveat',
      'Sources:',
      'Declining means routine execution is less defensible as a standalone skill',
      'Unknown means the report needs local posting',
      'Unknown status must remain visible until live posting validation or licensed market data is integrated.',
      'oecd-skills-outlook-2025',
    ],
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
    id: 'proof-pack-section-review-ids',
    path: 'src/lib/workTransitionProofPack.ts',
    snippets: [
      '"decision_boundary"',
      '"task_exposure_split"',
      '"skill_change_ledger"',
      '"ai_era_role_radar"',
      '"evidence_cards"',
      '"client_delivery"',
    ],
  },
  {
    id: 'section-review-acceptance-criteria',
    path: 'src/lib/workTransitionProofPack.ts',
    snippets: [
      'requiredForInstitutionalDelivery',
      'allowedNextStatuses',
      'acceptanceCriteria',
      'blockingReason',
      'clientReady',
    ],
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
    id: 'ai-era-role-row-boundaries',
    path: 'src/lib/workTransitionProofPack.ts',
    snippets: [
      'role.reviewStatus',
      'role.taxonomyStatus',
      'role.marketValidationStatus',
      'role.validationNote',
      'role.searchTerms',
      'Role validation',
      'Needs posting validation',
      'Emerging, not taxonomy-mapped',
      'Search-term signal only until validated against current postings',
      'ai-workforce-consortium-2025',
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

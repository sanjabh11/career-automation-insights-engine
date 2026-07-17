#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const shouldWrite = process.argv.includes('--write');

const OUTPUT_JSON = 'docs/commercialization/remediation-completion-audit-latest.json';
const OUTPUT_MD = 'docs/commercialization/remediation-completion-audit-latest.md';
const GATES_JSON = 'docs/commercialization/remediation-external-gates-latest.json';

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function runGit(args, fallback = 'unknown') {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim() || fallback;
  } catch {
    return fallback;
  }
}

function resolveComparisonBase() {
  const candidates = [
    process.env.REMEDIATION_BASE_REF,
    'phase-d-global-english-localization',
    'origin/main',
    'main',
  ].filter(Boolean);

  for (const ref of candidates) {
    const resolved = runGit(['rev-parse', '--verify', `${ref}^{commit}`], '');
    if (resolved) return ref;
  }

  return null;
}

function statusFor(gatesById, id) {
  return gatesById.get(id)?.status || 'missing';
}

function escapeCell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, '<br/>');
}

function renderCommands(commands) {
  return commands.map((command) => `\`${command}\``).join('<br/>');
}

function renderMarkdown(audit) {
  const phaseRows = audit.phaseDeliverables
    .map((phase) => `| ${phase.phase} | ${phase.status} | ${escapeCell(phase.prSummary)} | ${escapeCell(phase.acceptanceEvidence)} | ${escapeCell(phase.confidenceDelta)} |`)
    .join('\n');
  const commandRows = audit.phaseDeliverables
    .map((phase) => `| ${phase.phase} | ${renderCommands(phase.commandsRun)} | ${escapeCell(phase.filesChanged.join('<br/>'))} |`)
    .join('\n');
  const blockerRows = audit.remainingExternalGates
    .map((gate) => {
      const ownerPrepCommand = gate.ownerPrepCommand ? `\`${escapeCell(gate.ownerPrepCommand)}\`` : 'n/a';
      const nextCommand = gate.nextCommand ? `\`${escapeCell(gate.nextCommand)}\`` : 'n/a';
      return `| ${escapeCell(gate.label)} | ${gate.status} | ${escapeCell(gate.neededEvidence)} | ${escapeCell(gate.ownerAction || gate.neededEvidence)} | ${ownerPrepCommand} | ${nextCommand} |`;
    })
    .join('\n');

  return `# Remediation Completion Audit

Generated: ${audit.generatedAt}
Branch: \`${audit.branch}\`
Source head at generation: \`${audit.sourceHeadAtGeneration}\`
Goal complete: ${audit.goalComplete ? 'yes' : 'no'}

This generated audit is the current phase-by-phase closeout ledger for the APO Dashboard remediation plan. It is evidence-bound: local implementation and verifier coverage are separated from owner-held live proof, payment proof, partner commitments, outcome evidence, and manual accessibility evidence.

## Phase Deliverables

| Phase | Current status | PR summary | Acceptance evidence | Confidence delta |
| --- | --- | --- | --- | --- |
${phaseRows}

## Commands And Files

| Phase | Commands run or canonical verifier | Key files/artifacts changed or verified |
| --- | --- | --- |
${commandRows}

## Remaining External Gates

| Gate | Status | Needed evidence | Owner action | Owner prep command | Next command |
| --- | --- | --- | --- | --- | --- |
${blockerRows || '| None | complete | No remaining evidence gate. | n/a | n/a | n/a |'}

## Decision

${audit.decision}

## Non-Proof Boundaries

${audit.nonProofBoundaries.map((item) => `- ${item}`).join('\n')}
`;
}

function buildAudit() {
  const gates = readJson(GATES_JSON);
  const gatesById = new Map(gates.gates.map((gate) => [gate.id, gate]));
  const packageJson = readJson('package.json');
  const status = read('STATUS.md');
  const readme = read('README.md');
  const playbook = read('docs/commercialization/phase-e-commercial-validation-playbook.md');
  const branch = runGit(['branch', '--show-current']);
  const head = runGit(['rev-parse', '--short', 'HEAD']);
  const comparisonBaseRef = resolveComparisonBase();
  const changedSinceBase = comparisonBaseRef
    ? runGit(['diff', '--name-only', `${comparisonBaseRef}...HEAD`], '')
        .split(/\r?\n/)
        .filter(Boolean)
    : [];

  const phaseDeliverables = [
    {
      phase: 'A',
      gateId: 'phase_a_truth_claims',
      pr: 'https://github.com/sanjabh11/career-automation-insights-engine/pull/5',
      prSummary: 'Removed unsupported proof links, rewrote claim boundaries, and made README/STATUS canonical.',
      filesChanged: ['README.md', 'STATUS.md', 'src/pages/ValidationPage.tsx', 'src/pages/ResourcesPage.tsx', 'docs/archive/'],
      commandsRun: ['npm run verify:claim-boundaries', 'route crawl: /validation,/validation/methods,/resources,/quality,/outcomes,/veterans'],
      acceptanceEvidence: 'No active dead `/docs/**` proof links; unsupported absolute claims removed; stale status sprawl archived.',
      confidenceDelta: 'Credibility risk reduced from unsupported proof/claim surfaces to dated, scoped, source-bound framing.',
    },
    {
      phase: 'B',
      gateId: 'phase_b_calibration_artifacts',
      pr: 'https://github.com/sanjabh11/career-automation-insights-engine/pull/6',
      prSummary: 'Added public APO/task model cards, calibration report, reliability plot, and uncertainty disclosure.',
      filesChanged: ['public/docs/model_cards/', 'public/docs/reports/', 'supabase/functions/calibrate-ece/index.ts', 'src/components/OccupationAnalysis.tsx'],
      commandsRun: ['npm run generate:phase-b-validation', 'npm run verify:commercial-validation'],
      acceptanceEvidence: 'Public model-card/calibration artifacts exist; production calibration remains explicitly scoped to future live expert-label evidence.',
      confidenceDelta: 'Validation transparency improved; scientific/production accuracy remains intentionally unclaimed.',
    },
    {
      phase: 'C',
      gateId: 'phase_c_embedding_runtime',
      pr: 'https://github.com/sanjabh11/career-automation-insights-engine/pull/7',
      prSummary: 'Fixed Gemini embedding model path, Veterans crosswalk behavior, and runtime smoke coverage.',
      filesChanged: ['supabase/functions/calculate-skill-adjacency/index.ts', 'scripts/verify-skill-adjacency-embedding.mjs', 'tests/e2e/', '.github/workflows/phase-c-runtime-smoke.yml'],
      commandsRun: ['npm run smoke:skill-adjacency', 'npm run e2e:smoke'],
      acceptanceEvidence: 'Skill adjacency verifier covers `gemini-embedding-001`, 768-dimensional vectors, and non-empty adjacency; hosted runtime smoke checks are green.',
      confidenceDelta: 'Runtime confidence improved from code inspection to automated local and hosted smoke evidence.',
    },
    {
      phase: 'D',
      gateId: 'phase_d_global_english',
      pr: 'https://github.com/sanjabh11/career-automation-insights-engine/pull/8',
      prSummary: 'Added ESCO/UK/CA/AU mapping layer and visible U.S.-basis disclosure for non-US users.',
      filesChanged: ['src/lib/globalEnglishLocalization.ts', 'src/components/OccupationAnalysis.tsx', 'tests/e2e/global-english.spec.ts'],
      commandsRun: ['npm run verify:global-english', 'npm run verify:global-english-sources'],
      acceptanceEvidence: '20 sample occupations resolve per UK/CA/AU/ESCO coverage; wage/outlook localization is disclosed as adapter-pending.',
      confidenceDelta: 'Global-English scope moved from absent to mapped/disclosed, while avoiding fabricated local wage claims.',
    },
    {
      phase: 'E',
      gateId: 'phase_e_instrumentation',
      pr: 'https://github.com/sanjabh11/career-automation-insights-engine/pull/9',
      prSummary: 'Added activation/retention instrumentation, design-partner/outcome evidence gates, repo presentation checks, and owner-evidence fixture smoke.',
      filesChanged: [
        'src/lib/commercialLaunchReadiness.ts',
        'src/hooks/useAnalyticsEvents.ts',
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-remediation-external-gates.mjs',
        'scripts/verify-owner-evidence-fixture-path.mjs',
        'scripts/verify-manual-wcag-evidence.mjs',
        'scripts/verify-remediation-completion-audit.mjs',
        'docs/commercialization/manual-wcag-evidence-template.json',
        'docs/commercialization/phase-e-commercial-validation-playbook.md',
        'docs/commercialization/remediation-external-gates-latest.md',
        'docs/commercialization/remediation-completion-audit-latest.md',
      ],
      commandsRun: ['npm run verify:commercial-validation', 'npm run verify:owner-evidence-fixtures', 'npm run verify:commercial', 'gh pr checks 9 --watch --interval 10'],
      acceptanceEvidence: 'Instrumentation, commercial/manual evidence schemas, fail-closed owner gates, and hosted commercial/runtime checks are present; live MRR/partners/outcomes/manual WCAG evidence are still external.',
      confidenceDelta: 'Commercial readiness improved from planned evidence collection to enforced local gates and redacted proof intake, but commercial validation and accessibility conformance remain unearned.',
    },
  ].map((phase) => ({
    ...phase,
    status: statusFor(gatesById, phase.gateId),
  }));

  const remainingExternalGates = gates.gates.filter((gate) => ![
    'locally_proven',
    'locally_proven_with_scope_limit',
    'satisfied_by_mapping_adapter_and_us_basis_disclosure',
    'externally_proven_redacted_evidence_attached',
    'manual_wcag_evidence_attached',
  ].includes(gate.status));

  const errors = [];
  const requiredScripts = [
    'verify:remediation-gates',
    'verify:owner-evidence-fixtures',
    'verify:manual-wcag-evidence',
    'verify:commercial-validation',
    'verify:commercial',
    'verify:repo-presentation',
  ];
  for (const scriptName of requiredScripts) {
    if (!packageJson.scripts?.[scriptName]) errors.push(`package.json missing ${scriptName}`);
  }
  for (const phase of phaseDeliverables) {
    if (phase.status === 'missing') errors.push(`Missing remediation gate for Phase ${phase.phase}: ${phase.gateId}`);
  }
  if (!status.includes('## Phase E Acceptance Evidence')) errors.push('STATUS.md missing Phase E acceptance evidence section');
  if (!readme.includes('Evidence path fixture')) errors.push('README.md missing evidence path fixture command');
  if (!playbook.includes('Redacted Evidence Path Smoke')) errors.push('Phase E playbook missing redacted evidence path smoke section');

  return {
    generatedAt: new Date().toISOString(),
    branch,
    sourceHeadAtGeneration: head,
    sourceGateArtifact: GATES_JSON,
    goalComplete: gates.goalComplete,
    phaseDeliverables,
    remainingExternalGates: remainingExternalGates.map((gate) => ({
      id: gate.id,
      label: gate.label,
      status: gate.status,
      neededEvidence: gate.neededEvidence,
      ownerAction: gate.ownerAction || gate.neededEvidence,
      ownerPrepCommand: gate.ownerPrepCommand || null,
      nextCommand: gate.nextCommand || null,
      riskIfSkipped: gate.riskIfSkipped || null,
    })),
    decision: gates.goalComplete
      ? 'All remediation gates are proven by current evidence.'
      : 'Keep the active goal open. Local A-E implementation evidence is present, but owner-held live/commercial evidence is still required before full completion can be claimed.',
    nonProofBoundaries: [
      'Synthetic fixtures prove schema compatibility only.',
      'Local verifier success does not prove live Stripe checkout, live MRR, production calibration, or partner/outcome authenticity.',
      'Manual WCAG evidence metadata does not create a WCAG conformance statement, legal compliance claim, or procurement approval.',
      'Hosted CI proves this branch behavior, not target production data state.',
      'UK/Canada/Australia wage/outlook values remain adapter-gated unless source-dated joins are imported and validated.',
    ],
    currentBranchFilesChangedCount: changedSinceBase.length,
    currentBranchFilesChangedSample: changedSinceBase.slice(0, 40),
    comparisonBaseRef,
    comparisonBaseStatus: comparisonBaseRef ? 'verified' : 'unavailable',
    comparisonBoundary: comparisonBaseRef
      ? `Changed-file sample compares ${comparisonBaseRef}...HEAD.`
      : 'No known remediation baseline ref is available locally; changed-since-baseline counts are omitted rather than inferred from an unrelated branch or remote.',
    errors,
  };
}

const audit = buildAudit();

if (shouldWrite) {
  fs.mkdirSync(path.join(root, 'docs/commercialization'), { recursive: true });
  fs.writeFileSync(path.join(root, OUTPUT_JSON), `${JSON.stringify(audit, null, 2)}\n`);
  fs.writeFileSync(path.join(root, OUTPUT_MD), renderMarkdown(audit));
}

console.log(JSON.stringify({
  ok: audit.errors.length === 0,
  goalComplete: audit.goalComplete,
  phaseStatuses: audit.phaseDeliverables.map((phase) => ({
    phase: phase.phase,
    status: phase.status,
  })),
  remainingExternalGateCount: audit.remainingExternalGates.length,
  wrote: shouldWrite ? [OUTPUT_JSON, OUTPUT_MD] : null,
  errors: audit.errors,
}, null, 2));

if (audit.errors.length > 0) {
  process.exitCode = 1;
}

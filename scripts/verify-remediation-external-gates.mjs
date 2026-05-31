#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const OUTPUT_JSON = 'docs/commercialization/remediation-external-gates-latest.json';
const OUTPUT_MD = 'docs/commercialization/remediation-external-gates-latest.md';
const ENV_FILES = ['.env.local', '.env'];

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readOptional(relativePath) {
  try {
    return read(relativePath);
  } catch {
    return '';
  }
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return null;
  const key = trimmed.slice(0, trimmed.indexOf('=')).trim();
  const value = trimmed.slice(trimmed.indexOf('=') + 1).trim();
  return key && value ? key : null;
}

function loadPresentEnvNames() {
  const names = new Set(
    Object.entries(process.env)
      .filter(([, value]) => typeof value === 'string' && value.trim())
      .map(([key]) => key)
  );

  for (const file of ENV_FILES) {
    try {
      const source = fs.readFileSync(path.join(root, file), 'utf8');
      for (const line of source.split(/\r?\n/)) {
        const key = parseEnvLine(line);
        if (key) names.add(key);
      }
    } catch {
      // Local env files are optional and secret values must never be printed.
    }
  }

  return names;
}

function anyPresent(presentEnvNames, aliases) {
  return aliases.some((name) => presentEnvNames.has(name));
}

function missingGroups(presentEnvNames, groups) {
  return groups
    .filter((group) => !anyPresent(presentEnvNames, group.aliases))
    .map((group) => group.label);
}

function containsAll(source, snippets) {
  return snippets.every((snippet) => source.includes(snippet));
}

function gate(id, label, status, evidence, neededEvidence, options = {}) {
  return {
    id,
    label,
    status,
    evidence,
    neededEvidence,
    sourceBoundary: options.sourceBoundary || 'local verifier',
    doesNotProve: options.doesNotProve || [],
  };
}

function statusForExternalGate(missing, localReady) {
  if (!localReady) return 'repo_not_ready';
  return missing.length > 0 ? 'blocked_missing_owner_secret_or_live_evidence' : 'ready_for_owner_live_run';
}

function renderMarkdown(artifact) {
  const rows = artifact.gates
    .map((item) => `| ${item.label} | ${item.status} | ${item.evidence} | ${item.neededEvidence} |`)
    .join('\n');

  return `# Remediation External Gates

Generated: ${artifact.generatedAt}
Branch: \`${artifact.branch}\`
Goal complete: ${artifact.goalComplete ? 'yes' : 'no'}

This artifact is a non-mutating readiness ledger for the remaining APO Dashboard remediation gates. It records secret presence by variable name only and never stores secret values. It does not apply migrations, deploy functions, create Stripe sessions, query live customer data, or claim commercial validation.

| Gate | Status | Current evidence | Needed evidence |
| --- | --- | --- | --- |
${rows}

## Remaining Manual Evidence

${artifact.remainingManualEvidence.map((item) => `- ${item}`).join('\n')}

## Command

\`\`\`bash
npm run verify:remediation-gates
\`\`\`

Use \`npm run verify:remediation-gates -- --require-complete\` only when all external evidence has been attached and you want the command to fail closed until every gate is proven.
`;
}

function main() {
  const generatedAt = new Date().toISOString();
  const requireComplete = hasFlag('--require-complete');
  const presentEnvNames = loadPresentEnvNames();
  const packageJson = JSON.parse(read('package.json'));
  const packageScripts = packageJson.scripts || {};
  const stripeRuntime = readOptional('src/lib/stripe.ts');
  const calibrationFunction = readOptional('supabase/functions/calibrate-ece/index.ts');
  const completionAudit = readOptional('docs/commercialization/remediation-completion-audit-2026-05-31.md');
  const globalEnglish = readOptional('src/lib/globalEnglishLocalization.ts');
  const occupationAnalysis = readOptional('src/components/OccupationAnalysis.tsx');
  const readinessModel = readOptional('src/lib/commercialLaunchReadiness.ts');

  const publicDocsReady = [
    'public/docs/model_cards/APO_MODEL_CARD.html',
    'public/docs/model_cards/TASK_MODEL_CARD.html',
    'public/docs/reports/apo-calibration-report.html',
    'public/docs/reports/apo-reliability-curve.svg',
    'public/docs/reports/apo-calibration-data.json',
  ].every(exists);

  const embeddingSmokeReady =
    packageScripts['smoke:skill-adjacency'] === 'node scripts/verify-skill-adjacency-embedding.mjs' &&
    exists('scripts/verify-skill-adjacency-embedding.mjs');

  const globalEnglishReady =
    packageScripts['verify:global-english'] === 'node scripts/verify-global-english-localization.mjs' &&
    packageScripts['verify:global-english-sources'] === 'node scripts/verify-global-english-localization.mjs --with-source-fetch' &&
    containsAll(globalEnglish, [
      'GLOBAL_ENGLISH_SOURCE_DATE',
      'GLOBAL_ENGLISH_OCCUPATION_CROSSWALKS',
      'REGIONAL_WAGE_OUTLOOK_ADAPTERS',
      'source_registered_adapter_pending',
      'getRegionalLaborMarketDisclosure',
      'U.S. O*NET/BLS basis',
    ]) &&
    containsAll(occupationAnalysis, ['getRegionalLaborMarketDisclosure', 'regionalDisclosure', 'Join requirement:']);

  const phaseEReady =
    packageScripts['verify:commercial-validation'] === 'node scripts/verify-phase-e-commercial-validation.mjs' &&
    containsAll(readinessModel, [
      'commercialValidationEvidenceGates',
      'designPartnerOnboardingChecklist',
      'caseStudyCaptureTemplate',
      'Live MRR greater than zero',
    ]);

  const stripeMissing = missingGroups(presentEnvNames, [
    { label: 'STRIPE_SECRET_KEY', aliases: ['STRIPE_SECRET_KEY'] },
    { label: 'SUPABASE_URL or VITE_SUPABASE_URL', aliases: ['SUPABASE_URL', 'VITE_SUPABASE_URL'] },
    {
      label: 'SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY',
      aliases: ['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'PUBLIC_SUPABASE_ANON_KEY'],
    },
    { label: 'SUPABASE_SERVICE_ROLE_KEY', aliases: ['SUPABASE_SERVICE_ROLE_KEY'] },
  ]);
  const stripeLocalReady =
    exists('supabase/functions/create-checkout-session/index.ts') &&
    containsAll(stripeRuntime, ['checkoutStatus: \'hidden_pending_live_price\'', 'stripePriceId: undefined']);

  const calibrationMissing = missingGroups(presentEnvNames, [
    { label: 'SUPABASE_URL or VITE_SUPABASE_URL', aliases: ['SUPABASE_URL', 'VITE_SUPABASE_URL'] },
    { label: 'SUPABASE_SERVICE_ROLE_KEY', aliases: ['SUPABASE_SERVICE_ROLE_KEY'] },
  ]);
  const calibrationLocalReady =
    publicDocsReady &&
    containsAll(calibrationFunction, [
      'expert_assessments',
      'apo_overall_vs_expert_assessments',
      'validation_metrics',
      'calibration_results',
    ]);

  const liveAuthMissing = missingGroups(presentEnvNames, [
    { label: 'SUPABASE_URL or VITE_SUPABASE_URL', aliases: ['SUPABASE_URL', 'VITE_SUPABASE_URL'] },
    {
      label: 'SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY',
      aliases: ['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'PUBLIC_SUPABASE_ANON_KEY'],
    },
    { label: 'LIVE_SUPABASE_TEST_USER_EMAIL', aliases: ['LIVE_SUPABASE_TEST_USER_EMAIL'] },
    { label: 'LIVE_SUPABASE_TEST_USER_PASSWORD', aliases: ['LIVE_SUPABASE_TEST_USER_PASSWORD'] },
  ]);

  const gates = [
    gate(
      'phase_a_truth_claims',
      'Phase A truth and claim reconciliation',
      containsAll(completionAudit, ['Phase A route/proof-link crawl', 'no forbidden claim text found'])
        ? 'locally_proven'
        : 'missing_local_evidence',
      'Completion audit records route/proof-link crawl and forbidden-claim scan.',
      'Keep route crawl and forbidden-claim scan current before merging Phase A.'
    ),
    gate(
      'phase_b_calibration_artifacts',
      'Phase B public calibration/model-card artifacts',
      publicDocsReady ? 'locally_proven_with_scope_limit' : 'missing_local_artifacts',
      publicDocsReady
        ? 'APO model card, task model card, calibration report, reliability curve, and calibration JSON are present.'
        : 'One or more public Phase B artifacts are missing.',
      'Production accuracy still needs live APO logs joined to approved expert assessments.',
      {
        doesNotProve: ['Production calibration', 'scientific validity', 'generalization beyond the fixture rows'],
      }
    ),
    gate(
      'phase_c_embedding_runtime',
      'Phase C embedding/runtime smoke path',
      embeddingSmokeReady ? 'locally_proven' : 'missing_local_verifier',
      embeddingSmokeReady
        ? '`smoke:skill-adjacency` is wired to the embedding dimensionality/non-empty adjacency verifier.'
        : '`smoke:skill-adjacency` is missing or miswired.',
      'Run `npm run smoke:skill-adjacency` after embedding or adjacency code changes.'
    ),
    gate(
      'phase_d_global_english',
      'Phase D global-English disclosure/mapping/adapter layer',
      globalEnglishReady ? 'satisfied_by_mapping_adapter_and_us_basis_disclosure' : 'missing_local_disclosure_mapping_or_adapter',
      globalEnglishReady
        ? 'Global-English source registry, sample crosswalks, static verifier, source-fetch verifier, visible U.S.-basis disclosure, and source-registered local wage/outlook adapter gates are present.'
        : 'Global-English mapping/disclosure/adapter scaffolding is incomplete.',
      'If the product needs local wage values instead of disclosure, import source-dated ONS/Job Bank/JSA rows and test joins before display.'
    ),
    gate(
      'phase_e_instrumentation',
      'Phase E activation/retention/commercial validation instrumentation',
      phaseEReady ? 'locally_proven_with_scope_limit' : 'missing_local_instrumentation',
      phaseEReady
        ? 'Commercial validation gates, activation/retention catalog, onboarding checklist, and case-study template are implemented.'
        : 'Phase E commercial readiness model or verifier is incomplete.',
      'Live MRR, committed partners, and permissioned outcomes remain external evidence.'
    ),
    gate(
      'real_stripe_test_checkout',
      'Real Stripe test-mode checkout',
      statusForExternalGate(stripeMissing, stripeLocalReady),
      stripeMissing.length
        ? `Local checkout code is ready, but required secret/env names are absent: ${stripeMissing.join(', ')}.`
        : 'Required secret/env names are present; run a dedicated owner-approved Stripe test-mode checkout proof without printing secrets.',
      'Owner-provided Stripe/Supabase test credentials and a successful Checkout Session from `create-checkout-session`.',
      {
        sourceBoundary: 'owner credential gate',
        doesNotProve: ['Live revenue', 'MRR', 'payment fulfillment in live mode'],
      }
    ),
    gate(
      'production_calibration_run',
      'Production calibration run',
      statusForExternalGate(calibrationMissing, calibrationLocalReady),
      calibrationMissing.length
        ? `Calibration code/artifacts are ready, but required secret/env names are absent: ${calibrationMissing.join(', ')}.`
        : 'Required secret/env names are present; apply approved migration/deploy sequence and run calibration against live APO logs and expert labels.',
      'Approved Supabase migration/deploy, expert-label rows, APO logs, and `calibrate-ece` run output from the target project.',
      {
        sourceBoundary: 'owner migration/deploy gate',
        doesNotProve: ['Scientific validation before live labels exist'],
      }
    ),
    gate(
      'authenticated_live_artifact_e2e',
      'Authenticated live artifact e2e',
      liveAuthMissing.length
        ? 'blocked_missing_owner_secret_or_live_evidence'
        : 'ready_for_owner_live_run',
      liveAuthMissing.length
        ? `Verifier exists, but required secret/env names are absent: ${liveAuthMissing.join(', ')}.`
        : 'Required secret/env names are present; run `npm run verify:commercial-live-auth-e2e` with a synthetic test user.',
      'Passing live authenticated synthetic user run for artifact save/delete and deletion receipts.',
      {
        sourceBoundary: 'owner credential gate',
        doesNotProve: ['Payment proof', 'malware scanning', 'legal compliance'],
      }
    ),
    gate(
      'live_mrr_gt_zero',
      'Live MRR greater than zero',
      'manual_external_evidence_required',
      'No live Stripe subscription, payment transaction, or MRR export is stored in this repo.',
      'Stripe live-mode and database evidence showing `total_mrr > 0`.',
      { sourceBoundary: 'manual commercial evidence gate' }
    ),
    gate(
      'three_committed_partners',
      'Three committed design partners',
      'manual_external_evidence_required',
      'Onboarding checklist exists, but named partner commitments are not stored in this repo.',
      'At least three permissioned partner records with pilot scope, next step, and contact permission.',
      { sourceBoundary: 'manual commercial evidence gate' }
    ),
    gate(
      'documented_outcomes',
      'Permissioned documented outcomes',
      'manual_external_evidence_required',
      'Case-study capture template exists, but permissioned outcome records are not stored in this repo.',
      'Permissioned case-study records with baseline workflow, artifact reviewed, outcome, quote approval, and does-not-prove text.',
      { sourceBoundary: 'manual commercial evidence gate' }
    ),
  ];

  const remainingManualEvidence = gates
    .filter((item) => ![
      'locally_proven',
      'locally_proven_with_scope_limit',
      'satisfied_by_mapping_and_us_basis_disclosure',
      'satisfied_by_mapping_adapter_and_us_basis_disclosure',
    ].includes(item.status))
    .map((item) => `${item.label}: ${item.neededEvidence}`);

  const goalComplete = remainingManualEvidence.length === 0;
  const artifact = {
    generatedAt,
    branch: 'phase-e-commercial-validation',
    goalComplete,
    requireComplete,
    gates,
    remainingManualEvidence,
  };

  fs.mkdirSync(path.join(root, 'docs/commercialization'), { recursive: true });
  fs.writeFileSync(path.join(root, OUTPUT_JSON), `${JSON.stringify(artifact, null, 2)}\n`);
  fs.writeFileSync(path.join(root, OUTPUT_MD), renderMarkdown(artifact));

  console.log(JSON.stringify({
    ok: true,
    goalComplete,
    gates: gates.map((item) => ({ id: item.id, status: item.status })),
    wrote: [OUTPUT_JSON, OUTPUT_MD],
  }, null, 2));

  if (requireComplete && !goalComplete) {
    console.error('Remediation external gates are not complete. See generated artifact for remaining evidence.');
    process.exitCode = 1;
  }
}

main();

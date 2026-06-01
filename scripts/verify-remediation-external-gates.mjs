#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_LIVE_GATE_EVIDENCE_PATH,
  LIVE_GATE_EVIDENCE_SCHEMA_VERSION,
  validateLiveGateEvidence,
} from './lib/liveGateEvidence.mjs';
import {
  DEFAULT_INPUT_PATH as DEFAULT_COMMERCIAL_EVIDENCE_RECORDS_PATH,
  SCHEMA_VERSION as COMMERCIAL_EVIDENCE_RECORDS_SCHEMA_VERSION,
  validateCommercialEvidence,
} from './verify-commercial-evidence-records.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const OUTPUT_JSON = 'docs/commercialization/remediation-external-gates-latest.json';
const OUTPUT_MD = 'docs/commercialization/remediation-external-gates-latest.md';
const ENV_FILES = ['.env.local', '.env'];

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function readFlagValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
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

## Redacted Live Evidence Intake

Schema: \`${artifact.liveGateEvidence.schemaVersion}\`
Template: \`${artifact.liveGateEvidence.templatePath}\`
Default local file: \`${artifact.liveGateEvidence.defaultPath}\`
Current file found: ${artifact.liveGateEvidence.found ? 'yes' : 'no'}
Accepted gates: ${artifact.liveGateEvidence.acceptedGateIds.length ? artifact.liveGateEvidence.acceptedGateIds.map((id) => `\`${id}\``).join(', ') : 'none'}
Rejected gates: ${artifact.liveGateEvidence.rejectedGateIds.length ? artifact.liveGateEvidence.rejectedGateIds.map((id) => `\`${id}\``).join(', ') : 'none'}
Validation errors: ${artifact.liveGateEvidence.errorCount}

The evidence verifier accepts only redacted metadata and owner-held artifact hashes. It rejects high-confidence secret patterns and does not print raw evidence contents.

## Redacted Commercial Evidence Records

Schema: \`${artifact.commercialEvidenceRecords.schemaVersion}\`
Template: \`${artifact.commercialEvidenceRecords.templatePath}\`
Default local file: \`${artifact.commercialEvidenceRecords.defaultPath}\`
Current file found: ${artifact.commercialEvidenceRecords.found ? 'yes' : 'no'}
Accepted design partner records: ${artifact.commercialEvidenceRecords.acceptedDesignPartnerCount}
Unique design partner hashes: ${artifact.commercialEvidenceRecords.uniqueDesignPartnerCount}
Accepted outcome records: ${artifact.commercialEvidenceRecords.acceptedOutcomeCount}
Unique outcome hashes: ${artifact.commercialEvidenceRecords.uniqueOutcomeCount}
Partner gate satisfied: ${artifact.commercialEvidenceRecords.partnerGateSatisfied ? 'yes' : 'no'}
Outcome gate satisfied: ${artifact.commercialEvidenceRecords.outcomeGateSatisfied ? 'yes' : 'no'}
Validation errors: ${artifact.commercialEvidenceRecords.errorCount}

The commercial evidence verifier accepts only redacted metadata and owner-held artifact hashes. Partner and outcome hashes must be unique. It rejects high-confidence secret and private-contact patterns and does not store partner names, contacts, contracts, private notes, raw quotes, customer data, or revenue amounts.

## Command

\`\`\`bash
npm run verify:remediation-gates
\`\`\`

Use \`npm run verify:remediation-gates -- --live-evidence <path> --commercial-evidence <path> --require-complete\` only when all external evidence has been attached and you want the command to fail closed until every gate is proven.
`;
}

function main() {
  const generatedAt = new Date().toISOString();
  const requireComplete = hasFlag('--require-complete');
  const liveEvidencePath = readFlagValue('--live-evidence') || readFlagValue('--live-gate-evidence');
  const commercialEvidencePath = readFlagValue('--commercial-evidence') || readFlagValue('--commercial-records');
  const presentEnvNames = loadPresentEnvNames();
  const packageJson = JSON.parse(read('package.json'));
  const packageScripts = packageJson.scripts || {};
  const commercialEvidenceRecordsVerifier = readOptional('scripts/verify-commercial-evidence-records.mjs');
  const commercialEvidenceRecordsTemplate = readOptional('docs/commercialization/commercial-evidence-records-template.json');
  const stripeRuntime = readOptional('src/lib/stripe.ts');
  const stripeTestCheckoutVerifier = readOptional('scripts/verify-stripe-test-checkout.mjs');
  const stripeLiveMrrVerifier = readOptional('scripts/verify-stripe-live-mrr.mjs');
  const productionCalibrationVerifier = readOptional('scripts/verify-production-calibration-run.mjs');
  const calibrationFunction = readOptional('supabase/functions/calibrate-ece/index.ts');
  const completionAudit = readOptional('docs/commercialization/remediation-completion-audit-2026-05-31.md');
  const globalEnglish = readOptional('src/lib/globalEnglishLocalization.ts');
  const occupationAnalysis = readOptional('src/components/OccupationAnalysis.tsx');
  const readinessModel = readOptional('src/lib/commercialLaunchReadiness.ts');
  const liveGateEvidence = validateLiveGateEvidence({ root, evidencePath: liveEvidencePath });
  const commercialEvidenceRecords = validateCommercialEvidence({ root, inputPath: commercialEvidencePath });
  const acceptedLiveGateEvidence = new Set(liveGateEvidence.acceptedGateIds);

  function externalGate(id, label, status, evidence, neededEvidence, options = {}) {
    if (!acceptedLiveGateEvidence.has(id)) {
      return gate(id, label, status, evidence, neededEvidence, options);
    }

    return gate(
      id,
      label,
      'externally_proven_redacted_evidence_attached',
      'Redacted owner evidence is accepted by `verify:live-gate-evidence`; raw proof artifacts and private details remain owner-held.',
      'Keep the redacted evidence file current and preserve owner-held raw proof for audit.',
      {
        ...options,
        sourceBoundary: 'redacted owner evidence intake',
      }
    );
  }

  function commercialEvidenceRecordsGate(id, label, satisfied, localReady, evidence, neededEvidence, options = {}) {
    if (satisfied) {
      return gate(
        id,
        label,
        'externally_proven_redacted_evidence_attached',
        `Redacted commercial evidence records are accepted by \`verify:commercial-evidence-records\` (${commercialEvidenceRecords.uniqueDesignPartnerCount} unique partner hash(es), ${commercialEvidenceRecords.uniqueOutcomeCount} unique outcome hash(es)); raw proof artifacts and private details remain owner-held.`,
        'Keep the redacted records current and preserve owner-held raw proof for audit.',
        {
          ...options,
          sourceBoundary: 'redacted commercial evidence records',
        }
      );
    }

    return gate(
      id,
      label,
      commercialEvidenceRecords.errors.length
        ? 'invalid_redacted_commercial_evidence_records'
        : localReady
          ? 'blocked_missing_owner_evidence_records'
          : 'missing_local_verifier',
      commercialEvidenceRecords.errors.length
        ? `Redacted commercial evidence records are invalid with ${commercialEvidenceRecords.errors.length} verifier error(s).`
        : evidence,
      neededEvidence,
      options
    );
  }

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

  const commercialEvidenceRecordsReady =
    packageScripts['verify:commercial-evidence-records'] === 'node scripts/verify-commercial-evidence-records.mjs --write' &&
    exists('scripts/verify-commercial-evidence-records.mjs') &&
    exists('docs/commercialization/commercial-evidence-records-template.json') &&
    containsAll(commercialEvidenceRecordsVerifier, [
      'three_committed_partners',
      'documented_outcomes',
      'acceptedDesignPartnerCount',
      'acceptedOutcomeCount',
      'partnerGateSatisfied',
      'outcomeGateSatisfied',
      'uniqueDesignPartnerCount',
      'uniqueOutcomeCount',
      'commercial-evidence-records.local.json',
    ]) &&
    containsAll(commercialEvidenceRecordsTemplate, [
      'designPartnerCommitments',
      'documentedOutcomes',
      'partnerIdHash',
      'outcomeIdHash',
      'doesNotProve',
    ]);

  const liveGateEvidenceIntakeReady =
    packageScripts['verify:live-gate-evidence'] === 'node scripts/verify-live-gate-evidence.mjs' &&
    exists('scripts/verify-live-gate-evidence.mjs') &&
    exists('scripts/lib/liveGateEvidence.mjs') &&
    exists('docs/commercialization/live-gate-evidence-template.json');

  const stripeMissing = missingGroups(presentEnvNames, [
    { label: 'STRIPE_SECRET_KEY', aliases: ['STRIPE_SECRET_KEY'] },
    { label: 'STRIPE_TEST_PRICE_ID or APO_STRIPE_TEST_PRICE_ID', aliases: ['STRIPE_TEST_PRICE_ID', 'APO_STRIPE_TEST_PRICE_ID'] },
    { label: 'SUPABASE_URL or VITE_SUPABASE_URL', aliases: ['SUPABASE_URL', 'VITE_SUPABASE_URL'] },
    {
      label: 'SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY',
      aliases: ['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'PUBLIC_SUPABASE_ANON_KEY'],
    },
    {
      label: 'LIVE_SUPABASE_TEST_USER_EMAIL or STRIPE_TEST_USER_EMAIL',
      aliases: ['LIVE_SUPABASE_TEST_USER_EMAIL', 'STRIPE_TEST_USER_EMAIL'],
    },
    {
      label: 'LIVE_SUPABASE_TEST_USER_PASSWORD or STRIPE_TEST_USER_PASSWORD',
      aliases: ['LIVE_SUPABASE_TEST_USER_PASSWORD', 'STRIPE_TEST_USER_PASSWORD'],
    },
  ]);
  const stripeLocalReady =
    packageScripts['verify:stripe-test-checkout'] === 'node scripts/verify-stripe-test-checkout.mjs --write' &&
    exists('scripts/verify-stripe-test-checkout.mjs') &&
    containsAll(stripeTestCheckoutVerifier, [
      'create-checkout-session',
      'livemode=false',
      'STRIPE_TEST_PRICE_ID',
      'LIVE_SUPABASE_TEST_USER_EMAIL',
    ]) &&
    exists('supabase/functions/create-checkout-session/index.ts') &&
    containsAll(stripeRuntime, ['checkoutStatus: \'hidden_pending_live_price\'', 'stripePriceId: undefined']);

  const liveMrrMissing = missingGroups(presentEnvNames, [
    {
      label: 'STRIPE_LIVE_SECRET_KEY or STRIPE_LIVE_RESTRICTED_KEY or STRIPE_SECRET_KEY',
      aliases: ['STRIPE_LIVE_SECRET_KEY', 'STRIPE_LIVE_RESTRICTED_KEY', 'STRIPE_SECRET_KEY'],
    },
  ]);
  const liveMrrLocalReady =
    packageScripts['verify:stripe-live-mrr'] === 'node scripts/verify-stripe-live-mrr.mjs --write' &&
    exists('scripts/verify-stripe-live-mrr.mjs') &&
    containsAll(stripeLiveMrrVerifier, [
      'stripe_live_mrr_export',
      'totalMrrGreaterThanZero',
      'activeSubscriptionCount',
      'paidInvoiceCount',
      'failed_non_live_stripe_key',
      'status',
      'active',
    ]);

  const calibrationMissing = missingGroups(presentEnvNames, [
    { label: 'SUPABASE_URL or VITE_SUPABASE_URL', aliases: ['SUPABASE_URL', 'VITE_SUPABASE_URL'] },
    {
      label: 'SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY',
      aliases: ['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'PUBLIC_SUPABASE_ANON_KEY'],
    },
  ]);
  const calibrationLocalReady =
    publicDocsReady &&
    packageScripts['verify:production-calibration'] === 'node scripts/verify-production-calibration-run.mjs --write' &&
    exists('scripts/verify-production-calibration-run.mjs') &&
    containsAll(productionCalibrationVerifier, [
      'calibrate-ece',
      'apo_overall_vs_expert_assessments',
      'pairsCount',
      'expertRowsCount',
      'skipped_missing_env',
      'does not apply migrations',
    ]) &&
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
      'redacted_live_gate_evidence_intake',
      'Redacted live-gate evidence intake verifier',
      liveGateEvidence.errors.length
        ? 'invalid_redacted_evidence_file'
        : liveGateEvidenceIntakeReady
          ? 'locally_proven'
          : 'missing_local_verifier',
      liveGateEvidence.errors.length
        ? `The redacted evidence file is present but invalid with ${liveGateEvidence.errors.length} verifier error(s).`
        : liveGateEvidenceIntakeReady
          ? 'A non-secret redacted evidence schema, template, and verifier are wired for the remaining credential-gated live proof gates.'
          : 'The redacted evidence intake verifier is missing or miswired.',
      'Use `docs/commercialization/live-gate-evidence-template.json` as the shape for owner-held proof metadata and validate with `npm run verify:live-gate-evidence`.',
      {
        sourceBoundary: 'local verifier and redacted owner-evidence schema',
        doesNotProve: ['Live proof until a valid evidence file is attached', 'Raw evidence authenticity without owner-held artifacts'],
      }
    ),
    externalGate(
      'real_stripe_test_checkout',
      'Real Stripe test-mode checkout',
      statusForExternalGate(stripeMissing, stripeLocalReady),
      stripeMissing.length
        ? `Local checkout code and owner-run verifier are ready, but required secret/env names are absent: ${stripeMissing.join(', ')}.`
        : 'Required secret/env names are present; run `npm run verify:stripe-test-checkout` to create and retrieve a test-mode Checkout Session without printing secrets.',
      'Owner-provided Stripe/Supabase test credentials, `STRIPE_TEST_PRICE_ID`, and a successful `npm run verify:stripe-test-checkout` artifact.',
      {
        sourceBoundary: 'owner credential gate',
        doesNotProve: ['Live revenue', 'MRR', 'payment fulfillment in live mode'],
      }
    ),
    externalGate(
      'production_calibration_run',
      'Production calibration run',
      statusForExternalGate(calibrationMissing, calibrationLocalReady),
      calibrationMissing.length
        ? `Calibration code/artifacts and the owner-run verifier are ready, but required secret/env names are absent: ${calibrationMissing.join(', ')}.`
        : 'Required secret/env names are present; run `npm run verify:production-calibration` only after the target project already has approved migrations, deployed `calibrate-ece`, function secrets, APO logs, and expert labels.',
      'Owner-provided Supabase target URL/anon key, approved deployed calibration function with service-role secret configured in Supabase, live expert-label rows, APO logs, and a successful `npm run verify:production-calibration` artifact.',
      {
        sourceBoundary: 'owner credential and deployment-precondition gate',
        doesNotProve: ['Scientific validation before live labels exist', 'Migrations or deployments were applied by this verifier'],
      }
    ),
    externalGate(
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
    externalGate(
      'live_mrr_gt_zero',
      'Live MRR greater than zero',
      statusForExternalGate(liveMrrMissing, liveMrrLocalReady),
      liveMrrMissing.length
        ? `Stripe live-MRR owner-run verifier is ready, but required secret/env names are absent: ${liveMrrMissing.join(', ')}.`
        : 'Required secret/env names are present; run `npm run verify:stripe-live-mrr` with a live-mode read-only Stripe key to check active subscriptions and paid invoices without printing secrets.',
      'Owner-provided live-mode Stripe restricted/secret key and a successful `npm run verify:stripe-live-mrr` artifact showing active subscriptions, paid invoices, and redacted `total_mrr > 0` evidence.',
      {
        sourceBoundary: 'owner live Stripe credential gate',
        doesNotProve: ['Retention', 'Product-market fit', 'Future revenue', 'Accounting-recognized revenue'],
      }
    ),
    commercialEvidenceRecordsGate(
      'three_committed_partners',
      'Three committed design partners',
      commercialEvidenceRecords.partnerGateSatisfied,
      commercialEvidenceRecordsReady,
      commercialEvidenceRecordsReady
        ? `Redacted commercial-evidence record verifier is ready; ${commercialEvidenceRecords.uniqueDesignPartnerCount} unique accepted owner-held partner commitment hash(es) are attached.`
        : 'Commercial-evidence record verifier is missing or miswired.',
      'At least three unique permissioned partner records validated by `npm run verify:commercial-evidence-records -- --require-partners`, with pilot scope, planning-only use, artifact reviewed, next step, and contact permission.',
      {
        sourceBoundary: 'owner redacted commercial-evidence records',
        doesNotProve: ['Revenue', 'Successful outcomes', 'Market-wide demand'],
      }
    ),
    commercialEvidenceRecordsGate(
      'documented_outcomes',
      'Permissioned documented outcomes',
      commercialEvidenceRecords.outcomeGateSatisfied,
      commercialEvidenceRecordsReady,
      commercialEvidenceRecordsReady
        ? `Redacted commercial-evidence record verifier is ready; ${commercialEvidenceRecords.uniqueOutcomeCount} unique accepted owner-held documented outcome hash(es) are attached.`
        : 'Commercial-evidence record verifier is missing or miswired.',
      'At least one permissioned outcome record validated by `npm run verify:commercial-evidence-records -- --require-outcomes`, with baseline workflow, artifact reviewed, measured change, quote approval, and does-not-prove text.',
      {
        sourceBoundary: 'owner redacted commercial-evidence records',
        doesNotProve: ['Guaranteed career outcomes', 'Causal impact', 'Generalizable demand'],
      }
    ),
  ];

  const remainingManualEvidence = gates
    .filter((item) => ![
      'locally_proven',
      'locally_proven_with_scope_limit',
      'satisfied_by_mapping_and_us_basis_disclosure',
      'satisfied_by_mapping_adapter_and_us_basis_disclosure',
      'externally_proven_redacted_evidence_attached',
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
    liveGateEvidence: {
      schemaVersion: LIVE_GATE_EVIDENCE_SCHEMA_VERSION,
      templatePath: 'docs/commercialization/live-gate-evidence-template.json',
      defaultPath: DEFAULT_LIVE_GATE_EVIDENCE_PATH,
      found: liveGateEvidence.found,
      evidencePath: liveGateEvidence.evidencePath,
      acceptedGateIds: liveGateEvidence.acceptedGateIds,
      rejectedGateIds: liveGateEvidence.rejectedGateIds,
      errorCount: liveGateEvidence.errors.length,
      errors: liveGateEvidence.errors,
    },
    commercialEvidenceRecords: {
      schemaVersion: COMMERCIAL_EVIDENCE_RECORDS_SCHEMA_VERSION,
      templatePath: 'docs/commercialization/commercial-evidence-records-template.json',
      defaultPath: DEFAULT_COMMERCIAL_EVIDENCE_RECORDS_PATH,
      found: commercialEvidenceRecords.found,
      inputPath: commercialEvidenceRecords.inputPath,
      acceptedDesignPartnerCount: commercialEvidenceRecords.acceptedDesignPartnerCount,
      acceptedOutcomeCount: commercialEvidenceRecords.acceptedOutcomeCount,
      uniqueDesignPartnerCount: commercialEvidenceRecords.uniqueDesignPartnerCount,
      uniqueOutcomeCount: commercialEvidenceRecords.uniqueOutcomeCount,
      partnerGateSatisfied: commercialEvidenceRecords.partnerGateSatisfied,
      outcomeGateSatisfied: commercialEvidenceRecords.outcomeGateSatisfied,
      errorCount: commercialEvidenceRecords.errors.length,
      errors: commercialEvidenceRecords.errors,
    },
  };

  fs.mkdirSync(path.join(root, 'docs/commercialization'), { recursive: true });
  fs.writeFileSync(path.join(root, OUTPUT_JSON), `${JSON.stringify(artifact, null, 2)}\n`);
  fs.writeFileSync(path.join(root, OUTPUT_MD), renderMarkdown(artifact));

  console.log(JSON.stringify({
    ok: liveGateEvidence.errors.length === 0 && commercialEvidenceRecords.errors.length === 0,
    goalComplete,
    liveGateEvidence: artifact.liveGateEvidence,
    commercialEvidenceRecords: artifact.commercialEvidenceRecords,
    gates: gates.map((item) => ({ id: item.id, status: item.status })),
    wrote: [OUTPUT_JSON, OUTPUT_MD],
  }, null, 2));

  if (liveGateEvidence.errors.length > 0) {
    console.error('Redacted live-gate evidence is invalid. See generated artifact for verifier-safe error details.');
    process.exitCode = 1;
    return;
  }

  if (commercialEvidenceRecords.errors.length > 0) {
    console.error('Redacted commercial evidence records are invalid. See generated artifact for verifier-safe error details.');
    process.exitCode = 1;
    return;
  }

  if (requireComplete && !goalComplete) {
    console.error('Remediation external gates are not complete. See generated artifact for remaining evidence.');
    process.exitCode = 1;
  }
}

main();

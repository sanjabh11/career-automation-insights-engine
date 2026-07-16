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
import {
  DEFAULT_INPUT_PATH as DEFAULT_MANUAL_WCAG_EVIDENCE_PATH,
  SCHEMA_VERSION as MANUAL_WCAG_EVIDENCE_SCHEMA_VERSION,
  validateManualWcagEvidence,
} from './verify-manual-wcag-evidence.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const OUTPUT_JSON = 'docs/commercialization/remediation-external-gates-latest.json';
const OUTPUT_MD = 'docs/commercialization/remediation-external-gates-latest.md';
const ENV_FILES = ['.env.local', '.env'];
const LIVE_PROOF_OWNER_PREP_COMMAND =
  'npm run generate:live-proof-run-packet && npm run prepare:owner-evidence -- --write && set -a; source .env.local; set +a';

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

function stripOuterQuotes(value) {
  const trimmed = String(value || '').trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function parseEnvAssignment(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return null;
  const key = trimmed.slice(0, trimmed.indexOf('=')).trim();
  const value = trimmed.slice(trimmed.indexOf('=') + 1).trim();
  return key && value ? { key, value: stripOuterQuotes(value) } : null;
}

function parseEnvLine(line) {
  return parseEnvAssignment(line)?.key || null;
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

function loadEnvAssignments() {
  const assignments = new Map(
    Object.entries(process.env).filter(([, value]) => typeof value === 'string' && value.trim())
  );

  for (const file of ENV_FILES) {
    try {
      const source = fs.readFileSync(path.join(root, file), 'utf8');
      for (const line of source.split(/\r?\n/)) {
        const parsed = parseEnvAssignment(line);
        if (parsed && !assignments.has(parsed.key)) assignments.set(parsed.key, parsed.value);
      }
    } catch {
      // Local env files are optional and secret values must never be printed.
    }
  }

  return assignments;
}

function resolveEnvValue(assignments, aliases) {
  for (const alias of aliases) {
    const value = assignments.get(alias);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function stripeKeyMode(value) {
  if (!value) return 'missing';
  if (/^(sk|rk)_test_/.test(value)) return 'test';
  if (/^(sk|rk)_live_/.test(value)) return 'live';
  return 'unknown';
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
    ownerAction: options.ownerAction || null,
    ownerPrepCommand: options.ownerPrepCommand || null,
    nextCommand: options.nextCommand || null,
    riskIfSkipped: options.riskIfSkipped || null,
    doesNotProve: options.doesNotProve || [],
  };
}

const COMPLETE_GATE_STATUSES = [
  'locally_proven',
  'locally_proven_with_scope_limit',
  'satisfied_by_mapping_and_us_basis_disclosure',
  'satisfied_by_mapping_adapter_and_us_basis_disclosure',
  'externally_proven_redacted_evidence_attached',
  'manual_wcag_evidence_attached',
];

function escapeCell(value) {
  return String(value ?? 'n/a').replace(/\|/g, '\\|').replace(/\n/g, '<br/>');
}

function renderCommandCell(command) {
  return command ? `\`${escapeCell(command)}\`` : 'n/a';
}

function ownerActionQueueFor(gates) {
  return gates
    .filter((item) => !COMPLETE_GATE_STATUSES.includes(item.status))
    .map((item) => ({
      id: item.id,
      label: item.label,
      status: item.status,
      ownerAction: item.ownerAction || item.neededEvidence,
      ownerPrepCommand: item.ownerPrepCommand || null,
      nextCommand: item.nextCommand || null,
      riskIfSkipped: item.riskIfSkipped || 'The launch gate remains incomplete and must not be represented as commercially proven.',
      sourceBoundary: item.sourceBoundary,
      doesNotProve: item.doesNotProve,
    }));
}

function statusForExternalGate(missing, localReady) {
  if (!localReady) return 'repo_not_ready';
  return missing.length > 0 ? 'blocked_missing_owner_secret_or_live_evidence' : 'ready_for_owner_live_run';
}

function renderMarkdown(artifact) {
  const rows = artifact.gates
    .map((item) => `| ${escapeCell(item.label)} | ${escapeCell(item.status)} | ${escapeCell(item.evidence)} | ${escapeCell(item.neededEvidence)} | ${escapeCell(item.ownerAction || 'n/a')} | ${renderCommandCell(item.ownerPrepCommand)} | ${renderCommandCell(item.nextCommand)} |`)
    .join('\n');
  const ownerActionRows = artifact.ownerActionQueue
    .map((item) => `| ${escapeCell(item.label)} | ${escapeCell(item.status)} | ${escapeCell(item.ownerAction)} | ${renderCommandCell(item.ownerPrepCommand)} | ${renderCommandCell(item.nextCommand)} | ${escapeCell(item.riskIfSkipped)} |`)
    .join('\n');

  return `# Remediation External Gates

Generated: ${artifact.generatedAt}
Branch: \`${artifact.branch}\`
Goal complete: ${artifact.goalComplete ? 'yes' : 'no'}

This artifact is a non-mutating readiness ledger for the remaining APO Dashboard remediation gates. It records secret presence by variable name only and never stores secret values. It does not apply migrations, deploy functions, create Stripe sessions, query live customer data, or claim commercial validation.

| Gate | Status | Current evidence | Needed evidence | Owner action | Owner prep command | Next command |
| --- | --- | --- | --- | --- | --- | --- |
${rows}

## Owner Action Queue

This queue is generated from incomplete gates only. It is safe to share as an action list because it stores commands, metadata, and proof boundaries, not secrets or private customer details.

| Gate | Status | Owner action | Owner prep command | Next command | Risk if skipped |
| --- | --- | --- | --- | --- | --- |
${ownerActionRows || '| None | complete | No owner action remains. | n/a | n/a | n/a |'}

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

The commercial evidence verifier accepts only redacted metadata, owner-held proof artifact hashes/types, and raw-evidence owner-held attestation. Partner and outcome hashes must be unique. It rejects high-confidence secret and private-contact patterns and does not store partner names, contacts, contracts, private notes, raw quotes, raw proof artifacts, customer data, or revenue amounts.

## Manual WCAG Evidence

Schema: \`${artifact.manualWcagEvidence.schemaVersion}\`
Template: \`${artifact.manualWcagEvidence.templatePath}\`
Default local file: \`${artifact.manualWcagEvidence.defaultPath}\`
Current file found: ${artifact.manualWcagEvidence.found ? 'yes' : 'no'}
Required checkpoints: ${artifact.manualWcagEvidence.requiredCheckpointCount}
Checkpoint result records attached: ${artifact.manualWcagEvidence.checkpointResultCount}
Accepted checkpoint count: ${artifact.manualWcagEvidence.acceptedCheckpointCount}
Required route sample count: ${artifact.manualWcagEvidence.requiredRouteCount}
Routes reviewed in evidence: ${artifact.manualWcagEvidence.routeReviewedCount}
Required complete process count: ${artifact.manualWcagEvidence.requiredCompleteProcessCount}
Complete processes reviewed in evidence: ${artifact.manualWcagEvidence.completeProcessReviewedCount}
Required accessibility-support baseline count: ${artifact.manualWcagEvidence.requiredAccessibilitySupportBaselineCount}
Accessibility-support baseline combinations attached: ${artifact.manualWcagEvidence.accessibilitySupportBaselineCount}
Required official reference count: ${artifact.manualWcagEvidence.requiredOfficialReferenceCount}
Official references attached: ${artifact.manualWcagEvidence.officialReferenceCount}
Required owner-evidence archive policy field count: ${artifact.manualWcagEvidence.requiredOwnerEvidenceArchiveRequirementCount}
Accepted checkpoints: ${artifact.manualWcagEvidence.acceptedCheckpointIds.length ? artifact.manualWcagEvidence.acceptedCheckpointIds.map((id) => `\`${id}\``).join(', ') : 'none'}
Rejected checkpoints: ${artifact.manualWcagEvidence.rejectedCheckpointIds.length ? artifact.manualWcagEvidence.rejectedCheckpointIds.map((id) => `\`${id}\``).join(', ') : 'none'}
Complete: ${artifact.manualWcagEvidence.manualWcagGateSatisfied ? 'yes' : 'no'}
Validation errors: ${artifact.manualWcagEvidence.errorCount}

The manual WCAG evidence verifier accepts only redacted metadata. Raw reviewer notes, screenshots, recordings, assistive-technology transcripts, reviewer identities, issue details, evaluation-tool output, sample archives, artifact hash source maps, and owner-held archive records remain owner-held. This is still not a WCAG conformance claim unless a qualified reviewer separately makes that statement.

## Commands

\`\`\`bash
npm run verify:manual-wcag-evidence
npm run verify:remediation-gates
npm run verify:remediation-gates:write
\`\`\`

Use \`npm run verify:remediation-gates -- --live-evidence <path> --commercial-evidence <path> --manual-wcag-evidence <path> --require-complete\` only when all external evidence has been attached and you want the read-only command to fail closed until every gate is proven. Use \`npm run verify:remediation-gates:write -- --live-evidence <path> --commercial-evidence <path> --manual-wcag-evidence <path> --require-complete\` when you also want to refresh this tracked artifact.
`;
}

function main() {
  const generatedAt = new Date().toISOString();
  const requireComplete = hasFlag('--require-complete');
  const shouldWrite = hasFlag('--write');
  const liveEvidencePath = readFlagValue('--live-evidence') || readFlagValue('--live-gate-evidence');
  const commercialEvidencePath = readFlagValue('--commercial-evidence') || readFlagValue('--commercial-records');
  const manualWcagEvidencePath = readFlagValue('--manual-wcag-evidence') || readFlagValue('--accessibility-evidence');
  const envAssignments = loadEnvAssignments();
  const presentEnvNames = new Set(envAssignments.keys());
  const packageJson = JSON.parse(read('package.json'));
  const packageScripts = packageJson.scripts || {};
  const commercialEvidenceRecordsVerifier = readOptional('scripts/verify-commercial-evidence-records.mjs');
  const commercialEvidenceRecordsTemplate = readOptional('docs/commercialization/commercial-evidence-records-template.json');
  const manualWcagEvidenceVerifier = readOptional('scripts/verify-manual-wcag-evidence.mjs');
  const manualWcagEvidenceTemplate = readOptional('docs/commercialization/manual-wcag-evidence-template.json');
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
  const manualWcagEvidence = validateManualWcagEvidence({ root, inputPath: manualWcagEvidencePath });
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

  function manualWcagEvidenceGate(id, label, localReady, evidence, neededEvidence, options = {}) {
    if (manualWcagEvidence.manualWcagGateSatisfied) {
      return gate(
        id,
        label,
        'manual_wcag_evidence_attached',
        `Manual WCAG evidence metadata is accepted by \`verify:manual-wcag-evidence\` (${manualWcagEvidence.acceptedCheckpointIds.length} accepted checkpoint(s)); raw notes, screenshots, recordings, reviewer details, evaluation-tool output, issue logs, sample archives, artifact hash source maps, and owner-held archive records remain owner-held.`,
        'Keep manual WCAG evidence current after UI changes and preserve owner-held raw review notes for audit.',
        {
          ...options,
          sourceBoundary: 'redacted manual WCAG evidence metadata',
        }
      );
    }

    return gate(
      id,
      label,
      manualWcagEvidence.errors.length
        ? 'invalid_manual_wcag_evidence'
        : localReady
          ? 'blocked_missing_manual_wcag_evidence'
          : 'missing_local_verifier',
      manualWcagEvidence.errors.length
        ? `Manual WCAG evidence metadata is invalid with ${manualWcagEvidence.errors.length} verifier error(s).`
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
    packageScripts['verify:commercial-evidence-records'] === 'node scripts/verify-commercial-evidence-records.mjs' &&
    packageScripts['verify:commercial-evidence-records:write'] === 'node scripts/verify-commercial-evidence-records.mjs --write' &&
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

  const manualWcagEvidenceReady =
    packageScripts['verify:manual-wcag-evidence'] === 'node scripts/verify-manual-wcag-evidence.mjs' &&
    packageScripts['verify:manual-wcag-evidence:write'] === 'node scripts/verify-manual-wcag-evidence.mjs --write' &&
    exists('scripts/verify-manual-wcag-evidence.mjs') &&
    exists('docs/commercialization/manual-wcag-evidence-template.json') &&
    containsAll(manualWcagEvidenceVerifier, [
      'manual_wcag_evidence',
      'REQUIRED_CHECKPOINT_IDS',
      'WCAG-EM',
      'screen-reader-name-role-value',
      'contrast-reflow-text-spacing',
      'downloadable-artifacts',
      'REVIEW_RECORD_ARCHIVE_ATTESTATIONS',
      'reviewRecordArchive',
      'technologiesReliedUpon',
      'sampleSetSelectionMethod',
      'manual-wcag-evidence.local.json',
    ]) &&
    containsAll(manualWcagEvidenceTemplate, [
      '2026-06-04.apo-manual-wcag-evidence.v1',
      'WCAG 2.2 A/AA',
      'reviewerAttestation',
      'reviewRecordArchive',
      'technologiesReliedUpon',
      'sampleSetSelectionMethod',
      'checkpointResults',
      'downloadable-artifacts',
      'doesNotProve',
    ]);

  const liveGateEvidenceIntakeReady =
    packageScripts['verify:live-gate-evidence'] === 'node scripts/verify-live-gate-evidence.mjs' &&
    exists('scripts/verify-live-gate-evidence.mjs') &&
    exists('scripts/lib/liveGateEvidence.mjs') &&
    containsAll(readOptional('scripts/lib/liveGateEvidence.mjs'), [
      'LIVE_PROOF_ARCHIVE_REQUIREMENTS',
      'ownerEvidenceArchive',
      'rawCheckoutSessionPayloadOwnerHeld',
      'rawSubscriptionExportOwnerHeld',
    ]) &&
    containsAll(readOptional('docs/commercialization/live-gate-evidence-template.json'), [
      'ownerEvidenceArchive',
      'rawCheckoutSessionPayloadOwnerHeld',
      'rawSubscriptionExportOwnerHeld',
    ]) &&
    exists('docs/commercialization/live-gate-evidence-template.json');

  const stripeMissing = missingGroups(presentEnvNames, [
    {
      label: 'STRIPE_TEST_SECRET_KEY or STRIPE_TEST_RESTRICTED_KEY',
      aliases: ['STRIPE_TEST_SECRET_KEY', 'STRIPE_TEST_RESTRICTED_KEY'],
    },
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
  const stripeTestKeyMode = stripeKeyMode(resolveEnvValue(envAssignments, ['STRIPE_TEST_SECRET_KEY', 'STRIPE_TEST_RESTRICTED_KEY']));
  const stripeTestKeyModeReady = stripeTestKeyMode === 'test';
  const stripeLocalReady =
    packageScripts['verify:stripe-test-checkout'] === 'node scripts/verify-stripe-test-checkout.mjs --write' &&
    exists('scripts/verify-stripe-test-checkout.mjs') &&
    containsAll(stripeTestCheckoutVerifier, [
      'create-checkout-session',
      'livemode=false',
      'STRIPE_TEST_SECRET_KEY',
      'STRIPE_TEST_PRICE_ID',
      'LIVE_SUPABASE_TEST_USER_EMAIL',
      'checkoutSessionMode',
      'paymentStatus',
      'ownerEvidenceArchive',
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
      'ownerEvidenceArchive',
      'rawSubscriptionExportOwnerHeld',
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
    manualWcagEvidenceGate(
      'manual_wcag_evidence',
      'Manual WCAG accessibility evidence',
      manualWcagEvidenceReady,
      manualWcagEvidenceReady
        ? `Manual WCAG evidence verifier is ready; ${manualWcagEvidence.acceptedCheckpointIds.length} accepted checkpoint(s) are attached.`
        : 'Manual WCAG evidence verifier is missing or miswired.',
      `Completed redacted manual WCAG 2.2 A/AA evidence metadata validated by \`npm run verify:manual-wcag-evidence -- --evidence ${DEFAULT_MANUAL_WCAG_EVIDENCE_PATH} --require-complete\`, including WCAG-EM product scope, route-sample rationale, sample-selection method, technologies relied upon, complete-process review, accessibility-support baseline combinations, reviewer type and conflict disclosure, review-record archive attestations, ownerEvidenceArchive policy metadata, keyboard/focus, target-size, form error, accessible-authentication, screen-reader, contrast/reflow/text-spacing, and downloadable-artifact review. Use \`npm run generate:manual-wcag-review-packet\`, \`docs/commercialization/manual-wcag-review-packet-latest.md\`, and \`docs/commercialization/manual-wcag-review-matrix-latest.csv\` as the reviewer worksheet before hashing owner-held proof artifacts.`,
      {
        sourceBoundary: 'owner-held manual accessibility review',
        ownerAction: 'Generate the manual WCAG review packet, complete the owner-held WCAG-EM review from the route/checkpoint matrix, document product scope, sample rationale, sample-selection method, technologies relied upon, complete processes, support-baseline combinations, reviewer type/conflict boundary, review-record archive attestations, and ownerEvidenceArchive policy metadata, hash local WCAG review proof files, replace placeholder hashes in the ignored local evidence file, and keep raw reviewer notes/screenshots/AT transcripts/tool output/sample archives/hash source maps outside git.',
        ownerPrepCommand: 'npm run generate:manual-wcag-review-packet && npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>',
        nextCommand: `npm run verify:manual-wcag-evidence -- --evidence ${DEFAULT_MANUAL_WCAG_EVIDENCE_PATH} --require-complete`,
        riskIfSkipped: 'The product can keep automated accessibility smoke evidence, but it must not claim WCAG conformance or procurement-ready accessibility evidence.',
        doesNotProve: ['WCAG conformance statement', 'legal compliance', 'institutional procurement approval', 'future accessibility after code changes'],
      }
    ),
    externalGate(
      'real_stripe_test_checkout',
      'Real Stripe test-mode checkout',
      !stripeLocalReady
        ? 'repo_not_ready'
        : stripeMissing.length
          ? 'blocked_missing_owner_secret_or_live_evidence'
          : stripeTestKeyModeReady
            ? 'ready_for_owner_live_run'
            : 'blocked_missing_explicit_test_stripe_key',
      stripeMissing.length
        ? `Local checkout code and owner-run verifier are ready, but required secret/env names are absent: ${stripeMissing.join(', ')}.`
        : stripeTestKeyModeReady
          ? 'Required test-mode secret/env names are present; run `npm run verify:stripe-test-checkout` to create and retrieve a test-mode Checkout Session without printing secrets.'
          : 'Required checkout inputs are present, but no explicit test-mode Stripe key is available. Add `STRIPE_TEST_SECRET_KEY` or `STRIPE_TEST_RESTRICTED_KEY`; generic `STRIPE_SECRET_KEY` is intentionally ignored for this test proof.',
      'Owner-provided Stripe/Supabase test credentials, `STRIPE_TEST_PRICE_ID`, and a successful `npm run verify:stripe-test-checkout` artifact with test-mode subscription Checkout metadata, payment status, and owner-held archive policy.',
      {
        sourceBoundary: 'owner credential gate',
        ownerAction: 'Load owner-held Supabase synthetic-user credentials, a Stripe test-mode key, and a matching test Price ID, then run the checkout verifier against the deployed or staging function; keep raw Checkout Session payloads, function invocation metadata, screenshots, and Stripe dashboard records outside git.',
        ownerPrepCommand: LIVE_PROOF_OWNER_PREP_COMMAND,
        nextCommand: 'npm run verify:stripe-test-checkout',
        riskIfSkipped: 'Checkout remains source-ready only; no real Stripe test-mode session can be cited in buyer or launch evidence.',
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
        ownerAction: 'Confirm the target Supabase project has approved migrations, deployed `calibrate-ece`, configured function secrets, APO logs, and expert labels before running the calibration verifier.',
        nextCommand: 'npm run verify:production-calibration',
        riskIfSkipped: 'Calibration remains public-artifact and local-code evidence only; production calibration and scientific validity remain unproven.',
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
        ownerAction: 'Load target Supabase URL/anon key plus the dedicated synthetic test-user email/password, then run the authenticated live artifact save/delete verifier.',
        nextCommand: 'npm run verify:commercial-live-auth-e2e',
        riskIfSkipped: 'Authenticated artifact persistence and deletion receipts remain locally wired but not proven against the target live project.',
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
      'Owner-provided live-mode Stripe restricted/secret key and a successful `npm run verify:stripe-live-mrr` artifact showing active subscriptions, paid invoices, redacted `total_mrr > 0` evidence, and owner-held subscription/invoice archive policy.',
      {
        sourceBoundary: 'owner live Stripe credential gate',
        ownerAction: 'Provide a live-mode read-only Stripe key after a real paid recurring subscription exists, then run the live-MRR verifier without exposing customer or invoice details; keep raw subscription exports, invoice exports, dashboard screenshots, and customer-level evidence outside git.',
        ownerPrepCommand: LIVE_PROOF_OWNER_PREP_COMMAND,
        nextCommand: 'npm run verify:stripe-live-mrr',
        riskIfSkipped: 'Revenue must stay unclaimed; test checkout, configured prices, and UI conversion events do not prove live MRR.',
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
      `At least three unique permissioned partner records validated by \`npm run verify:commercial-evidence-records -- --evidence ${DEFAULT_COMMERCIAL_EVIDENCE_RECORDS_PATH} --require-partners\`, with pilot scope, planning-only use, artifact reviewed, next step, contact permission, proof artifact hashes/types, marketing/testimonial integrity attestations, rawEvidenceOwnerHeld=true, ownerEvidenceArchive policy metadata, and owner worksheet coverage from \`npm run generate:commercial-evidence-intake-packet\`.`,
      {
        sourceBoundary: 'owner redacted commercial-evidence records',
        ownerAction: 'Generate the commercial evidence intake packet, use the partner/outcome matrix to prepare owner-held proof, hash owner-held partner proof artifacts, then fill the ignored commercial evidence intake with three permissioned design-partner commitments, non-placeholder proofArtifactHashes, supported proofArtifactTypes, marketing/testimonial integrity attestations, rawEvidenceOwnerHeld=true, ownerEvidenceArchive policy metadata, and an owner-held salt; preserve raw names/contracts/proof artifacts outside git.',
        ownerPrepCommand: 'npm run generate:commercial-evidence-intake-packet && npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>',
        nextCommand: 'COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all',
        riskIfSkipped: 'Pilot traction remains a worksheet or lead-ops capability, not committed partner evidence.',
        doesNotProve: ['Revenue', 'Successful outcomes', 'Market-wide demand', 'Legal compliance', 'Testimonial compliance'],
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
      `At least one permissioned outcome record validated by \`npm run verify:commercial-evidence-records -- --evidence ${DEFAULT_COMMERCIAL_EVIDENCE_RECORDS_PATH} --require-outcomes\`, with baseline workflow, artifact reviewed, measured change, measured-change unit, measurement window, outcome claim scope, typicality boundary, quote approval, proof artifact hashes/types, marketing/testimonial and outcome integrity attestations, rawEvidenceOwnerHeld=true, ownerEvidenceArchive policy metadata, does-not-prove text, and owner worksheet coverage from \`npm run generate:commercial-evidence-intake-packet\`.`,
      {
        sourceBoundary: 'owner redacted commercial-evidence records',
        ownerAction: 'Generate the commercial evidence intake packet, use the partner/outcome matrix to prepare owner-held proof, hash owner-held outcome proof artifacts, then fill the ignored commercial evidence intake with at least one permissioned documented outcome, including baseline workflow, measured change, measured-change unit, measurement window, outcome claim scope, typicality boundary, quote approval, non-placeholder proofArtifactHashes, supported proofArtifactTypes, marketing/testimonial and outcome integrity attestations, rawEvidenceOwnerHeld=true, ownerEvidenceArchive policy metadata, and caveats.',
        ownerPrepCommand: 'npm run generate:commercial-evidence-intake-packet && npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>',
        nextCommand: 'COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all',
        riskIfSkipped: 'Outcome claims must remain absent or anecdote-bounded; no case-study evidence can be cited as launch proof.',
        doesNotProve: ['Guaranteed career outcomes', 'Causal impact', 'Generalizable demand', 'Legal compliance', 'Testimonial compliance'],
      }
    ),
  ];

  const remainingManualEvidence = gates
    .filter((item) => !COMPLETE_GATE_STATUSES.includes(item.status))
    .map((item) => `${item.label}: ${item.neededEvidence}`);
  const ownerActionQueue = ownerActionQueueFor(gates);

  const goalComplete = remainingManualEvidence.length === 0;
  const artifact = {
    generatedAt,
    branch: 'phase-e-commercial-validation',
    goalComplete,
    requireComplete,
    gates,
    ownerActionQueue,
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
    manualWcagEvidence: {
      schemaVersion: MANUAL_WCAG_EVIDENCE_SCHEMA_VERSION,
      templatePath: 'docs/commercialization/manual-wcag-evidence-template.json',
      reviewPacketPath: 'docs/commercialization/manual-wcag-review-packet-latest.md',
      reviewMatrixPath: 'docs/commercialization/manual-wcag-review-matrix-latest.csv',
      defaultPath: DEFAULT_MANUAL_WCAG_EVIDENCE_PATH,
      found: manualWcagEvidence.found,
      inputPath: manualWcagEvidence.inputPath,
      requiredCheckpointCount: manualWcagEvidence.requiredCheckpointCount,
      requiredRouteCount: manualWcagEvidence.requiredRouteCount,
      requiredCompleteProcessCount: manualWcagEvidence.requiredCompleteProcessCount,
      requiredAccessibilitySupportBaselineCount: manualWcagEvidence.requiredAccessibilitySupportBaselineCount,
      requiredOfficialReferenceCount: manualWcagEvidence.requiredOfficialReferenceCount,
      requiredOwnerEvidenceArchiveRequirementCount: manualWcagEvidence.requiredOwnerEvidenceArchiveRequirementCount,
      acceptedCheckpointIds: manualWcagEvidence.acceptedCheckpointIds,
      acceptedCheckpointCount: manualWcagEvidence.acceptedCheckpointCount || 0,
      rejectedCheckpointIds: manualWcagEvidence.rejectedCheckpointIds,
      checkpointResultCount: manualWcagEvidence.checkpointResultCount || 0,
      routeReviewedCount: manualWcagEvidence.routeReviewedCount || 0,
      completeProcessReviewedCount: manualWcagEvidence.completeProcessReviewedCount || 0,
      accessibilitySupportBaselineCount: manualWcagEvidence.accessibilitySupportBaselineCount || 0,
      officialReferenceCount: manualWcagEvidence.officialReferenceCount || 0,
      complete: manualWcagEvidence.complete,
      manualWcagGateSatisfied: manualWcagEvidence.manualWcagGateSatisfied,
      errorCount: manualWcagEvidence.errors.length,
      errors: manualWcagEvidence.errors,
    },
  };

  if (shouldWrite) {
    fs.mkdirSync(path.join(root, 'docs/commercialization'), { recursive: true });
    fs.writeFileSync(path.join(root, OUTPUT_JSON), `${JSON.stringify(artifact, null, 2)}\n`);
    fs.writeFileSync(path.join(root, OUTPUT_MD), renderMarkdown(artifact));
  }

  const evidenceInputsValid =
    liveGateEvidence.errors.length === 0 &&
    commercialEvidenceRecords.errors.length === 0 &&
    manualWcagEvidence.errors.length === 0;
  const requirementsSatisfied = !requireComplete || goalComplete;

  console.log(JSON.stringify({
    ok: evidenceInputsValid && requirementsSatisfied,
    goalComplete,
    liveGateEvidence: artifact.liveGateEvidence,
    commercialEvidenceRecords: artifact.commercialEvidenceRecords,
    manualWcagEvidence: artifact.manualWcagEvidence,
    gates: gates.map((item) => ({
      id: item.id,
      label: item.label,
      status: item.status,
      evidence: item.evidence,
      neededEvidence: item.neededEvidence,
      sourceBoundary: item.sourceBoundary,
      ownerAction: item.ownerAction,
      ownerPrepCommand: item.ownerPrepCommand,
      nextCommand: item.nextCommand,
      riskIfSkipped: item.riskIfSkipped,
      doesNotProve: item.doesNotProve,
    })),
    ownerActionQueue,
    remainingManualEvidence,
    ownerActionQueueCount: ownerActionQueue.length,
    wrote: shouldWrite ? [OUTPUT_JSON, OUTPUT_MD] : null,
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

  if (manualWcagEvidence.errors.length > 0) {
    console.error('Manual WCAG evidence metadata is invalid. See generated artifact for verifier-safe error details.');
    process.exitCode = 1;
    return;
  }

  if (requireComplete && !goalComplete) {
    console.error('Remediation external gates are not complete. See generated artifact for remaining evidence.');
    process.exitCode = 1;
  }
}

main();

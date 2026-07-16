#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const args = process.argv.slice(2);

function readFlagValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const root = path.resolve(readFlagValue('--root', path.resolve(__dirname, '..')));

const LIVE_PACKET_PATH = 'docs/commercialization/live-proof-run-packet-latest.json';
const REMEDIATION_LEDGER_PATH = 'docs/commercialization/remediation-external-gates-latest.json';
const CLOSEOUT_STATUS_PATH = 'docs/commercialization/owner-evidence-closeout-status-latest.json';
const HANDOFF_PATH = 'docs/commercialization/owner-evidence-handoff-latest.json';
const MODEL_PATH = 'src/lib/commercialLaunchReadiness.ts';
const QUEUE_EXPORT_NAME = 'ownerEvidenceActionQueueItems';

const STRIPE_GATE_IDS = ['real_stripe_test_checkout', 'live_mrr_gt_zero'];
const REQUIRED_SETUP_COMMANDS = [
  'npm run generate:live-proof-run-packet',
  'npm run prepare:owner-evidence -- --write',
  'set -a; source .env.local; set +a',
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function propName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  return null;
}

function literalValue(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literalValue);
  return undefined;
}

function objectLiteralToRecord(node) {
  const record = {};
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const key = propName(property.name);
    if (!key) continue;
    const value = literalValue(property.initializer);
    if (value !== undefined) record[key] = value;
  }
  return record;
}

function extractExportedArray(sourceText, exportName) {
  const source = ts.createSourceFile(MODEL_PATH, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let arrayNode = null;

  function visit(node) {
    if (arrayNode) return;
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === exportName) {
      if (node.initializer && ts.isArrayLiteralExpression(node.initializer)) {
        arrayNode = node.initializer;
        return;
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  if (!arrayNode) throw new Error(`Could not find ${exportName} in ${MODEL_PATH}`);
  return arrayNode.elements.map((element) => {
    if (!ts.isObjectLiteralExpression(element)) throw new Error(`${exportName} contains a non-object entry`);
    return objectLiteralToRecord(element);
  });
}

function byId(rows, idField = 'id') {
  return new Map((rows || []).map((row) => [row[idField], row]));
}

function addMismatch(errors, source, gateId, field, expected, actual) {
  errors.push({
    type: 'command_mismatch',
    source,
    gateId,
    field,
    expected,
    actual: actual || '',
  });
}

function requireEqual(errors, source, gateId, field, expected, actual) {
  if (expected !== (actual || '')) addMismatch(errors, source, gateId, field, expected, actual);
}

function requireRow(errors, source, gateId, row) {
  if (row) return true;
  errors.push({ type: 'missing_gate_row', source, gateId });
  return false;
}

function main() {
  const livePacket = readJson(LIVE_PACKET_PATH);
  const remediationLedger = readJson(REMEDIATION_LEDGER_PATH);
  const closeoutStatus = readJson(CLOSEOUT_STATUS_PATH);
  const handoff = readJson(HANDOFF_PATH);
  const uiRows = extractExportedArray(read(MODEL_PATH), QUEUE_EXPORT_NAME);
  const errors = [];

  const ownerCommandSequence = livePacket.ownerCommandSequence || [];
  const expectedOwnerPrepCommand = REQUIRED_SETUP_COMMANDS.join(' && ');
  const actualSetupCommands = ownerCommandSequence.slice(0, REQUIRED_SETUP_COMMANDS.length);

  if (JSON.stringify(actualSetupCommands) !== JSON.stringify(REQUIRED_SETUP_COMMANDS)) {
    errors.push({
      type: 'live_packet_setup_sequence_mismatch',
      expected: REQUIRED_SETUP_COMMANDS,
      actual: actualSetupCommands,
    });
  }

  const liveProofCommandByGate = byId(livePacket.liveProofs || [], 'gateId');
  const remediationGateById = byId(remediationLedger.gates || []);
  const remediationQueueById = byId(remediationLedger.ownerActionQueue || []);
  const closeoutQueueById = byId(closeoutStatus.ownerActionQueue || []);
  const closeoutSummaryById = byId(closeoutStatus.ownerGateCloseoutSummary || [], 'gateId');
  const handoffRowById = byId(handoff.ownerActionRows || [], 'gateId');
  const uiQueueById = byId(uiRows, 'gateId');
  const collectLiveProofs = closeoutStatus.nextCommands?.collectLiveProofs || [];

  for (const gateId of STRIPE_GATE_IDS) {
    const liveProof = liveProofCommandByGate.get(gateId);
    if (!requireRow(errors, 'live-proof-run-packet.liveProofs', gateId, liveProof)) continue;
    const expectedNextCommand = liveProof.command;

    if (!ownerCommandSequence.includes(expectedNextCommand)) {
      errors.push({
        type: 'live_packet_missing_proof_command',
        gateId,
        expectedNextCommand,
      });
    }
    if (!collectLiveProofs.includes(expectedNextCommand)) {
      errors.push({
        type: 'closeout_missing_collect_live_proof_command',
        gateId,
        expectedNextCommand,
        collectLiveProofs,
      });
    }

    for (const [source, row] of [
      ['remediation.gates', remediationGateById.get(gateId)],
      ['remediation.ownerActionQueue', remediationQueueById.get(gateId)],
      ['closeout.ownerActionQueue', closeoutQueueById.get(gateId)],
      ['closeout.ownerGateCloseoutSummary', closeoutSummaryById.get(gateId)],
      ['handoff.ownerActionRows', handoffRowById.get(gateId)],
      ['ui.ownerEvidenceActionQueueItems', uiQueueById.get(gateId)],
    ]) {
      if (!requireRow(errors, source, gateId, row)) continue;
      requireEqual(errors, source, gateId, 'ownerPrepCommand', expectedOwnerPrepCommand, row.ownerPrepCommand);
      requireEqual(errors, source, gateId, 'nextCommand', expectedNextCommand, row.nextCommand);
    }
  }

  const result = {
    ok: errors.length === 0,
    sourceLiveProofPacket: LIVE_PACKET_PATH,
    sourceRemediationLedger: REMEDIATION_LEDGER_PATH,
    sourceCloseoutStatus: CLOSEOUT_STATUS_PATH,
    sourceHandoff: HANDOFF_PATH,
    sourceUiModel: MODEL_PATH,
    checkedGateIds: STRIPE_GATE_IDS,
    expectedOwnerPrepCommand,
    expectedSetupCommands: REQUIRED_SETUP_COMMANDS,
    evidenceBoundary:
      'This verifier proves command alignment only. It does not load env values, run Stripe, create checkout sessions, query live revenue, prove MRR, or complete owner-held live evidence gates.',
    errorCount: errors.length,
    errors,
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main();

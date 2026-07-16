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

const LEDGER_PATH = 'docs/commercialization/remediation-external-gates-latest.json';
const MODEL_PATH = 'src/lib/commercialLaunchReadiness.ts';
const QUEUE_EXPORT_NAME = 'ownerEvidenceActionQueueItems';
const STALE_NEXT_COMMANDS = new Map([
  [
    'manual_wcag_evidence',
    [
      'npm run verify:manual-wcag-evidence -- --require-complete',
    ],
  ],
  [
    'three_committed_partners',
    [
      'npm run compose:commercial-evidence-records -- --write --require-all',
    ],
  ],
  [
    'documented_outcomes',
    [
      'npm run compose:commercial-evidence-records -- --write --require-all',
    ],
  ],
]);

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function statusForUi(status) {
  if (status === 'blocked_missing_owner_evidence_records' || status === 'ready_for_owner_live_run') return 'owner_action';
  if (status === 'blocked_missing_explicit_test_stripe_key' || status.startsWith('blocked_') || status.startsWith('invalid_')) return 'blocked';
  return status;
}

function normalizeDoesNotProve(value) {
  if (Array.isArray(value)) return value.join('; ');
  return String(value || '').trim();
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

function findQueueArray(sourceText) {
  const source = ts.createSourceFile(MODEL_PATH, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let arrayNode = null;

  function visit(node) {
    if (arrayNode) return;
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === QUEUE_EXPORT_NAME) {
      if (node.initializer && ts.isArrayLiteralExpression(node.initializer)) {
        arrayNode = node.initializer;
        return;
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  if (!arrayNode) throw new Error(`Could not find ${QUEUE_EXPORT_NAME} array in ${MODEL_PATH}`);
  return arrayNode.elements.map((element) => {
    if (!ts.isObjectLiteralExpression(element)) throw new Error(`${QUEUE_EXPORT_NAME} contains a non-object entry`);
    return objectLiteralToRecord(element);
  });
}

function comparableCanonicalItem(item) {
  return {
    gateId: item.id,
    label: item.label,
    status: statusForUi(item.status),
    ownerAction: item.ownerAction,
    ownerPrepCommand: item.ownerPrepCommand || '',
    nextCommand: item.nextCommand,
    riskIfSkipped: item.riskIfSkipped,
    sourceBoundary: item.sourceBoundary,
    doesNotProve: normalizeDoesNotProve(item.doesNotProve),
  };
}

function comparableUiItem(item) {
  return {
    gateId: item.gateId,
    label: item.label,
    status: item.status,
    ownerAction: item.ownerAction,
    ownerPrepCommand: item.ownerPrepCommand || '',
    nextCommand: item.nextCommand,
    riskIfSkipped: item.riskIfSkipped,
    sourceBoundary: item.sourceBoundary,
    doesNotProve: normalizeDoesNotProve(item.doesNotProve),
  };
}

function diffItems(expected, actual) {
  const fields = [
    'gateId',
    'label',
    'status',
    'ownerAction',
    'ownerPrepCommand',
    'nextCommand',
    'riskIfSkipped',
    'sourceBoundary',
    'doesNotProve',
  ];
  return fields
    .filter((field) => expected[field] !== actual[field])
    .map((field) => ({
      field,
      expected: expected[field],
      actual: actual[field],
    }));
}

function main() {
  const ledger = JSON.parse(read(LEDGER_PATH));
  const ownerActionQueue = Array.isArray(ledger.ownerActionQueue) ? ledger.ownerActionQueue : [];
  const canonicalItems = ownerActionQueue.map(comparableCanonicalItem);
  const uiItems = findQueueArray(read(MODEL_PATH)).map(comparableUiItem);
  const errors = [];

  if (canonicalItems.length === 0) {
    errors.push({
      type: 'missing_owner_action_queue',
      sourceLedger: LEDGER_PATH,
    });
  }

  if (canonicalItems.length !== uiItems.length) {
    errors.push({
      type: 'count_mismatch',
      expected: canonicalItems.length,
      actual: uiItems.length,
    });
  }

  const uiByGateId = new Map(uiItems.map((item) => [item.gateId, item]));

  for (const expected of canonicalItems) {
    const actual = uiByGateId.get(expected.gateId);
    if (!actual) {
      errors.push({ type: 'missing_ui_queue_item', gateId: expected.gateId });
      continue;
    }
    const fieldDiffs = diffItems(expected, actual);
    if (fieldDiffs.length) {
      errors.push({
        type: 'queue_item_mismatch',
        gateId: expected.gateId,
        diffs: fieldDiffs,
      });
    }
  }

  for (const item of [...canonicalItems, ...uiItems]) {
    const staleCommands = STALE_NEXT_COMMANDS.get(item.gateId) || [];
    if (staleCommands.includes(item.nextCommand)) {
      errors.push({
        type: 'stale_next_command',
        gateId: item.gateId,
        nextCommand: item.nextCommand,
      });
    }
  }

  const canonicalGateIds = new Set(canonicalItems.map((item) => item.gateId));
  for (const actual of uiItems) {
    if (!canonicalGateIds.has(actual.gateId)) {
      errors.push({ type: 'extra_ui_queue_item', gateId: actual.gateId });
    }
  }

  const result = {
    ok: errors.length === 0,
    sourceLedger: LEDGER_PATH,
    uiModel: MODEL_PATH,
    canonicalQueueCount: canonicalItems.length,
    uiQueueCount: uiItems.length,
    gateIds: canonicalItems.map((item) => item.gateId),
    statusMappingBoundary:
      'UI queue status intentionally maps granular remediation statuses to blocked/owner_action display states; all action text, commands, risks, source boundaries, and does-not-prove text must match exactly.',
    staleCommandBoundary:
      'Owner-action queue nextCommand values must use explicit local evidence paths and owner-held salt commands where required; shorthand commands are rejected even if source and UI match.',
    errors,
  };

  console.log(JSON.stringify(result, null, 2));
  if (errors.length) process.exitCode = 1;
}

main();

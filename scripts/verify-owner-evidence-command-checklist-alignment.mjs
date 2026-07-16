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

const HANDOFF_JSON_PATH = 'docs/commercialization/owner-evidence-handoff-latest.json';
const MODEL_PATH = 'src/lib/commercialLaunchReadiness.ts';
const COMMAND_EXPORT_NAME = 'ownerEvidenceCloseoutCommandItems';

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
  let initializer = null;

  function visit(node) {
    if (initializer) return;
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === exportName) {
      initializer = node.initializer || null;
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  if (!initializer) throw new Error(`Could not find ${exportName} in ${MODEL_PATH}`);
  if (!ts.isArrayLiteralExpression(initializer)) {
    throw new Error(`${exportName} must be an array literal`);
  }

  return initializer.elements.map((element) => {
    if (!ts.isObjectLiteralExpression(element)) {
      throw new Error(`${exportName} contains a non-object entry`);
    }
    return objectLiteralToRecord(element);
  });
}

function addError(errors, type, detail) {
  errors.push({ type, ...detail });
}

function main() {
  const handoff = readJson(HANDOFF_JSON_PATH);
  const modelText = read(MODEL_PATH);
  const commandItems = extractExportedArray(modelText, COMMAND_EXPORT_NAME);
  const errors = [];

  const expectedCommands = Array.isArray(handoff.commandSequence) ? handoff.commandSequence : [];
  if (expectedCommands.length === 0) {
    addError(errors, 'missing_handoff_command_sequence', {
      sourceHandoff: HANDOFF_JSON_PATH,
    });
  }
  const actualCommands = commandItems.map((item) => item.command);
  if (JSON.stringify(expectedCommands) !== JSON.stringify(actualCommands)) {
    addError(errors, 'command_sequence_mismatch', {
      expected: expectedCommands,
      actual: actualCommands,
    });
  }

  const commandIds = new Set();
  commandItems.forEach((item, index) => {
    const context = `ownerEvidenceCloseoutCommandItems[${index}]`;
    if (!item.commandId) addError(errors, 'missing_field', { context, field: 'commandId' });
    if (item.commandId && commandIds.has(item.commandId)) {
      addError(errors, 'duplicate_command_id', { context, commandId: item.commandId });
    }
    if (item.commandId) commandIds.add(item.commandId);
    for (const field of ['label', 'status', 'command', 'writes', 'safetyBoundary']) {
      if (!item[field]) addError(errors, 'missing_field', { context, field });
    }
    if (!Array.isArray(item.requiredOwnerInputs) || item.requiredOwnerInputs.length === 0) {
      addError(errors, 'missing_required_owner_inputs', { context, commandId: item.commandId || null });
    }
  });

  const result = {
    ok: errors.length === 0,
    sourceHandoff: HANDOFF_JSON_PATH,
    uiModel: MODEL_PATH,
    expectedCommandCount: expectedCommands.length,
    uiCommandCount: actualCommands.length,
    commandIds: commandItems.map((item) => item.commandId),
    evidenceBoundary:
      'This alignment check proves the Trust Center command checklist mirrors the generated owner-evidence handoff sequence only; it does not prove live checkout, live MRR, production calibration, authenticated live artifact persistence, partner commitments, documented outcomes, manual WCAG conformance, or commercial readiness.',
    errorCount: errors.length,
    errors,
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main();

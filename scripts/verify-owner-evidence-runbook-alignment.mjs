#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const args = process.argv.slice(2);

function readFlagValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const root = path.resolve(readFlagValue('--root', path.resolve(__dirname, '..')));

const HANDOFF_JSON_PATH = 'docs/commercialization/owner-evidence-handoff-latest.json';
const RUNBOOK_PATHS = [
  'docs/commercialization/part-i-owner-evidence-blocker-runbook.md',
  'docs/commercialization/phase-e-commercial-validation-playbook.md',
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readIfExists(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return fs.readFileSync(absolutePath, 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function addError(errors, type, detail) {
  errors.push({ type, ...detail });
}

function extractBashBlocks(source) {
  const normalized = source.replace(/\r\n/g, '\n');
  const blocks = [];
  const pattern = /```bash\n([\s\S]*?)\n```/g;
  let match;
  while ((match = pattern.exec(normalized))) {
    blocks.push(
      match[1]
        .split('\n')
        .map((line) => line.trimEnd())
        .filter((line) => line.length > 0),
    );
  }
  return blocks;
}

function hasExactCommandSequenceBlock(source, commandSequence) {
  return extractBashBlocks(source).some((block) => JSON.stringify(block) === JSON.stringify(commandSequence));
}

function main() {
  const handoff = readJson(HANDOFF_JSON_PATH);
  const commandSequence = Array.isArray(handoff.commandSequence) ? handoff.commandSequence : [];
  const errors = [];

  if (commandSequence.length === 0) {
    addError(errors, 'missing_handoff_command_sequence', { sourceHandoff: HANDOFF_JSON_PATH });
  }

  for (const runbookPath of RUNBOOK_PATHS) {
    const source = readIfExists(runbookPath);
    if (source === null) {
      addError(errors, 'missing_runbook', { runbookPath });
      continue;
    }
    if (!hasExactCommandSequenceBlock(source, commandSequence)) {
      addError(errors, 'missing_exact_command_sequence_block', {
        runbookPath,
        expectedCommandCount: commandSequence.length,
      });
    }

    commandSequence.forEach((command, index) => {
      if (!source.includes(command)) {
        addError(errors, 'missing_command', { runbookPath, index, command });
      }
    });

    for (const staleCommand of [
      'npm run compose:live-gate-evidence -- --write --require-complete\n',
      'npm run verify:live-gate-evidence -- --require-complete',
      'npm run verify:commercial-evidence-records -- --require-all',
      'npm run verify:manual-wcag-evidence -- --require-complete',
      'npm run closeout:owner-evidence -- --write --refresh-tracked --manual-wcag-evidence docs/commercialization/manual-wcag-evidence.local.json',
    ]) {
      if (source.includes(staleCommand)) {
        addError(errors, 'stale_command', { runbookPath, staleCommand });
      }
    }
  }

  const result = {
    ok: errors.length === 0,
    sourceHandoff: HANDOFF_JSON_PATH,
    runbooks: RUNBOOK_PATHS,
    commandCount: commandSequence.length,
    evidenceBoundary:
      'This alignment check proves owner-facing runbooks include the generated owner-evidence handoff command sequence only; it does not prove live checkout, live MRR, production calibration, authenticated live artifact persistence, partner commitments, documented outcomes, manual WCAG conformance, or commercial readiness.',
    errorCount: errors.length,
    errors,
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main();

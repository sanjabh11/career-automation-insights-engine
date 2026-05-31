#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateLiveGateEvidence } from './lib/liveGateEvidence.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

function readFlagValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const requireAny = process.argv.includes('--require-any');
const requireAll = process.argv.includes('--require-all');
const evidencePath = readFlagValue('--evidence');
const result = validateLiveGateEvidence({ root, evidencePath });

console.log(JSON.stringify({
  ok: result.errors.length === 0,
  found: result.found,
  evidencePath: result.evidencePath,
  acceptedGateIds: result.acceptedGateIds,
  rejectedGateIds: result.rejectedGateIds,
  errorCount: result.errors.length,
  errors: result.errors,
}, null, 2));

if (result.errors.length > 0) {
  process.exitCode = 1;
} else if (requireAny && result.acceptedGateIds.length === 0) {
  console.error('No accepted live-gate evidence item was found.');
  process.exitCode = 1;
} else if (requireAll && result.acceptedGateIds.length < 6) {
  console.error('Not all live-gate evidence items are accepted.');
  process.exitCode = 1;
}

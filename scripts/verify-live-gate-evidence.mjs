#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LIVE_GATE_EVIDENCE_GATE_IDS,
  LIVE_GATE_EVIDENCE_REQUIRED_COUNT,
  validateLiveGateEvidence,
} from './lib/liveGateEvidence.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

function readFlagValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const requireAny = process.argv.includes('--require-any');
const requireComplete = process.argv.includes('--require-complete') || process.argv.includes('--require-all');
const evidencePath = readFlagValue('--evidence');
const result = validateLiveGateEvidence({ root, evidencePath });
const acceptedGateIdSet = new Set(result.acceptedGateIds);
const complete = LIVE_GATE_EVIDENCE_GATE_IDS.every((gateId) => acceptedGateIdSet.has(gateId));
const requirementsSatisfied = (!requireAny || result.acceptedGateIds.length > 0) && (!requireComplete || complete);

console.log(JSON.stringify({
  ok: result.errors.length === 0 && requirementsSatisfied,
  found: result.found,
  evidencePath: result.evidencePath,
  requiredGateIds: LIVE_GATE_EVIDENCE_GATE_IDS,
  acceptedGateIds: result.acceptedGateIds,
  rejectedGateIds: result.rejectedGateIds,
  complete,
  errorCount: result.errors.length,
  errors: result.errors,
}, null, 2));

if (result.errors.length > 0) {
  process.exitCode = 1;
} else if (requireAny && result.acceptedGateIds.length === 0) {
  console.error('No accepted live-gate evidence item was found.');
  process.exitCode = 1;
} else if (requireComplete && !complete) {
  console.error('Not all live-gate evidence items are accepted.');
  process.exitCode = 1;
}

#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const auditDir = path.resolve(__dirname, '..', '.positioning-audit');

const violations = [];

function readJSON(filename) {
  const filepath = path.join(auditDir, filename);
  if (!fs.existsSync(filepath)) {
    violations.push({ file: filename, issue: `File not found: ${filename}` });
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    violations.push({ file: filename, issue: `JSON parse error: ${e.message}` });
    return null;
  }
}

function checkRequiredFields(obj, fields, filename) {
  for (const field of fields) {
    if (!(field in obj)) {
      violations.push({ file: filename, issue: `Missing required field: ${field}` });
    }
  }
}

// --- state.json ---
const state = readJSON('state.json');
if (state) {
  checkRequiredFields(state, [
    'schema_version', 'current_phase', 'market_validation_status',
    'experiments_designed', 'experiments_executed', 'evidence_limited_mode',
  ], 'state.json');

  if (state.schema_version !== 'v8') {
    violations.push({ file: 'state.json', issue: `schema_version is "${state.schema_version}", expected "v8"` });
  }
  if (state.current_phase !== 'VALIDATION_PENDING') {
    violations.push({ file: 'state.json', issue: `current_phase is "${state.current_phase}", expected "VALIDATION_PENDING"` });
  }
  if (state.market_validation_status !== 'validation_pending') {
    violations.push({ file: 'state.json', issue: `market_validation_status is "${state.market_validation_status}", expected "validation_pending"` });
  }
  if (state.experiments_executed !== 0) {
    violations.push({ file: 'state.json', issue: `experiments_executed is ${state.experiments_executed}, expected 0` });
  }
  if (state.evidence_limited_mode !== true) {
    violations.push({ file: 'state.json', issue: `evidence_limited_mode is not true` });
  }
}

// --- experiments.json ---
const experiments = readJSON('experiments.json');
if (experiments) {
  if (experiments.schema_version !== 'v8') {
    violations.push({ file: 'experiments.json', issue: `schema_version is "${experiments.schema_version}", expected "v8"` });
  }
  const requiredExpFields = [
    'experiment_id', 'hypothesis_id', 'claim_being_tested', 'owner', 'method', 'fidelity',
    'instrumentation', 'risk_check', 'success_threshold',
    'failure_threshold', 'decision_rule', 'status',
  ];
  for (const exp of experiments.experiments || []) {
    checkRequiredFields(exp, requiredExpFields, 'experiments.json');
    if (exp.status !== 'designed' && exp.status !== 'deferred') {
      violations.push({ file: 'experiments.json', issue: `${exp.experiment_id} has status=${exp.status}, expected "designed" or "deferred"` });
    }
  }
  // Check count agreement
  if (state && experiments.experiments) {
    if (state.experiments_designed !== experiments.experiments.length) {
      violations.push({
        file: 'experiments.json',
        issue: `experiments_designed in state.json (${state.experiments_designed}) does not match experiments array length (${experiments.experiments.length})`,
      });
    }
  }
}

// --- evidence-corpus.json ---
const evidence = readJSON('evidence-corpus.json');
if (evidence) {
  if (evidence.schema_version !== 'v8') {
    violations.push({ file: 'evidence-corpus.json', issue: `schema_version is "${evidence.schema_version}", expected "v8"` });
  }
  for (const item of evidence.evidence_items || []) {
    if (item.timestamp && !item.timestamp.includes('T')) {
      violations.push({
        file: 'evidence-corpus.json',
        issue: `${item.evidence_id} timestamp "${item.timestamp}" is not RFC3339 format`,
      });
    }
    if (item.url_health === 'not_checked') {
      violations.push({
        file: 'evidence-corpus.json',
        issue: `${item.evidence_id} has url_health "not_checked" — must be alive or not_applicable`,
      });
    }
  }
}

// --- hypotheses.json ---
const hypotheses = readJSON('hypotheses.json');
if (hypotheses) {
  if (hypotheses.schema_version !== 'v8') {
    violations.push({ file: 'hypotheses.json', issue: `schema_version is "${hypotheses.schema_version}", expected "v8"` });
  }
  for (const hyp of hypotheses.hypotheses || []) {
    if (hyp.status === 'supported') {
      violations.push({
        file: 'hypotheses.json',
        issue: `${hyp.id} has status "supported" — all hypotheses must be "unresolved" in evidence-limited mode`,
      });
    }
    if (hyp.status !== 'unresolved') {
      violations.push({
        file: 'hypotheses.json',
        issue: `${hyp.id} has status "${hyp.status}" — expected "unresolved"`,
      });
    }
  }
}

// --- competitor-matrix.json ---
const competitors = readJSON('competitor-matrix.json');
if (competitors) {
  if (competitors.schema_version !== 'v8') {
    violations.push({ file: 'competitor-matrix.json', issue: `schema_version is "${competitors.schema_version}", expected "v8"` });
  }
  const requiredCompFields = [
    'source_locator', 'confidence', 'skeptic_review',
    'missing_perspective', 'contrarian_review', 'url_health',
  ];
  for (const comp of competitors.competitors || []) {
    checkRequiredFields(comp, requiredCompFields, 'competitor-matrix.json');
    if (comp.url_health === 'not_checked') {
      violations.push({
        file: 'competitor-matrix.json',
        issue: `${comp.company_name} has url_health "not_checked"`,
      });
    }
  }
}

// --- Report ---
if (violations.length > 0) {
  console.error(JSON.stringify({ ok: false, violations, count: violations.length }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    ok: true,
    message: 'All positioning audit artifacts validated successfully',
  }, null, 2));
}

#!/usr/bin/env node

import fs from 'node:fs';

const SUMMARY_JSON =
  process.env.COMMERCIAL_SUMMARY_REDACTION_SUMMARY_JSON ||
  'docs/commercialization/commercial-verification-summary-latest.json';
const SUMMARY_MD =
  process.env.COMMERCIAL_SUMMARY_REDACTION_SUMMARY_MD ||
  'docs/commercialization/commercial-verification-summary-latest.md';
const REDACTION_JSON =
  process.env.COMMERCIAL_SUMMARY_REDACTION_ARTIFACT_JSON ||
  'docs/commercialization/commercial-artifact-redaction-latest.json';
const REDACTION_MD =
  process.env.COMMERCIAL_SUMMARY_REDACTION_ARTIFACT_MD ||
  'docs/commercialization/commercial-artifact-redaction-latest.md';
const EXPECTED_SUMMARY_JSON_SCANNED_PATH = 'docs/commercialization/commercial-verification-summary-latest.json';
const EXPECTED_SUMMARY_MD_SCANNED_PATH = 'docs/commercialization/commercial-verification-summary-latest.md';
const EXPECTED_REDACTION_JSON_ARTIFACT_PATH = 'docs/commercialization/commercial-artifact-redaction-latest.json';
const EXPECTED_REDACTION_MD_ARTIFACT_PATH = 'docs/commercialization/commercial-artifact-redaction-latest.md';
const SUMMARY_SCHEMA = '2026-06-05.apo-commercial-verification-summary.v1';
const REDACTION_SCHEMA = '2026-06-05.apo-commercial-artifact-redaction.v1';
const EXPECTED_REDACTION_COMMAND = 'node scripts/verify-commercial-artifact-redaction.mjs --write';
const EXPECTED_ALIGNMENT_COMMAND = 'node scripts/verify-commercial-summary-redaction-alignment.mjs';
const EXPECTED_EXECUTION_ORDER = 'after final commercial verification summary write';
const EXPECTED_ALIGNMENT_EXECUTION_ORDER = 'after post-summary artifact redaction scan';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function parseDate(value, label, errors) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    errors.push(`${label} must be a valid ISO timestamp`);
    return null;
  }

  return timestamp;
}

function hasScannedFile(redaction, file) {
  return Array.isArray(redaction.scannedFiles) && redaction.scannedFiles.includes(file);
}

function main() {
  const errors = [];
  const summary = readJson(SUMMARY_JSON);
  const redaction = readJson(REDACTION_JSON);
  const redactionMarkdown = fs.existsSync(REDACTION_MD) ? fs.readFileSync(REDACTION_MD, 'utf8') : '';

  if (!fs.existsSync(SUMMARY_MD)) errors.push(`${SUMMARY_MD} is missing`);
  if (!fs.existsSync(REDACTION_MD)) errors.push(`${REDACTION_MD} is missing`);
  if (summary.schemaVersion !== SUMMARY_SCHEMA) errors.push(`${SUMMARY_JSON} schemaVersion mismatch`);
  if (redaction.schemaVersion !== REDACTION_SCHEMA) errors.push(`${REDACTION_JSON} schemaVersion mismatch`);
  if (summary.status !== 'passed') errors.push(`${SUMMARY_JSON} status must be passed`);
  if (redaction.ok !== true) errors.push(`${REDACTION_JSON} ok must be true`);
  if (redaction.status !== 'passed') errors.push(`${REDACTION_JSON} status must be passed`);
  if (redaction.findingCount !== 0) errors.push(`${REDACTION_JSON} findingCount must be 0`);
  if (!Array.isArray(redaction.findings) || redaction.findings.length !== 0) {
    errors.push(`${REDACTION_JSON} findings must be an empty array`);
  }
  if (!Array.isArray(redaction.scannedExtensions)) {
    errors.push(`${REDACTION_JSON} scannedExtensions must be an array`);
  } else if (redaction.scannedExtensionCount !== redaction.scannedExtensions.length) {
    errors.push(`${REDACTION_JSON} scannedExtensionCount must match scannedExtensions length`);
  }
  if (!redactionMarkdown.includes(`| Scanned extensions | ${redaction.scannedExtensionCount ?? ''} |`)) {
    errors.push(`${REDACTION_MD} must include scannedExtensionCount`);
  }
  if (!Array.isArray(redaction.doesNotProve)) {
    errors.push(`${REDACTION_JSON} doesNotProve must be an array`);
  } else if (redaction.doesNotProveCount !== redaction.doesNotProve.length) {
    errors.push(`${REDACTION_JSON} doesNotProveCount must match doesNotProve length`);
  }
  if (!redactionMarkdown.includes(`| Does-not-prove boundaries | ${redaction.doesNotProveCount ?? ''} |`)) {
    errors.push(`${REDACTION_MD} must include doesNotProveCount`);
  }
  if (!Array.isArray(redaction.referencePractices)) {
    errors.push(`${REDACTION_JSON} referencePractices must be an array`);
  } else if (redaction.referencePracticeCount !== redaction.referencePractices.length) {
    errors.push(`${REDACTION_JSON} referencePracticeCount must match referencePractices length`);
  }
  if (!redactionMarkdown.includes(`| Reference practices | ${redaction.referencePracticeCount ?? ''} |`)) {
    errors.push(`${REDACTION_MD} must include referencePracticeCount`);
  }

  const postSummary = summary.postSummaryArtifactRedaction;
  if (!postSummary || typeof postSummary !== 'object') {
    errors.push(`${SUMMARY_JSON} must include postSummaryArtifactRedaction`);
  } else {
    if (postSummary.command !== EXPECTED_REDACTION_COMMAND) {
      errors.push('postSummaryArtifactRedaction.command mismatch');
    }
    if (postSummary.executionOrder !== EXPECTED_EXECUTION_ORDER) {
      errors.push('postSummaryArtifactRedaction.executionOrder mismatch');
    }
    if (postSummary.includedInThisInvocation !== true) {
      errors.push('postSummaryArtifactRedaction.includedInThisInvocation must be true');
    }
    if (postSummary.resultArtifacts?.json !== EXPECTED_REDACTION_JSON_ARTIFACT_PATH) {
      errors.push('postSummaryArtifactRedaction.resultArtifacts.json mismatch');
    }
    if (postSummary.resultArtifacts?.markdown !== EXPECTED_REDACTION_MD_ARTIFACT_PATH) {
      errors.push('postSummaryArtifactRedaction.resultArtifacts.markdown mismatch');
    }
    if (postSummary.alignmentVerifier?.command !== EXPECTED_ALIGNMENT_COMMAND) {
      errors.push('postSummaryArtifactRedaction.alignmentVerifier.command mismatch');
    }
    if (postSummary.alignmentVerifier?.executionOrder !== EXPECTED_ALIGNMENT_EXECUTION_ORDER) {
      errors.push('postSummaryArtifactRedaction.alignmentVerifier.executionOrder mismatch');
    }
  }

  if (!hasScannedFile(redaction, EXPECTED_SUMMARY_JSON_SCANNED_PATH)) {
    errors.push(`${REDACTION_JSON} scannedFiles must include ${EXPECTED_SUMMARY_JSON_SCANNED_PATH}`);
  }
  if (!hasScannedFile(redaction, EXPECTED_SUMMARY_MD_SCANNED_PATH)) {
    errors.push(`${REDACTION_JSON} scannedFiles must include ${EXPECTED_SUMMARY_MD_SCANNED_PATH}`);
  }

  const summaryGeneratedAt = parseDate(summary.generatedAt, `${SUMMARY_JSON}.generatedAt`, errors);
  const summaryEndedAt = parseDate(summary.endedAt, `${SUMMARY_JSON}.endedAt`, errors);
  const redactionGeneratedAt = parseDate(redaction.generatedAt, `${REDACTION_JSON}.generatedAt`, errors);

  if (
    summaryGeneratedAt !== null &&
    redactionGeneratedAt !== null &&
    redactionGeneratedAt <= summaryGeneratedAt
  ) {
    errors.push(`${REDACTION_JSON}.generatedAt must be later than ${SUMMARY_JSON}.generatedAt`);
  }
  if (summaryEndedAt !== null && redactionGeneratedAt !== null && redactionGeneratedAt <= summaryEndedAt) {
    errors.push(`${REDACTION_JSON}.generatedAt must be later than ${SUMMARY_JSON}.endedAt`);
  }

  if (errors.length > 0) {
    console.error('Commercial summary redaction alignment verification failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `Commercial summary redaction alignment passed: ${EXPECTED_SUMMARY_JSON_SCANNED_PATH} and ${EXPECTED_SUMMARY_MD_SCANNED_PATH} were scanned after summary write with zero findings.`,
  );
}

main();

#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const OUTPUT_JSON = 'docs/commercialization/resume-parser-live-latest.json';
const OUTPUT_MD = 'docs/commercialization/resume-parser-live-latest.md';
const REQUEST_TIMEOUT_MS = Number(process.env.LIVE_SUPABASE_TIMEOUT_MS || 60_000);
const ENV_FILES = ['.env.local', '.env'];
const REQUIRED_SOURCE_IDS = ['owasp-file-upload', 'supabase-edge-functions', 'nist-ai-rmf', 'ada-ai-hiring-guidance'];
const REQUIRED_VALIDATION_CONTROLS = [
  'extension_allowlist',
  'declared_content_type_recorded_not_trusted',
  'file_signature_check',
  'max_upload_size_2mb',
  'no_public_storage_write',
  'no_raw_resume_text_persistence',
];

const fixtures = [
  {
    id: 'txt-success-boundary',
    label: 'UTF-8 text resume extracts in memory with non-persistence receipt',
    filename: 'proof-pack-live-parser.txt',
    mimeType: 'text/plain',
    bytes: new TextEncoder().encode([
      'Name: Proof Pack Candidate',
      'Skills: workforce analytics, AI governance, career coaching',
      'Experience: Built source-labeled transition reports for counselors.',
    ].join('\n')),
    expectation: 'txt-success',
  },
  {
    id: 'pdf-adapter-pending-boundary',
    label: 'PDF upload is accepted only as adapter-pending, without extraction',
    filename: 'proof-pack-live-parser.pdf',
    mimeType: 'application/pdf',
    bytes: new TextEncoder().encode('%PDF-1.4\n% proof pack adapter-pending fixture\n'),
    expectation: 'pdf-adapter-pending',
  },
  {
    id: 'unsupported-file-rejection',
    label: 'Unsupported extension/signature is rejected with non-persistence receipt',
    filename: 'proof-pack-live-parser.exe',
    mimeType: 'application/octet-stream',
    bytes: new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]),
    expectation: 'unsupported-rejected',
  },
];

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function getFlagValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return null;
  const equalsIndex = trimmed.indexOf('=');
  const key = trimmed.slice(0, equalsIndex).trim();
  let value = trimmed.slice(equalsIndex + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return { key, value };
}

async function loadLocalEnv() {
  const loaded = {};
  for (const file of ENV_FILES) {
    try {
      const source = await readFile(file, 'utf8');
      for (const line of source.split(/\r?\n/)) {
        const parsed = parseEnvLine(line);
        if (parsed && loaded[parsed.key] === undefined) {
          loaded[parsed.key] = parsed.value;
        }
      }
    } catch {
      // Local env files are optional for this verifier.
    }
  }
  return loaded;
}

function resolveEnv(localEnv, keys) {
  for (const key of keys) {
    const value = process.env[key] || localEnv[key];
    if (value && value.trim()) return value.trim();
  }
  return '';
}

function sha256Hex(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function redactMessage(value) {
  if (!value) return '';
  return String(value)
    .replace(/eyJ[A-Za-z0-9._-]+/g, '[jwt-redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/sb_[A-Za-z0-9._-]+/g, '[supabase-key-redacted]')
    .slice(0, 700);
}

function parseBodyText(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function bodyMessage(body) {
  if (!body) return '';
  if (typeof body === 'string') return body;
  if (typeof body === 'object') {
    return [body.error, body.message, body.details, body.hint, body.code].filter(Boolean).join(' ');
  }
  return String(body);
}

function includesAll(values, requiredValues) {
  if (!Array.isArray(values)) return false;
  return requiredValues.every((value) => values.includes(value));
}

function validateReceiptBase(receipt) {
  const issues = [];
  if (!receipt || typeof receipt !== 'object') {
    return ['parser_receipt is missing or not an object'];
  }

  if (receipt.rawFileStored !== false) issues.push('rawFileStored must be false');
  if (receipt.rawResumeTextStored !== false) issues.push('rawResumeTextStored must be false');
  if (receipt.productionPdfDocxParser !== false) issues.push('productionPdfDocxParser must be false until adapter proof exists');
  if (receipt.tempFileDeletionStatus !== 'not_persisted') issues.push('tempFileDeletionStatus must be not_persisted');
  if (receipt.deletionStatus !== 'not_persisted') issues.push('deletionStatus must be not_persisted');
  if (!includesAll(receipt.sourceIds, REQUIRED_SOURCE_IDS)) {
    issues.push(`sourceIds must include ${REQUIRED_SOURCE_IDS.join(', ')}`);
  }
  if (!includesAll(receipt.validationControls, REQUIRED_VALIDATION_CONTROLS)) {
    issues.push(`validationControls must include ${REQUIRED_VALIDATION_CONTROLS.join(', ')}`);
  }
  if (!receipt.caveat || typeof receipt.caveat !== 'string') issues.push('caveat is required');
  if (!receipt.doesNotProve || typeof receipt.doesNotProve !== 'string') issues.push('doesNotProve is required');
  return issues;
}

function summarizeReceipt(receipt) {
  if (!receipt || typeof receipt !== 'object') return null;
  return {
    receiptIdPresent: Boolean(receipt.receiptId),
    generatedAt: receipt.generatedAt || null,
    filenameHash: receipt.filenameHash || null,
    fileSha256: receipt.fileSha256 || null,
    byteLength: receipt.byteLength ?? null,
    declaredMimeType: receipt.declaredMimeType || null,
    detectedFileKind: receipt.detectedFileKind || null,
    accepted: receipt.accepted ?? null,
    extractedTextAvailable: receipt.extractedTextAvailable ?? null,
    rawFileStored: receipt.rawFileStored ?? null,
    rawResumeTextStored: receipt.rawResumeTextStored ?? null,
    productionPdfDocxParser: receipt.productionPdfDocxParser ?? null,
    tempFileDeletionStatus: receipt.tempFileDeletionStatus || null,
    deletionStatus: receipt.deletionStatus || null,
    validationControls: Array.isArray(receipt.validationControls) ? receipt.validationControls : [],
    sourceIds: Array.isArray(receipt.sourceIds) ? receipt.sourceIds : [],
    caveat: receipt.caveat || null,
    doesNotProve: receipt.doesNotProve || null,
  };
}

function classifyResponse(fixture, status, body) {
  const message = bodyMessage(body);
  const serialized = typeof body === 'string' ? body : JSON.stringify(body || {});
  const receipt = body && typeof body === 'object' ? body.parser_receipt : null;
  const issues = validateReceiptBase(receipt);

  if (status === 404 || /function.*not.*found|not found/i.test(`${message} ${serialized}`)) {
    return {
      passed: false,
      classification: 'function-not-deployed',
      message: redactMessage(message || serialized || `HTTP ${status}`),
      receiptSummary: summarizeReceipt(receipt),
    };
  }

  if ([401, 403].includes(status)) {
    return {
      passed: false,
      classification: 'authorization-rejected',
      message: redactMessage(message || serialized || `HTTP ${status}`),
      receiptSummary: summarizeReceipt(receipt),
    };
  }

  if (fixture.expectation === 'txt-success') {
    const extractedText = body && typeof body === 'object' ? body.extracted_text : null;
    if (
      status >= 200 &&
      status < 300 &&
      body?.success === true &&
      typeof extractedText === 'string' &&
      extractedText.length > 0 &&
      receipt?.accepted === true &&
      receipt?.extractedTextAvailable === true &&
      receipt?.detectedFileKind === 'txt' &&
      issues.length === 0
    ) {
      return {
        passed: true,
        classification: 'text-extracted-non-persistent',
        message: 'Text upload returned a parser receipt with non-persistence controls.',
        extractedTextLength: extractedText.length,
        extractedTextSha256: sha256Hex(Buffer.from(extractedText, 'utf8')),
        receiptSummary: summarizeReceipt(receipt),
      };
    }
    return {
      passed: false,
      classification: 'unexpected-text-success-response',
      message: redactMessage(message || serialized || `HTTP ${status}`),
      validationIssues: issues,
      receiptSummary: summarizeReceipt(receipt),
    };
  }

  if (fixture.expectation === 'pdf-adapter-pending') {
    if (
      status === 422 &&
      body?.success === false &&
      body?.error === 'parser_adapter_pending' &&
      receipt?.accepted === true &&
      receipt?.extractedTextAvailable === false &&
      receipt?.detectedFileKind === 'pdf' &&
      issues.length === 0
    ) {
      return {
        passed: true,
        classification: 'pdf-adapter-pending-non-persistent',
        message: 'PDF upload produced the expected adapter-pending receipt without extraction.',
        receiptSummary: summarizeReceipt(receipt),
      };
    }
    return {
      passed: false,
      classification: 'unexpected-pdf-boundary-response',
      message: redactMessage(message || serialized || `HTTP ${status}`),
      validationIssues: issues,
      receiptSummary: summarizeReceipt(receipt),
    };
  }

  if (fixture.expectation === 'unsupported-rejected') {
    if (
      status === 415 &&
      body?.success === false &&
      body?.error === 'unsupported_file_type' &&
      receipt?.accepted === false &&
      receipt?.extractedTextAvailable === false &&
      receipt?.detectedFileKind === 'unknown' &&
      issues.length === 0
    ) {
      return {
        passed: true,
        classification: 'unsupported-file-rejected-non-persistent',
        message: 'Unsupported file returned the expected rejection receipt.',
        receiptSummary: summarizeReceipt(receipt),
      };
    }
    return {
      passed: false,
      classification: 'unexpected-unsupported-file-response',
      message: redactMessage(message || serialized || `HTTP ${status}`),
      validationIssues: issues,
      receiptSummary: summarizeReceipt(receipt),
    };
  }

  return {
    passed: false,
    classification: 'unknown-fixture-expectation',
    message: `Unknown expectation ${fixture.expectation}`,
    receiptSummary: summarizeReceipt(receipt),
  };
}

async function fetchFixture(baseUrl, anonKey, authToken, fixture) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const url = new URL('/functions/v1/parse-resume', baseUrl);
  const form = new FormData();
  form.append('resume_file', new Blob([fixture.bytes], { type: fixture.mimeType }), fixture.filename);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${authToken || anonKey}`,
        Accept: 'application/json',
      },
      body: form,
      signal: controller.signal,
    });
    const text = await response.text();
    const body = parseBodyText(text);
    const classification = classifyResponse(fixture, response.status, body);
    return {
      id: fixture.id,
      label: fixture.label,
      method: 'POST',
      path: '/functions/v1/parse-resume',
      filename: fixture.filename,
      fixtureSha256: sha256Hex(fixture.bytes),
      fixtureByteLength: fixture.bytes.byteLength,
      expectedBoundary: fixture.expectation,
      status: response.status,
      ...classification,
    };
  } catch (error) {
    return {
      id: fixture.id,
      label: fixture.label,
      method: 'POST',
      path: '/functions/v1/parse-resume',
      filename: fixture.filename,
      fixtureSha256: sha256Hex(fixture.bytes),
      fixtureByteLength: fixture.bytes.byteLength,
      expectedBoundary: fixture.expectation,
      status: null,
      passed: false,
      classification: error?.name === 'AbortError' ? 'timeout' : 'request-failed',
      message: redactMessage(error?.message || 'Request failed'),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function renderMarkdown(proof) {
  const rows = proof.checks
    .map((check) => {
      const sourceIds = check.receiptSummary?.sourceIds?.join(', ') || 'n/a';
      const caveat = check.receiptSummary?.caveat || check.message || 'n/a';
      return `| ${check.passed ? 'pass' : 'fail'} | \`${check.id}\` | ${check.status ?? 'n/a'} | ${check.classification} | ${sourceIds} | ${caveat.replace(/\|/g, '/')} |`;
    })
    .join('\n');

  return `# Resume Parser Live Proof

Generated: ${proof.generatedAt}
Verifier: \`${proof.verifier}\`
Mode: \`${proof.mode}\`
Target: ${proof.target ? `\`${proof.target.host}\`` : 'not configured'}
All passed: ${proof.allPassed}
Skipped: ${proof.skipped}

## Caveat

${proof.caveat}

## Does Not Prove

${proof.doesNotProve}

## Checks

| Result | Check | HTTP | Classification | Receipt Sources | Caveat |
| --- | --- | ---: | --- | --- | --- |
${rows || '| skipped | n/a | n/a | n/a | n/a | n/a |'}
`;
}

async function writeProof(proof) {
  await mkdir('docs/commercialization', { recursive: true });
  await writeFile(OUTPUT_JSON, `${JSON.stringify(proof, null, 2)}\n`);
  await writeFile(OUTPUT_MD, renderMarkdown(proof));
}

function printUsage() {
  console.log(`Usage: node scripts/verify-resume-parser-live.mjs [options]

Options:
  --url <url>              Supabase project URL. Defaults to SUPABASE_URL/VITE_SUPABASE_URL/PUBLIC_SUPABASE_URL.
  --anon-key <key>         Supabase anon/publishable key. Defaults to SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY/PUBLIC_SUPABASE_ANON_KEY/SUPABASE_PUBLISHABLE_KEY.
  --auth-token <jwt>       Optional user/session JWT for Authorization. Defaults to the anon/publishable key.
  --write                  Write redacted proof to ${OUTPUT_JSON} and ${OUTPUT_MD}.
  --allow-missing-env      Exit 0 with a skipped proof artifact when URL/key are unavailable.

This is a live Edge Function behavior verifier. It posts small synthetic fixtures
to parse-resume and expects source-labeled parser receipts proving upload
validation, non-persistence, text-only extraction, adapter-pending PDF handling,
and unsupported-file rejection. It does not apply migrations, deploy functions,
prove malware scanning, or prove PDF/DOC/DOCX production parsing.
`);
}

async function main() {
  if (hasFlag('--help') || hasFlag('-h')) {
    printUsage();
    return;
  }

  const localEnv = await loadLocalEnv();
  const rawUrl =
    getFlagValue('--url') ||
    resolveEnv(localEnv, ['SUPABASE_URL', 'VITE_SUPABASE_URL', 'PUBLIC_SUPABASE_URL']);
  const anonKey =
    getFlagValue('--anon-key') ||
    resolveEnv(localEnv, [
      'SUPABASE_ANON_KEY',
      'VITE_SUPABASE_ANON_KEY',
      'PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_PUBLISHABLE_KEY',
    ]);
  const authToken =
    getFlagValue('--auth-token') || resolveEnv(localEnv, ['SUPABASE_FUNCTION_JWT', 'SUPABASE_AUTH_JWT']);
  const allowMissingEnv = hasFlag('--allow-missing-env');

  const proof = {
    generatedAt: new Date().toISOString(),
    verifier: 'verify-resume-parser-live',
    mode: 'live-edge-function-parser-boundary',
    target: null,
    allPassed: false,
    skipped: false,
    caveat:
      'This verifies the deployed parse-resume Edge Function behavior from the public functions endpoint using synthetic non-sensitive fixtures. It does not apply migrations, deploy functions, prove authenticated resume artifact save/delete, prove malware scanning, or prove production PDF/DOC/DOCX extraction.',
    doesNotProve:
      'This does not prove uploaded files are malware-free, that PDF/DOC/DOCX parsing is production grade, that raw data is removed from every browser download/export/provider log/backup, or that the workflow is valid for employment decisions.',
    checks: [],
  };

  if (!rawUrl || !anonKey) {
    proof.skipped = true;
    proof.skipReason =
      'Missing Supabase URL or anon/publishable key. Provide SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY.';
    if (allowMissingEnv) {
      if (hasFlag('--write')) await writeProof(proof);
      console.log(`skip resume-parser-live-proof - ${proof.skipReason}`);
      return;
    }
    console.error(proof.skipReason);
    process.exitCode = 1;
    return;
  }

  let baseUrl;
  try {
    baseUrl = new URL(rawUrl);
  } catch {
    console.error('Supabase URL is invalid.');
    process.exitCode = 1;
    return;
  }

  proof.target = {
    host: baseUrl.host,
    projectRef: baseUrl.host.split('.')[0] || null,
    anonKeyProvided: true,
    authTokenProvided: Boolean(authToken),
  };

  const results = [];
  for (const fixture of fixtures) {
    const result = await fetchFixture(baseUrl, anonKey, authToken, fixture);
    results.push(result);
    console.log(`${result.passed ? 'ok' : 'fail'} ${fixture.id} - ${result.classification}`);
    if (!result.passed && result.message) {
      console.log(`  ${result.message}`);
    }
    if (!result.passed && result.validationIssues?.length) {
      for (const issue of result.validationIssues) console.log(`  ${issue}`);
    }
  }

  proof.checks = results;
  proof.allPassed = results.every((result) => result.passed);
  if (hasFlag('--write')) await writeProof(proof);

  if (!proof.allPassed) {
    console.error('Resume parser live proof failed.');
    process.exitCode = 1;
    return;
  }

  console.log('Resume parser live proof passed.');
}

await main();

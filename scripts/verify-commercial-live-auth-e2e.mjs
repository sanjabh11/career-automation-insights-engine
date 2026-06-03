#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const OUTPUT_PATH = 'docs/commercialization/live-auth-e2e-proof-latest.json';
const ENV_FILES = ['.env.local', '.env'];

function hasFlag(flag) {
  return process.argv.includes(flag);
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
      // Local env files are optional and must never be printed.
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

function sha256(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function safeError(error) {
  if (!error) return '';
  const message = typeof error === 'string' ? error : error.message || JSON.stringify(error);
  return String(message)
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email-redacted]')
    .replace(/eyJ[A-Za-z0-9._-]+/g, '[jwt-redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .slice(0, 500);
}

async function writeArtifact(artifact) {
  await mkdir('docs/commercialization', { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(`wrote ${OUTPUT_PATH}`);
}

function result(id, label, passed, message, evidence = {}) {
  return {
    id,
    label,
    passed,
    message,
    ...evidence,
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableAuthError(error) {
  const status = Number(error?.status || 0);
  const message = String(error?.message || '');
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504 || /timeout|retryable|context/i.test(message);
}

async function signInWithRetry(supabase, credentials, attempts = 4) {
  let lastResult = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    lastResult = await supabase.auth.signInWithPassword(credentials);
    if (!lastResult.error || !isRetryableAuthError(lastResult.error) || attempt === attempts) {
      return { ...lastResult, attempts: attempt };
    }
    await delay(1000 * attempt);
  }
  return { ...lastResult, attempts };
}

function buildRedactedProofHtml(runId) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Commercial Live Auth E2E Proof</title></head>
<body data-resume-proof-report-redacted="true">
  <main>
    <h1>Resume Work Transition Proof Report</h1>
    <p>Commercial live authenticated e2e verification run: ${runId}</p>
    <p><strong>Raw resume text stored: no.</strong> This redacted artifact omits raw resume text, phrase detail rows, and rewrite detail rows.</p>
    <p>This synthetic artifact is a coaching and review aid only. It is not a hiring, firing, promotion, compensation, layoff, screening, eligibility, consumer-report, or employment-decision artifact.</p>
    <section aria-label="Evidence boundary">
      <p>Source IDs: nist-ai-rmf, ada-ai-hiring-guidance, eeoc-employment-selection-procedures, cfpb-employment-algorithmic-scores, llm-output.</p>
      <p>Does not prove: malware scanning, PDF/DOCX extraction, provider-log deletion, browser-download deletion, legal compliance, or employment-selection validity.</p>
    </section>
  </main>
</body>
</html>`;
}

async function requireCleanDelete(label, operation) {
  try {
    const { error } = await operation();
    if (error) return result(label, label, false, safeError(error));
    return result(label, label, true, 'Cleanup completed.');
  } catch (error) {
    return result(label, label, false, safeError(error));
  }
}

async function main() {
  const shouldWrite = hasFlag('--write');
  const allowMissingEnv = hasFlag('--allow-missing-env');
  const generatedAt = new Date().toISOString();
  const runId = `commercial-live-auth-e2e-${generatedAt.replace(/[^0-9]/g, '').slice(0, 14)}`;
  const localEnv = await loadLocalEnv();

  const supabaseUrl = resolveEnv(localEnv, ['SUPABASE_URL', 'VITE_SUPABASE_URL']);
  const anonKey = resolveEnv(localEnv, ['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY']);
  const testEmail = resolveEnv(localEnv, ['LIVE_SUPABASE_TEST_USER_EMAIL']);
  const testPassword = resolveEnv(localEnv, ['LIVE_SUPABASE_TEST_USER_PASSWORD']);
  const missing = [
    ['SUPABASE_URL or VITE_SUPABASE_URL', supabaseUrl],
    ['SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY', anonKey],
    ['LIVE_SUPABASE_TEST_USER_EMAIL', testEmail],
    ['LIVE_SUPABASE_TEST_USER_PASSWORD', testPassword],
  ].filter(([, value]) => !value);

  const baseArtifact = {
    generatedAt,
    target: supabaseUrl ? new URL(supabaseUrl).origin : null,
    status: 'pending',
    confidence: 'bounded_authenticated_live_e2e',
    caveat:
      'This verifier signs in with a dedicated synthetic test user and exercises user-owned rows/RPCs. It proves the redacted artifact save/delete and saved-analysis deletion receipt path for that test user only; it does not prove malware scanning, PDF/DOCX extraction, provider-log deletion, backups, legal compliance, employment-selection validity, or buyer-specific governance.',
    doesNotProve: [
      'Production PDF/DOCX extraction',
      'Malware scanning',
      'External model-provider log deletion',
      'Browser downloads or exports deletion',
      'Backups deletion',
      'Employment-decision validity',
      'Buyer-specific EEOC/ADA/FCRA review',
    ],
    manualInterventionIfSkipped: [
      'Create a dedicated Supabase Auth test user that contains no real resume or client data.',
      'Add LIVE_SUPABASE_TEST_USER_EMAIL and LIVE_SUPABASE_TEST_USER_PASSWORD as local env values or GitHub Actions secrets.',
      'Run npm run verify:commercial-live-auth-e2e.',
      'Rotate the test password if it is ever pasted into chat, logs, or tracked files.',
    ],
    checks: [],
  };

  if (missing.length > 0) {
    const artifact = {
      ...baseArtifact,
      status: 'skipped_missing_env',
      missingEnv: missing.map(([key]) => key),
      checks: [
        result(
          'auth-e2e-env',
          'Authenticated live e2e credentials are configured',
          false,
          `Missing: ${missing.map(([key]) => key).join(', ')}`
        ),
      ],
    };
    if (shouldWrite) await writeArtifact(artifact);
    if (!allowMissingEnv) {
      console.error(
        'Commercial live authenticated e2e proof skipped because required env values are missing. Re-run with --allow-missing-env only when producing a non-passing planning artifact.'
      );
      process.exitCode = 1;
    } else {
      console.log('Commercial live authenticated e2e proof skipped because required env values are missing.');
    }
    return;
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const checks = [];
  let analysisId = null;
  let artifactId = null;

  try {
    const signIn = await signInWithRetry(supabase, {
      email: testEmail,
      password: testPassword,
    });

    if (signIn.error || !signIn.data?.user) {
      checks.push(result('auth-sign-in', 'Dedicated synthetic test user signs in', false, safeError(signIn.error)));
      throw new Error('auth-sign-in-failed');
    }

    const userId = signIn.data.user.id;
    checks.push(
      result('auth-sign-in', 'Dedicated synthetic test user signs in', true, 'Signed in with password without printing credentials.', {
        userIdHash: sha256(userId).slice(0, 16),
        emailHash: sha256(testEmail.toLowerCase()).slice(0, 16),
        authAttempts: signIn.attempts,
      })
    );

    const syntheticResumeText =
      'Synthetic non-sensitive verification resume text. Skills: workflow redesign, stakeholder facilitation, AI governance review, source-labeled reporting.';
    const insertAnalysis = await supabase
      .from('resume_analyses')
      .insert({
        user_id: userId,
        filename: `${runId}.txt`,
        file_size_bytes: syntheticResumeText.length,
        file_url: null,
        resume_text: syntheticResumeText,
        automation_risk_score: 42.5,
        confidence_score: 0.74,
        automation_prone_phrases: [
          {
            phrase: 'routine reporting',
            context: 'Synthetic verification fixture',
            severity: 'medium',
          },
        ],
        rewrite_suggestions: [
          {
            original: 'routine reporting',
            suggested: 'source-labeled evidence synthesis',
            rationale: 'Synthetic verification fixture; not coaching advice.',
          },
        ],
        detected_skills: ['workflow redesign', 'AI governance review'],
        recommended_skills: ['evidence review', 'stakeholder facilitation'],
        gemini_model: 'verification-synthetic-no-llm',
        processing_time_ms: 0,
      })
      .select('id, user_id, filename')
      .single();

    if (insertAnalysis.error || !insertAnalysis.data?.id) {
      checks.push(result('resume-analysis-insert', 'Synthetic saved resume analysis can be created under RLS', false, safeError(insertAnalysis.error)));
      throw new Error('resume-analysis-insert-failed');
    }

    analysisId = insertAnalysis.data.id;
    checks.push(
      result('resume-analysis-insert', 'Synthetic saved resume analysis can be created under RLS', true, 'Inserted a synthetic non-sensitive row owned by the signed-in test user.', {
        analysisId,
      })
    );

    const redactedHtml = buildRedactedProofHtml(runId);
    const createArtifact = await supabase.rpc('create_resume_proof_report_artifact', {
      p_analysis_id: analysisId,
      p_title: 'Commercial Live Auth E2E Proof',
      p_report_html_redacted: redactedHtml,
      p_source_versions: {
        verifier: 'verify-commercial-live-auth-e2e',
        generatedAt,
      },
      p_metadata: {
        verifier: 'verify-commercial-live-auth-e2e',
        review_status: 'staff_review_required',
        synthetic_fixture: true,
      },
    });

    const createdArtifact = Array.isArray(createArtifact.data) ? createArtifact.data[0] : null;
    if (createArtifact.error || !createdArtifact?.id) {
      checks.push(result('redacted-artifact-create', 'Redacted resume proof artifact can be created through authenticated RPC', false, safeError(createArtifact.error)));
      throw new Error('redacted-artifact-create-failed');
    }

    artifactId = createdArtifact.id;
    const artifactBoundaryPassed =
      createdArtifact.raw_resume_text_stored === false &&
      createdArtifact.resume_detail_rows_redacted === true &&
      createdArtifact.review_status === 'staff_review_required';

    checks.push(
      result(
        'redacted-artifact-create',
        'Redacted resume proof artifact can be created through authenticated RPC',
        artifactBoundaryPassed,
        artifactBoundaryPassed
          ? 'Created artifact preserves raw-text false, detail-row redaction true, and staff-review-required state.'
          : 'Created artifact did not preserve the expected redaction/review boundary.',
        {
          artifactId,
          reviewStatus: createdArtifact.review_status,
          rawResumeTextStored: createdArtifact.raw_resume_text_stored,
          resumeDetailRowsRedacted: createdArtifact.resume_detail_rows_redacted,
        }
      )
    );

    const deleteArtifact = await supabase.rpc('delete_resume_proof_report_artifact_with_receipt', {
      p_artifact_id: artifactId,
    });
    const artifactReceipt = Array.isArray(deleteArtifact.data) ? deleteArtifact.data[0] : null;
    if (deleteArtifact.error || !artifactReceipt?.receipt_hash) {
      checks.push(result('redacted-artifact-delete-receipt', 'Redacted proof artifact delete returns bounded receipt', false, safeError(deleteArtifact.error)));
      throw new Error('redacted-artifact-delete-failed');
    }

    checks.push(
      result('redacted-artifact-delete-receipt', 'Redacted proof artifact delete returns bounded receipt', true, 'Deleted artifact and received an app-level bounded deletion receipt.', {
        receiptId: artifactReceipt.receipt_id,
        artifactId: artifactReceipt.artifact_id,
        deletionStatus: artifactReceipt.deletion_status,
        receiptHashPrefix: String(artifactReceipt.receipt_hash).slice(0, 16),
      })
    );
    artifactId = null;

    const artifactReadback = await supabase
      .from('resume_proof_report_artifacts')
      .select('id')
      .eq('id', artifactReceipt.artifact_id)
      .maybeSingle();
    const artifactDeleted = !artifactReadback.data && !artifactReadback.error;
    checks.push(
      result(
        'redacted-artifact-delete-readback',
        'Deleted redacted proof artifact is no longer readable by owner',
        artifactDeleted,
        artifactDeleted ? 'Artifact row is absent after delete receipt.' : safeError(artifactReadback.error) || 'Artifact row remained readable.',
        { artifactId: artifactReceipt.artifact_id }
      )
    );

    const deleteAnalysis = await supabase.rpc('delete_resume_analysis_with_receipt', {
      p_analysis_id: analysisId,
    });
    const analysisReceipt = Array.isArray(deleteAnalysis.data) ? deleteAnalysis.data[0] : null;
    if (deleteAnalysis.error || !analysisReceipt?.receipt_hash) {
      checks.push(result('resume-analysis-delete-receipt', 'Saved resume analysis delete returns bounded receipt', false, safeError(deleteAnalysis.error)));
      throw new Error('resume-analysis-delete-failed');
    }

    checks.push(
      result('resume-analysis-delete-receipt', 'Saved resume analysis delete returns bounded receipt', true, 'Deleted synthetic saved analysis and received an app-level bounded deletion receipt.', {
        receiptId: analysisReceipt.receipt_id,
        analysisId: analysisReceipt.analysis_id,
        deletionStatus: analysisReceipt.deletion_status,
        receiptHashPrefix: String(analysisReceipt.receipt_hash).slice(0, 16),
      })
    );
    analysisId = null;

    const allPassed = checks.every((check) => check.passed);
    const artifact = {
      ...baseArtifact,
      status: allPassed ? 'passed' : 'failed',
      checks,
    };

    if (shouldWrite) await writeArtifact(artifact);
    if (!allPassed) process.exitCode = 1;
  } catch (error) {
    checks.push(result('auth-e2e-completion', 'Authenticated live e2e completes and cleans up', false, safeError(error)));
    const cleanup = [];
    if (artifactId) {
      cleanup.push(
        await requireCleanDelete('cleanup-redacted-artifact', () =>
          supabase.rpc('delete_resume_proof_report_artifact_with_receipt', { p_artifact_id: artifactId })
        )
      );
    }
    if (analysisId) {
      cleanup.push(
        await requireCleanDelete('cleanup-resume-analysis', () =>
          supabase.rpc('delete_resume_analysis_with_receipt', { p_analysis_id: analysisId })
        )
      );
    }

    const artifact = {
      ...baseArtifact,
      status: 'failed',
      checks: [...checks, ...cleanup],
    };
    if (shouldWrite) await writeArtifact(artifact);
    process.exitCode = 1;
  } finally {
    await supabase.auth.signOut().catch(() => undefined);
  }
}

await main();

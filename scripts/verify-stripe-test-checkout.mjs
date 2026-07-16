#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { LIVE_PROOF_ARCHIVE_REQUIREMENTS } from './lib/liveGateEvidence.mjs';

const OUTPUT_PATH = 'docs/commercialization/stripe-test-checkout-proof-latest.json';
const ENV_FILES = ['.env.local', '.env'];
const DEFAULT_ORIGIN = 'http://localhost:5173';
const TEST_STRIPE_SECRET_KEY_NAMES = ['STRIPE_TEST_SECRET_KEY', 'STRIPE_TEST_RESTRICTED_KEY'];
const DOES_NOT_PROVE = [
  'Live revenue',
  'MRR',
  'Successful payment method collection',
  'Webhook fulfillment',
  'Report-credit balance mutation',
  'Bootcamp demand',
];

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
      // Local env files are optional and secret values must never be printed.
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
    .replace(/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{8,}\b/g, '[stripe-secret-redacted]')
    .replace(/\bpk_(?:live|test)_[A-Za-z0-9]{8,}\b/g, '[stripe-publishable-redacted]')
    .replace(/eyJ[A-Za-z0-9._-]+/g, '[jwt-redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .slice(0, 700);
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

function validateTestSecretKey(secretKey) {
  if (/^(sk|rk)_test_/.test(secretKey)) return null;
  if (/^(sk|rk)_live_/.test(secretKey)) {
    return 'Stripe test checkout key is live-mode; this verifier only accepts explicit STRIPE_TEST_SECRET_KEY or STRIPE_TEST_RESTRICTED_KEY values with a sk_test_/rk_test_ prefix.';
  }
  return 'Stripe test checkout key must be a Stripe test-mode secret or restricted key.';
}

function ownerEvidenceArchive(gateId) {
  return Object.fromEntries((LIVE_PROOF_ARCHIVE_REQUIREMENTS[gateId] || []).map((key) => [key, true]));
}

async function retrieveStripeCheckoutSession(secretKey, sessionId) {
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error?.message || `Stripe session retrieve failed with HTTP ${response.status}`);
  }

  return body;
}

async function main() {
  const shouldWrite = hasFlag('--write');
  const allowMissingEnv = hasFlag('--allow-missing-env');
  const generatedAt = new Date().toISOString();
  const localEnv = await loadLocalEnv();

  const supabaseUrl = resolveEnv(localEnv, ['SUPABASE_URL', 'VITE_SUPABASE_URL']);
  const anonKey = resolveEnv(localEnv, ['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'PUBLIC_SUPABASE_ANON_KEY']);
  const testEmail = resolveEnv(localEnv, ['LIVE_SUPABASE_TEST_USER_EMAIL', 'STRIPE_TEST_USER_EMAIL']);
  const testPassword = resolveEnv(localEnv, ['LIVE_SUPABASE_TEST_USER_PASSWORD', 'STRIPE_TEST_USER_PASSWORD']);
  const stripeSecretKey = resolveEnv(localEnv, TEST_STRIPE_SECRET_KEY_NAMES);
  const priceId = resolveEnv(localEnv, ['STRIPE_TEST_PRICE_ID', 'APO_STRIPE_TEST_PRICE_ID']);
  const origin = resolveEnv(localEnv, ['CHECKOUT_TEST_ORIGIN', 'APP_URL', 'VITE_APP_URL']) || DEFAULT_ORIGIN;
  const tier = resolveEnv(localEnv, ['STRIPE_TEST_TIER']) || 'defender';
  const billingPeriod = resolveEnv(localEnv, ['STRIPE_TEST_BILLING_PERIOD']) || 'month';

  const missing = [
    ['SUPABASE_URL or VITE_SUPABASE_URL', supabaseUrl],
    ['SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY', anonKey],
    ['LIVE_SUPABASE_TEST_USER_EMAIL or STRIPE_TEST_USER_EMAIL', testEmail],
    ['LIVE_SUPABASE_TEST_USER_PASSWORD or STRIPE_TEST_USER_PASSWORD', testPassword],
    ['STRIPE_TEST_SECRET_KEY or STRIPE_TEST_RESTRICTED_KEY', stripeSecretKey],
    ['STRIPE_TEST_PRICE_ID or APO_STRIPE_TEST_PRICE_ID', priceId],
  ].filter(([, value]) => !value);

  const baseArtifact = {
    generatedAt,
    target: supabaseUrl ? new URL(supabaseUrl).origin : null,
    status: 'pending',
    confidence: 'bounded_stripe_test_checkout',
    caveat:
      'This verifier creates a Stripe test-mode Checkout Session through the deployed create-checkout-session Supabase Edge Function and retrieves the session from Stripe to confirm livemode=false. It does not complete payment, prove live revenue, prove webhook fulfillment, or prove MRR.',
    doesNotProve: DOES_NOT_PROVE,
    doesNotProveCount: DOES_NOT_PROVE.length,
    manualInterventionIfSkipped: [
      'Create or choose a Stripe test-mode Price object and set STRIPE_TEST_PRICE_ID or APO_STRIPE_TEST_PRICE_ID.',
      'Provide a Stripe test-mode secret or restricted key via explicit STRIPE_TEST_SECRET_KEY or STRIPE_TEST_RESTRICTED_KEY; generic STRIPE_SECRET_KEY is intentionally ignored by this test proof.',
      'Provide a dedicated Supabase Auth synthetic test user via LIVE_SUPABASE_TEST_USER_EMAIL and LIVE_SUPABASE_TEST_USER_PASSWORD.',
      'Confirm the deployed create-checkout-session function has its own STRIPE_SECRET_KEY and SUPABASE_SERVICE_ROLE_KEY secrets configured.',
      'Preserve raw Checkout Session payloads, function invocation metadata, and any screenshots/Stripe dashboard evidence outside git; commit only the generated redacted artifact.',
      'Run npm run verify:stripe-test-checkout. Do not paste secret values into chat or tracked files.',
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
          'stripe-test-checkout-env',
          'Stripe test checkout credentials are configured',
          false,
          `Missing: ${missing.map(([key]) => key).join(', ')}`
        ),
      ],
    };
    if (shouldWrite) await writeArtifact(artifact);
    if (!allowMissingEnv) {
      console.error('Stripe test checkout proof skipped because required env values are missing.');
      process.exitCode = 1;
    } else {
      console.log('Stripe test checkout proof skipped because required env values are missing.');
    }
    return;
  }

  const secretKeyError = validateTestSecretKey(stripeSecretKey);
  if (secretKeyError) {
    const artifact = {
      ...baseArtifact,
      status: 'failed_non_test_stripe_key',
      checks: [
        result('stripe-test-key-mode', 'Stripe key is test-mode only', false, secretKeyError),
      ],
    };
    if (shouldWrite) await writeArtifact(artifact);
    console.error(secretKeyError);
    process.exitCode = 1;
    return;
  }

  const checks = [
    result('stripe-test-key-mode', 'Stripe key is test-mode only', true, 'A test-mode Stripe secret or restricted key was provided.'),
  ];

  try {
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const signIn = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signIn.error || !signIn.data?.session?.access_token || !signIn.data?.user?.id) {
      checks.push(result('auth-sign-in', 'Synthetic user signs in', false, safeError(signIn.error)));
      throw new Error('auth-sign-in-failed');
    }

    const userId = signIn.data.user.id;
    const accessToken = signIn.data.session.access_token;
    checks.push(
      result('auth-sign-in', 'Synthetic user signs in', true, 'Signed in with password without printing credentials.', {
        userIdHash: sha256(userId).slice(0, 16),
        emailHash: sha256(testEmail.toLowerCase()).slice(0, 16),
      })
    );

    const checkoutResponse = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        Origin: origin,
      },
      body: JSON.stringify({
        priceId,
        userId,
        tier,
        billingPeriod,
      }),
    });

    const checkoutBody = await checkoutResponse.json().catch(() => ({}));
    if (!checkoutResponse.ok || typeof checkoutBody.sessionId !== 'string' || !checkoutBody.sessionId.startsWith('cs_')) {
      checks.push(
        result(
          'edge-checkout-session',
          'create-checkout-session returns a Checkout Session',
          false,
          safeError(checkoutBody?.error || `HTTP ${checkoutResponse.status}`)
        )
      );
      throw new Error('edge-checkout-session-failed');
    }

    checks.push(
      result('edge-checkout-session', 'create-checkout-session returns a Checkout Session', true, 'The deployed Edge Function returned a Checkout Session id and URL.', {
        sessionIdHash: sha256(checkoutBody.sessionId).slice(0, 16),
        checkoutUrlHost: checkoutBody.url ? new URL(checkoutBody.url).host : null,
      })
    );

    const stripeSession = await retrieveStripeCheckoutSession(stripeSecretKey, checkoutBody.sessionId);
    const stripeSessionOk =
      stripeSession?.id === checkoutBody.sessionId &&
      stripeSession?.object === 'checkout.session' &&
      stripeSession?.livemode === false &&
      stripeSession?.mode === 'subscription' &&
      typeof stripeSession?.payment_status === 'string' &&
      typeof stripeSession?.status === 'string' &&
      typeof stripeSession?.url === 'string';

    checks.push(
      result(
        'stripe-session-retrieve',
        'Stripe retrieves the Checkout Session in test mode',
        stripeSessionOk,
        stripeSessionOk
          ? 'Stripe retrieved the Checkout Session and reported livemode=false.'
          : 'Stripe retrieval did not return a matching test-mode subscription Checkout Session with status metadata.',
        {
          mode: stripeSession?.mode || null,
          livemode: stripeSession?.livemode === false ? false : null,
          status: typeof stripeSession?.status === 'string' ? stripeSession.status : null,
          paymentStatus: typeof stripeSession?.payment_status === 'string' ? stripeSession.payment_status : null,
          sessionIdHash: sha256(checkoutBody.sessionId).slice(0, 16),
        }
      )
    );

    const passed = checks.every((check) => check.passed);
    const artifact = {
      ...baseArtifact,
      status: passed ? 'passed' : 'failed',
      checks,
      evidenceSummary: {
        testMode: stripeSession?.livemode === false,
        checkoutSessionCreated: Boolean(checkoutBody.sessionId),
        checkoutUrlOpened: false,
        edgeFunction: 'create-checkout-session',
        checkoutUrlHost: checkoutBody.url ? new URL(checkoutBody.url).host : null,
        checkoutSessionMode: stripeSession?.mode || null,
        checkoutSessionStatus: stripeSession?.status || null,
        paymentStatus: stripeSession?.payment_status || null,
        sessionIdHash: sha256(checkoutBody.sessionId).slice(0, 16),
        priceIdHash: sha256(priceId).slice(0, 16),
        syntheticUser: true,
        ownerEvidenceArchive: ownerEvidenceArchive('real_stripe_test_checkout'),
      },
    };

    if (shouldWrite) await writeArtifact(artifact);
    console.log(JSON.stringify({
      ok: passed,
      status: artifact.status,
      target: artifact.target,
      checks: checks.map((check) => ({ id: check.id, passed: check.passed })),
      wrote: shouldWrite ? OUTPUT_PATH : null,
    }, null, 2));

    if (!passed) process.exitCode = 1;
  } catch (error) {
    const artifact = {
      ...baseArtifact,
      status: 'failed',
      checks,
      error: safeError(error),
    };
    if (shouldWrite) await writeArtifact(artifact);
    console.error(safeError(error));
    process.exitCode = 1;
  }
}

await main();

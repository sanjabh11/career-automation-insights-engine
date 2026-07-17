#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const TERMS_PATH = 'docs/legal/pilot-terms-v1.md';
const V3_PATH = 'supabase/migrations/20260717000000_report_credit_contract_v3.sql';
const V5_PATH = 'supabase/migrations/20260719000000_coach_pilot_contract_v5.sql';
const CHECKS = [
  ['v3-drops-return-type-conflict', V3_PATH, 'DROP FUNCTION IF EXISTS public.cleanup_expired_report_artifacts();'],
  ['v5-terms-hash-backfill', V5_PATH, 'content_hash ='],
  ['v5-payment-intent-unique', V5_PATH, 'report_credit_lots_payment_intent_uidx'],
  ['v5-server-package-map', V5_PATH, "IF p_package_id = 'starter' THEN"],
  ['v5-no-caller-credit-amount', V5_PATH, 'REVOKE EXECUTE ON FUNCTION public.add_report_credits_with_lot'],
  ['v5-atomic-reservation', V5_PATH, 'ON CONFLICT (user_id, idempotency_key) DO NOTHING'],
  ['v5-balance-mismatch-fail-closed', V5_PATH, "failure_code = 'balance_mismatch'"],
  ['v5-lot-linked-refund', V5_PATH, 'v_ledger.lot_id IS NULL'],
  ['v5-expired-reservation-release', V5_PATH, 'CREATE OR REPLACE FUNCTION public.release_expired_report_reservations'],
  ['v5-webhook-claim', V5_PATH, 'CREATE OR REPLACE FUNCTION public.claim_stripe_webhook_event'],
  ['v5-webhook-status-lease', V5_PATH, "status IN ('received', 'processing', 'processed', 'failed')"],
  ['v5-cleanup-queue', V5_PATH, 'CREATE TABLE IF NOT EXISTS public.report_cleanup_queue'],
  ['v5-queue-finalizer', V5_PATH, 'CREATE OR REPLACE FUNCTION public.finalize_report_cleanup_queue'],
  ['v5-cleanup-storage-confirmation', V5_PATH, 'Storage deletion not confirmed'],
  ['checkout-server-package', 'supabase/functions/create-checkout-session/index.ts', 'package_id'],
  ['checkout-price-env-required', 'supabase/functions/create-checkout-session/index.ts', 'STRIPE_STARTER_PRICE_ID is not configured'],
  ['checkout-rechecks-terms-hash', 'supabase/functions/create-checkout-session/index.ts', 'enrollment.terms_hash'],
  ['checkout-credit-profile-preflight', 'supabase/functions/create-checkout-session/index.ts', 'Report credit profile is not ready'],
  ['checkout-idempotency', 'supabase/functions/create-checkout-session/index.ts', 'idempotencyKey'],
  ['webhook-price-verification', 'supabase/functions/stripe-webhook/index.ts', 'listLineItems'],
  ['webhook-price-env-required', 'supabase/functions/stripe-webhook/index.ts', 'configuredStarterPriceId'],
  ['webhook-one-time-enum', 'supabase/functions/stripe-webhook/index.ts', "transaction_type: 'one_time'"],
  ['report-release-identifier', 'supabase/functions/generate-counselor-report/index.ts', 'ONET_RELEASE_VERSION'],
  ['report-rechecks-terms-hash', 'supabase/functions/generate-counselor-report/index.ts', 'Pilot terms must match the currently approved terms'],
  ['report-failure-metadata-cleanup', 'supabase/functions/generate-counselor-report/index.ts', 'Failed to clean report metadata after upload failure'],
  ['report-occupation-html-escaping', 'supabase/functions/generate-counselor-report/index.ts', 'safeOccupationTitle'],
  ['report-refund-result-check', 'supabase/functions/generate-counselor-report/index.ts', 'Credit refund could not be confirmed'],
  ['enrollment-terms-hash', 'supabase/functions/enroll-coach-pilot/index.ts', 'terms_hash'],
  ['draft-enrollment-closed', 'src/pages/ForCoachesPage.tsx', 'PILOT_ENROLLMENT_OPEN = false'],
  ['no-inline-report-fallback', 'src/components/CounselorReportGenerator.tsx', 'private report delivery link'],
  ['integration-gated-low-credit', 'supabase/functions/generate-counselor-report/test.ts', 'ignore: !LOW_CREDIT_TOKEN'],
  ['integration-gated-no-pilot', 'supabase/functions/generate-counselor-report/test.ts', 'ignore: !NO_PILOT_TOKEN'],
  ['integration-rate-limit-assertion', 'supabase/functions/generate-counselor-report/test.ts', 'Expected the in-memory per-user limiter to return 429'],
  ['cleanup-worker-service-role', 'supabase/functions/cleanup-report-artifacts/index.ts', 'Service-role authorization required'],
  ['cleanup-worker-queue-finalizer', 'supabase/functions/cleanup-report-artifacts/index.ts', 'finalize_report_cleanup_queue'],
];

async function read(relativePath) {
  return readFile(relativePath, 'utf8');
}

async function main() {
  const sources = new Map();
  for (const relativePath of new Set([TERMS_PATH, ...CHECKS.map(([, file]) => file)])) {
    sources.set(relativePath, await read(relativePath));
  }

  const failures = [];
  for (const [id, file, snippet] of CHECKS) {
    if (!sources.get(file).includes(snippet)) failures.push(`${id}: missing ${snippet}`);
  }

  const termsHash = createHash('sha256').update(sources.get(TERMS_PATH)).digest('hex');
  const v5 = sources.get(V5_PATH);
  if (!v5.includes(`content_hash = '${termsHash}'`)) {
    failures.push(`terms-hash-mismatch: v5 does not pin ${termsHash}`);
  }

  const v3Drop = sources.get(V3_PATH).indexOf('DROP FUNCTION IF EXISTS public.cleanup_expired_report_artifacts();');
  const v3Create = sources.get(V3_PATH).indexOf('CREATE OR REPLACE FUNCTION public.cleanup_expired_report_artifacts()');
  if (v3Drop < 0 || v3Create < 0 || v3Drop > v3Create) {
    failures.push('v3-return-type-order: cleanup drop must precede v3 create');
  }

  const result = {
    ok: failures.length === 0,
    status: failures.length === 0 ? 'passed' : 'failed',
    checkCount: CHECKS.length + 2,
    failures,
    termsHash,
    evidenceBoundary: 'Source-contract verification only. It does not prove that Supabase migrations were applied, Stripe credentials work, Storage cleanup ran, or hosted data is consistent.',
    doesNotProve: [
      'remote migration history or database execution',
      'live Stripe Checkout or webhook delivery',
      'Storage deletion success or pg_cron scheduling',
      'owner/legal approval, WCAG evidence, partner commitments, or customer outcomes',
    ],
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

await main();

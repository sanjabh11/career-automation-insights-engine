#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const OUTPUT_PATH = 'docs/commercialization/stripe-live-mrr-proof-latest.json';
const ENV_FILES = ['.env.local', '.env'];
const DEFAULT_MAX_PAGES = 10;
const STRIPE_API_BASE = 'https://api.stripe.com/v1';

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

function parsePositiveInteger(value, fallback, label) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return parsed;
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

function validateLiveSecretKey(secretKey) {
  if (/^(sk|rk)_live_/.test(secretKey)) return null;
  if (/^(sk|rk)_test_/.test(secretKey)) return 'Stripe key is test-mode; this verifier only accepts live-mode keys.';
  return 'Stripe key must be a live-mode Stripe secret or restricted key.';
}

async function stripeGet(secretKey, path, params = []) {
  const url = new URL(`${STRIPE_API_BASE}${path}`);
  for (const [key, value] of params) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, String(value));
    }
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error?.message || `Stripe API returned HTTP ${response.status} for ${path}`);
  }
  return body;
}

async function listActiveSubscriptions(secretKey, maxPages) {
  const subscriptions = [];
  let startingAfter = '';
  let hasMore = false;

  for (let page = 0; page < maxPages; page += 1) {
    const params = [
      ['status', 'active'],
      ['limit', 100],
      ['expand[]', 'data.items.data.price'],
    ];
    if (startingAfter) params.push(['starting_after', startingAfter]);

    const body = await stripeGet(secretKey, '/subscriptions', params);
    const rows = Array.isArray(body?.data) ? body.data : [];
    subscriptions.push(...rows);
    hasMore = body?.has_more === true;
    if (!hasMore || !rows.length) break;
    startingAfter = rows[rows.length - 1].id;
  }

  return {
    subscriptions,
    truncated: hasMore,
  };
}

async function findPaidInvoiceEvidence(secretKey, subscriptionId) {
  const body = await stripeGet(secretKey, '/invoices', [
    ['subscription', subscriptionId],
    ['status', 'paid'],
    ['limit', 3],
  ]);
  const invoices = Array.isArray(body?.data) ? body.data : [];
  const paidInvoices = invoices.filter((invoice) =>
    invoice?.livemode === true &&
    invoice?.status === 'paid' &&
    typeof invoice?.amount_paid === 'number' &&
    invoice.amount_paid > 0
  );

  return {
    paidInvoiceCount: paidInvoices.length,
    paidInvoiceHashes: paidInvoices.map((invoice) => sha256(invoice.id).slice(0, 16)),
  };
}

function monthlyAmountFromPrice(price, quantity) {
  if (!price || price.type !== 'recurring' || !price.recurring) return null;
  const interval = price.recurring.interval;
  const intervalCount = Number.isInteger(price.recurring.interval_count) && price.recurring.interval_count > 0
    ? price.recurring.interval_count
    : 1;
  const unitAmount = typeof price.unit_amount === 'number'
    ? price.unit_amount
    : Number.parseFloat(price.unit_amount_decimal || '');
  if (!Number.isFinite(unitAmount) || unitAmount <= 0) return null;

  const itemAmount = unitAmount * Math.max(1, quantity || 1);
  switch (interval) {
    case 'month':
      return itemAmount / intervalCount;
    case 'year':
      return itemAmount / (12 * intervalCount);
    case 'week':
      return (itemAmount * 52) / (12 * intervalCount);
    case 'day':
      return (itemAmount * 365) / (12 * intervalCount);
    default:
      return null;
  }
}

function summarizeMrr(subscriptions, currencyFilter) {
  const monthlyRecurringMinorByCurrency = {};
  let countedFixedRecurringItemCount = 0;
  let omittedItemCount = 0;
  const countedSubscriptionHashes = new Set();

  for (const subscription of subscriptions) {
    const items = Array.isArray(subscription?.items?.data) ? subscription.items.data : [];
    for (const item of items) {
      const price = item?.price;
      const currency = typeof price?.currency === 'string' ? price.currency.toLowerCase() : '';
      if (currencyFilter && currency !== currencyFilter) continue;

      const monthlyAmount = monthlyAmountFromPrice(price, item?.quantity);
      if (monthlyAmount === null) {
        omittedItemCount += 1;
        continue;
      }

      monthlyRecurringMinorByCurrency[currency] = (monthlyRecurringMinorByCurrency[currency] || 0) + monthlyAmount;
      countedFixedRecurringItemCount += 1;
      countedSubscriptionHashes.add(sha256(subscription.id).slice(0, 16));
    }
  }

  return {
    monthlyRecurringMinorByCurrency,
    countedFixedRecurringItemCount,
    omittedItemCount,
    countedSubscriptionCount: countedSubscriptionHashes.size,
    countedSubscriptionHashes: [...countedSubscriptionHashes].sort(),
  };
}

async function main() {
  const shouldWrite = hasFlag('--write');
  const allowMissingEnv = hasFlag('--allow-missing-env');
  const generatedAt = new Date().toISOString();
  const localEnv = await loadLocalEnv();

  const stripeSecretKey = resolveEnv(localEnv, ['STRIPE_LIVE_SECRET_KEY', 'STRIPE_LIVE_RESTRICTED_KEY', 'STRIPE_SECRET_KEY']);
  const maxPages = parsePositiveInteger(resolveEnv(localEnv, ['STRIPE_LIVE_MRR_MAX_PAGES']), DEFAULT_MAX_PAGES, 'STRIPE_LIVE_MRR_MAX_PAGES');
  const currencyFilter = resolveEnv(localEnv, ['STRIPE_LIVE_MRR_CURRENCY']).toLowerCase();

  const baseArtifact = {
    generatedAt,
    gateId: 'live_mrr_gt_zero',
    evidenceType: 'stripe_live_mrr_export',
    status: 'pending',
    confidence: 'bounded_stripe_live_mrr_readonly',
    caveat:
      'This verifier reads Stripe live-mode active subscriptions and paid invoices, then records redacted metadata showing whether fixed recurring subscription MRR is greater than zero. It does not create charges, refund charges, change subscriptions, store customer identities, or prove retention, product-market fit, future revenue, or accounting-recognized revenue.',
    docsAsOf: '2026-06-01',
    docsReferences: [
      'https://docs.stripe.com/api/subscriptions/list',
      'https://docs.stripe.com/api/invoices/list',
      'https://docs.stripe.com/test-mode',
    ],
    doesNotProve: [
      'Retention',
      'Product-market fit',
      'Future revenue',
      'Accounting-recognized revenue',
      'Webhook fulfillment',
      'Commercial outcomes',
    ],
    manualInterventionIfSkipped: [
      'Provide a live-mode Stripe restricted or secret key via STRIPE_LIVE_SECRET_KEY, STRIPE_LIVE_RESTRICTED_KEY, or STRIPE_SECRET_KEY; test-mode keys are rejected.',
      'Prefer a restricted read-only key with read access for subscriptions and invoices.',
      'Run npm run verify:stripe-live-mrr. Do not paste Stripe keys, customer emails, subscription IDs, invoice IDs, or raw Stripe payloads into chat or tracked files.',
      'Attach only redacted proof metadata through docs/commercialization/live-gate-evidence.local.json when owner-held proof is accepted.',
    ],
    request: {
      activeSubscriptionPagesLimit: maxPages,
      currency: currencyFilter || 'all',
    },
    checks: [],
  };

  if (!stripeSecretKey) {
    const artifact = {
      ...baseArtifact,
      status: 'skipped_missing_env',
      missingEnv: ['STRIPE_LIVE_SECRET_KEY or STRIPE_LIVE_RESTRICTED_KEY or STRIPE_SECRET_KEY'],
      checks: [
        result(
          'stripe-live-key-present',
          'Stripe live-mode key is configured',
          false,
          'Missing: STRIPE_LIVE_SECRET_KEY or STRIPE_LIVE_RESTRICTED_KEY or STRIPE_SECRET_KEY'
        ),
      ],
    };
    if (shouldWrite) await writeArtifact(artifact);
    if (!allowMissingEnv) {
      console.error('Stripe live MRR proof skipped because required env values are missing.');
      process.exitCode = 1;
    } else {
      console.log('Stripe live MRR proof skipped because required env values are missing.');
    }
    return;
  }

  const keyModeError = validateLiveSecretKey(stripeSecretKey);
  if (keyModeError) {
    const artifact = {
      ...baseArtifact,
      status: 'failed_non_live_stripe_key',
      checks: [
        result('stripe-live-key-mode', 'Stripe key is live-mode only', false, keyModeError),
      ],
    };
    if (shouldWrite) await writeArtifact(artifact);
    console.error(keyModeError);
    process.exitCode = 1;
    return;
  }

  const checks = [
    result('stripe-live-key-mode', 'Stripe key is live-mode only', true, 'A live-mode Stripe secret or restricted key was provided.'),
  ];

  try {
    const { subscriptions, truncated } = await listActiveSubscriptions(stripeSecretKey, maxPages);
    const liveSubscriptions = subscriptions.filter((subscription) => subscription?.livemode === true);
    checks.push(
      result(
        'stripe-active-subscriptions-read',
        'Stripe active subscriptions were read in live mode',
        liveSubscriptions.length > 0,
        liveSubscriptions.length > 0
          ? 'At least one live-mode active subscription was returned.'
          : 'No live-mode active subscriptions were returned.',
        {
          activeSubscriptionCount: liveSubscriptions.length,
          truncated,
        }
      )
    );

    const mrrSummary = summarizeMrr(liveSubscriptions, currencyFilter);
    const totalMrrGreaterThanZero = Object.values(mrrSummary.monthlyRecurringMinorByCurrency)
      .some((amount) => Number.isFinite(amount) && amount > 0);
    checks.push(
      result(
        'stripe-live-mrr-positive',
        'Fixed recurring live MRR is greater than zero',
        totalMrrGreaterThanZero,
        totalMrrGreaterThanZero
          ? 'At least one currency has positive fixed recurring monthly revenue from live active subscriptions.'
          : 'No positive fixed recurring monthly revenue was derived from live active subscriptions.',
        {
          positiveMrrCurrencyCount: Object.values(mrrSummary.monthlyRecurringMinorByCurrency).filter((amount) => amount > 0).length,
          countedFixedRecurringItemCount: mrrSummary.countedFixedRecurringItemCount,
          omittedItemCount: mrrSummary.omittedItemCount,
        }
      )
    );

    let paidInvoiceCount = 0;
    const paidInvoiceHashes = [];
    for (const subscription of liveSubscriptions) {
      const invoiceEvidence = await findPaidInvoiceEvidence(stripeSecretKey, subscription.id);
      paidInvoiceCount += invoiceEvidence.paidInvoiceCount;
      paidInvoiceHashes.push(...invoiceEvidence.paidInvoiceHashes);
    }
    checks.push(
      result(
        'stripe-paid-invoice-evidence',
        'Stripe live paid invoice evidence exists',
        paidInvoiceCount > 0,
        paidInvoiceCount > 0
          ? 'At least one live-mode paid invoice with amount_paid > 0 was found for an active subscription.'
          : 'No live-mode paid invoice with amount_paid > 0 was found for active subscriptions.',
        {
          paidInvoiceCount,
          paidInvoiceHashSample: paidInvoiceHashes.slice(0, 3),
        }
      )
    );

    const passed = checks.every((check) => check.passed);
    const artifact = {
      ...baseArtifact,
      status: passed ? 'passed' : 'failed',
      checks,
      evidenceSummary: {
        liveMode: true,
        totalMrrGreaterThanZero,
        activeSubscriptionCount: liveSubscriptions.length,
        paidInvoiceCount,
        currencyCount: Object.keys(mrrSummary.monthlyRecurringMinorByCurrency).length,
        mrrByCurrencyHash: sha256(JSON.stringify(Object.entries(mrrSummary.monthlyRecurringMinorByCurrency).sort())).slice(0, 16),
        countedFixedRecurringItemCount: mrrSummary.countedFixedRecurringItemCount,
        countedSubscriptionCount: mrrSummary.countedSubscriptionCount,
        countedSubscriptionHashSample: mrrSummary.countedSubscriptionHashes.slice(0, 3),
        omittedItemCount: mrrSummary.omittedItemCount,
        truncated,
      },
    };

    if (shouldWrite) await writeArtifact(artifact);
    console.log(JSON.stringify({
      ok: passed,
      status: artifact.status,
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

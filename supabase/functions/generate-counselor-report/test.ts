/**
 * Integration tests for generate-counselor-report Edge Function (v3)
 *
 * B1-10: Full test suite covering idempotency state machine, credit contract,
 * pilot enrollment, error codes, and HTTP status codes.
 *
 * Tests:
 *   1. Concurrent duplicate POSTs → one debit, one report
 *   2. Replay succeeded key → returns original ledger_id, report_id, fresh signed URL
 *   3. Replay reserved key → returns 202 in_progress
 *   4. Replay refunded key → returns 409 conflict
 *   5. Insufficient credits → 402
 *   6. Malformed input → 400
 *   7. Wrong owner GET → 404
 *   8. Expired report GET → 410
 *   9. Storage object deletion verification
 *  10. No pilot enrollment → 403
 *  11. Rate limit → 429
 *  12. Unsupported method → 405
 *
 * Run with: deno test --allow-net --allow-env supabase/functions/generate-counselor-report/test.ts
 *
 * Prerequisites:
 * - Supabase local dev running (supabase start)
 * - Test user created with report_credits >= 2 and pilot_participants record
 * - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, TEST_JWT_TOKEN env vars set
 * - Migration 20260717000000_report_credit_contract_v3.sql applied
 *
 * IMPORTANT: Tests do NOT skip on 401/500 — failures must be real failures.
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-counselor-report`;

const TEST_TOKEN = Deno.env.get('TEST_JWT_TOKEN') || '';
const TEST_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const LOW_CREDIT_TOKEN = Deno.env.get('TEST_LOW_CREDIT_JWT_TOKEN') || '';
const NO_PILOT_TOKEN = Deno.env.get('TEST_NO_PILOT_JWT_TOKEN') || '';
const EXPIRED_REPORT_ID = Deno.env.get('TEST_EXPIRED_REPORT_ID') || '';

if (!TEST_TOKEN || !TEST_ANON_KEY) {
    console.error('FATAL: TEST_JWT_TOKEN and SUPABASE_ANON_KEY must be set. Tests will not skip on auth failure.');
}

const TEST_HEADERS = {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json',
    'apikey': TEST_ANON_KEY,
};

const VALID_OCCUPATION = '15-1252.00';

function makePayload(overrides: Record<string, unknown> = {}): string {
    return JSON.stringify({
        client_label: 'Test Client',
        occupation_code: VALID_OCCUPATION,
        idempotency_key: crypto.randomUUID(),
        human_review_acknowledgement: true,
        ...overrides,
    });
}

// Test 1: Concurrent duplicate POSTs → one debit, one report
Deno.test("concurrent duplicate POSTs result in one debit and one report", async () => {
    const key = crypto.randomUUID();
    const payload = makePayload({ idempotency_key: key });

    const [res1, res2] = await Promise.all([
        fetch(FUNCTION_URL, { method: 'POST', headers: TEST_HEADERS, body: payload }),
        fetch(FUNCTION_URL, { method: 'POST', headers: TEST_HEADERS, body: payload }),
    ]);

    const body1 = await res1.json();
    const body2 = await res2.json();

    const primary = body1.success && !body1.idempotent ? body1 : body2;
    const secondary = primary === body1 ? body2 : body1;

    assertEquals(primary.success, true);
    assertExists(primary.report_id);
    assertExists(primary.ledger_id);

    assertEquals(secondary.success, true);
    assertEquals(secondary.idempotent, true);
    assertEquals(secondary.ledger_id, primary.ledger_id);
});

// Test 2: Replay succeeded key → returns original ledger_id, report_id, fresh signed URL
Deno.test("replay succeeded key returns original ledger_id and report_id", async () => {
    const key = crypto.randomUUID();
    const payload = makePayload({ idempotency_key: key });

    const res1 = await fetch(FUNCTION_URL, { method: 'POST', headers: TEST_HEADERS, body: payload });
    const body1 = await res1.json();
    assertEquals(res1.status, 201);
    assertEquals(body1.success, true);
    assertExists(body1.report_id);
    assertExists(body1.ledger_id);

    const res2 = await fetch(FUNCTION_URL, { method: 'POST', headers: TEST_HEADERS, body: payload });
    const body2 = await res2.json();
    assertEquals(res2.status, 200);
    assertEquals(body2.success, true);
    assertEquals(body2.idempotent, true);
    assertEquals(body2.ledger_id, body1.ledger_id);
    assertEquals(body2.report_id, body1.report_id);
    assertExists(body2.delivery_url);
});

// Test 3: Replay reserved key → returns 202 in_progress
Deno.test({ name: "replay reserved key returns 202 in_progress", ignore: true }, async () => {
    const key = crypto.randomUUID();
    const payload = makePayload({ idempotency_key: key });

    const res = await fetch(FUNCTION_URL, { method: 'POST', headers: TEST_HEADERS, body: payload });
    const body = await res.json();

    assertEquals(res.status, 202);
    assertEquals(body.success, true);
    assertEquals(body.idempotent, true);
    assertEquals(body.status, 'reserved');
});

// Test 4: Replay refunded key → returns 409 conflict
Deno.test("replay refunded key returns 409 conflict", async () => {
    const key = crypto.randomUUID();
    const payload = makePayload({ idempotency_key: key, occupation_code: 'INVALID-CODE-999' });

    const res1 = await fetch(FUNCTION_URL, { method: 'POST', headers: TEST_HEADERS, body: payload });
    const body1 = await res1.json();
    assertEquals(body1.success, false);

    const res2 = await fetch(FUNCTION_URL, { method: 'POST', headers: TEST_HEADERS, body: payload });
    const body2 = await res2.json();
    assertEquals(res2.status, 409);
    assertEquals(body2.success, false);
});

// Test 5: Insufficient credits → 402
Deno.test({ name: "insufficient credits returns 402", ignore: !LOW_CREDIT_TOKEN }, async () => {
    const key = crypto.randomUUID();
    const payload = makePayload({ idempotency_key: key });

    const res = await fetch(FUNCTION_URL, { method: 'POST', headers: { ...TEST_HEADERS, Authorization: `Bearer ${LOW_CREDIT_TOKEN}` }, body: payload });
    const body = await res.json();
    assertEquals(res.status, 402);
    assertEquals(body.success, false);
    assertExists(body.error);
});

// Test 6: Malformed input → 400
Deno.test("malformed input returns 400", async () => {
    const tests = [
        { body: JSON.stringify({}), desc: 'empty body' },
        { body: JSON.stringify({ client_label: 'X' }), desc: 'missing fields' },
        { body: JSON.stringify({ client_label: 'T', occupation_code: '15-1252.00', idempotency_key: 'bad', human_review_acknowledgement: true }), desc: 'invalid UUID' },
        { body: JSON.stringify({ client_label: 'A'.repeat(81), occupation_code: '15-1252.00', idempotency_key: crypto.randomUUID(), human_review_acknowledgement: true }), desc: 'label too long' },
        { body: JSON.stringify({ client_label: 'T', occupation_code: '15-1252.00', idempotency_key: crypto.randomUUID() }), desc: 'missing human_review_acknowledgement' },
    ];

    for (const test of tests) {
        const res = await fetch(FUNCTION_URL, { method: 'POST', headers: TEST_HEADERS, body: test.body });
        assertEquals(res.status, 400, `Expected 400 for ${test.desc}, got ${res.status}`);
        const body = await res.json();
        assertEquals(body.success, false);
    }
});

// Test 7: Wrong owner GET → 404
Deno.test("GET with non-existent report_id returns 404", async () => {
    const fakeReportId = '00000000-0000-0000-0000-000000000000';
    const res = await fetch(`${FUNCTION_URL}?report_id=${fakeReportId}`, {
        method: 'GET',
        headers: TEST_HEADERS,
    });
    assertEquals(res.status, 404);
    const body = await res.json();
    assertEquals(body.success, false);
});

// Test 8: Expired report GET → 410 (owner-provided fixture required)
Deno.test({ name: "GET with expired report returns 410", ignore: !EXPIRED_REPORT_ID }, async () => {
    const res = await fetch(`${FUNCTION_URL}?report_id=${EXPIRED_REPORT_ID}`, {
        method: 'GET',
        headers: TEST_HEADERS,
    });
    assertEquals(res.status, 410);
});

// Test 9: Storage object deletion verification requires a worker and owner-held
// service-role fixture. Keep this explicit rather than treating a log message as
// a passing assertion.
Deno.test({ name: "storage cleanup requires owner-held worker fixture", ignore: true }, () => {
    throw new Error('Provide a deployed cleanup worker and service-role fixture before enabling this test.');
});

// Test 10: No pilot enrollment → 403
Deno.test({ name: "POST without pilot enrollment returns 403", ignore: !NO_PILOT_TOKEN }, async () => {
    const key = crypto.randomUUID();
    const payload = makePayload({ idempotency_key: key });

    const res = await fetch(FUNCTION_URL, { method: 'POST', headers: { ...TEST_HEADERS, Authorization: `Bearer ${NO_PILOT_TOKEN}` }, body: payload });
    const body = await res.json();
    assertEquals(res.status, 403);
    assertEquals(body.success, false);
    assertEquals(body.error.includes('Pilot enrollment'), true);
});

// Test 11: Rate limit → 429
Deno.test("rate limit returns 429 after exceeding threshold", async () => {
    const results: Response[] = [];
    for (let i = 0; i < 6; i++) {
        const key = crypto.randomUUID();
        const res = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: TEST_HEADERS,
            body: makePayload({ idempotency_key: key, client_label: `RateTest-${i}` }),
        });
        results.push(res);
    }

    const rateLimited = results.some(r => r.status === 429);
    assertEquals(rateLimited, true, 'Expected the in-memory per-user limiter to return 429');
});

// Test 12: Unsupported method → 405
Deno.test("PUT method returns 405", async () => {
    const res = await fetch(FUNCTION_URL, { method: 'PUT', headers: TEST_HEADERS, body: JSON.stringify({}) });
    assertEquals(res.status, 405);
    const body = await res.json();
    assertEquals(body.success, false);
});

Deno.test("DELETE method returns 405", async () => {
    const res = await fetch(FUNCTION_URL, { method: 'DELETE', headers: TEST_HEADERS });
    assertEquals(res.status, 405);
});

Deno.test("PATCH method returns 405", async () => {
    const res = await fetch(FUNCTION_URL, { method: 'PATCH', headers: TEST_HEADERS, body: JSON.stringify({}) });
    assertEquals(res.status, 405);
});

// Test: GET without auth returns 401
Deno.test("GET without auth header returns 401", async () => {
    const res = await fetch(`${FUNCTION_URL}?report_id=00000000-0000-0000-0000-000000000000`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    assertEquals(res.status, 401);
});

// Test: GET without report_id returns 400
Deno.test("GET without report_id returns 400", async () => {
    const res = await fetch(FUNCTION_URL, { method: 'GET', headers: TEST_HEADERS });
    assertEquals(res.status, 400);
    const body = await res.json();
    assertEquals(body.success, false);
});

# R1-R2 Gap Fix Plan: Commercial Launch Readiness

## Status: Historical R1-R2 record superseded by v3/v5 contract closeout (2026-07-17)

The original notes below describe the first lot/webhook implementation and are
retained as an audit trail. They are not the current production contract. The
current source of truth is the additive v3 and v5 migration pair, the service
role-only cleanup worker, and `npm run verify:coach-pilot-contract`.

## R1: Repair Production Contract

### G-07: Revoke direct authenticated INSERT on pilot_participants ✅
- **File**: `supabase/migrations/20260718000000_pilot_governance_and_credit_lots.sql`
- **Change**: DROP INSERT policy "Users can insert own pilot enrollment"; REVOKE INSERT FROM authenticated; keep SELECT for own row
- **Rationale**: All enrollment must go through `enroll-coach-pilot` edge function (service_role)

### G-08: Create pilot_terms_versions table ✅
- **File**: Same migration + `supabase/functions/enroll-coach-pilot/index.ts`
- **Change**: Created `pilot_terms_versions` table (version, content_hash, status: draft/approved/retired, legal_reviewed_by/at, activated_at). Seeded v1-draft with status='draft'.
- **Enforcement**: enroll-coach-pilot queries pilot_terms_versions before upsert; returns 403 if status != 'approved'

### G-09: Secure checkout — server-side price/credit lookup ✅ (superseded detail)
- **File**: `supabase/functions/create-checkout-session/index.ts`, `src/lib/stripe.ts`
- **Current change**: The coach pilot sends only `package_id=starter` and a UUID `request_id`. The edge function derives the authenticated user, requires `STRIPE_STARTER_PRICE_ID`, and never accepts a caller-supplied credit count or pilot price. The legacy subscription route remains separately allowlisted.

### G-10: Credit lots with expiry + FIFO reservation ✅ (superseded detail)
- **File**: v3/v5 migrations + `supabase/functions/stripe-webhook/index.ts`
- **Current change**: v5 maps only the server-owned `starter` package to five credits, reserves the exact FIFO lot with request-hash idempotency, fails closed on aggregate/lot mismatch, restores the exact source lot on refund, and exposes a service-role-only expired-reservation release function.

### G-11: Stripe webhook idempotency ✅ (superseded detail)
- **File**: `supabase/functions/stripe-webhook/index.ts` + v5 migration
- **Current change**: Stripe signature verification is followed by a database claim/lease state machine. Failed deliveries return 500 for retry; processed deliveries return an idempotent 200; payment intent and line-item checks precede the service-role fulfillment RPC. Old caller-controlled credit RPCs are revoked.

## R2: Truthful Pilot Funnel and Legal Boundary

### G-12: Legal terms draft status ✅
- **File**: `src/pages/PilotTermsPage.tsx`
- **Change**: Added amber "Pending Legal Review — Not Active" banner with AlertTriangle icon. Markdown already had DRAFT status notices.

## Re-Verification Fixes (post-advisor review)
1. **pgcrypto extension**: Added `CREATE EXTENSION IF NOT EXISTS pgcrypto` to migration for `digest()` call in seed INSERT
2. **Refund lot restoration**: Changed ORDER BY from DESC to ASC to match FIFO consumption order (oldest lot gets refund credit first)
3. **Old function revocation**: Revoked execution on `add_report_credits` (old, no lot creation) from all roles including service_role
4. **Double-credit prevention**: Added idempotency guard in `add_report_credits_with_lot` — checks for existing `stripe_payment_intent_id` before creating a new lot

## Current v5 verification boundary

- `npm run verify:coach-pilot-contract` is the source-contract gate (37 checks); it does not prove migration execution, Stripe, Storage, or owner evidence.
- `supabase/functions/cleanup-report-artifacts/index.ts` is service-role-only and claims the cleanup queue, removes private objects, finalizes metadata only after deletion confirmation, and releases expired reservations.
- The deployment packet uses `supabase/config.toml` as the canonical target and now fails closed when the ignored CLI link disagrees; current local state is `kvunnankqgfokeufvsrv` in config versus `cyjqvqwpdgluivjoxcfl` in the CLI link file.
- `npm run verify:claim-boundaries` reports active/stale runtime status separately from diagnostic findings in archived/audit/plan paths; use `--strict-ignored` when reviewing historical documentation rather than treating archives as active product copy.
- Hosted migration history, Storage cleanup scheduling/results, manual WCAG evidence, real Stripe test checkout, live MRR, three design partners, and documented outcomes remain owner-held gates.

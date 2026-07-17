-- Pilot Governance, Credit Lots, and Webhook Idempotency
-- Addresses: G-07 (revoke direct INSERT), G-08 (pilot_terms_versions),
--            G-10 (credit lots with expiry + FIFO), G-11 (webhook idempotency)
--
-- Phase R1: Repair Production Contract

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- G-07: Revoke direct authenticated INSERT on pilot_participants
-- ============================================================================

-- Drop the INSERT policy that allowed users to self-enroll without edge function
DROP POLICY IF EXISTS "Users can insert own pilot enrollment" ON public.pilot_participants;

-- Revoke INSERT from authenticated — all enrollment must go through
-- enroll-coach-pilot edge function (which uses service_role)
REVOKE INSERT ON public.pilot_participants FROM authenticated;

-- Keep SELECT so users can check their own enrollment status
GRANT SELECT ON public.pilot_participants TO authenticated;

-- ============================================================================
-- G-08: Create pilot_terms_versions table for legal governance
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pilot_terms_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(50) NOT NULL UNIQUE,
    content_hash VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'approved', 'retired')),
    file_path TEXT NOT NULL DEFAULT 'docs/legal/pilot-terms-v1.md',
    legal_reviewed_by VARCHAR(255),
    legal_reviewed_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.pilot_terms_versions ENABLE ROW LEVEL SECURITY;

-- Anyone can read terms versions (they're public legal documents)
CREATE POLICY "Anyone can read pilot terms versions"
    ON public.pilot_terms_versions
    FOR SELECT
    USING (true);

-- Only service_role can modify
CREATE POLICY "Service role can manage pilot terms versions"
    ON public.pilot_terms_versions
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

GRANT SELECT ON public.pilot_terms_versions TO authenticated, anon;
GRANT ALL ON public.pilot_terms_versions TO service_role;

-- Seed the current draft terms
INSERT INTO public.pilot_terms_versions (version, content_hash, status, file_path)
VALUES (
    'v1-draft',
    encode(digest('pilot-terms-v1-draft-2026-07-17', 'sha256'), 'hex'),
    'draft',
    'docs/legal/pilot-terms-v1.md'
)
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- G-10: Credit lots with expiry and FIFO reservation semantics
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.report_credit_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255),
    credits_purchased INTEGER NOT NULL CHECK (credits_purchased > 0),
    credits_remaining INTEGER NOT NULL DEFAULT 0 CHECK (credits_remaining >= 0),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.report_credit_lots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit lots"
    ON public.report_credit_lots
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credit lots"
    ON public.report_credit_lots
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

GRANT SELECT ON public.report_credit_lots TO authenticated;
GRANT ALL ON public.report_credit_lots TO service_role;

-- Function to add credits with a new lot (called from stripe-webhook)
CREATE OR REPLACE FUNCTION public.add_report_credits_with_lot(
    p_user_id UUID,
    p_credits INTEGER,
    p_stripe_payment_intent_id VARCHAR,
    p_description VARCHAR DEFAULT NULL,
    p_expiry_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_lot_id UUID;
    v_balance_after INTEGER;
BEGIN
    IF p_credits <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Credits must be positive');
    END IF;

    -- Idempotency: if a lot with this payment_intent_id already exists, don't double-credit
    IF p_stripe_payment_intent_id IS NOT NULL THEN
        PERFORM 1 FROM public.report_credit_lots
        WHERE stripe_payment_intent_id = p_stripe_payment_intent_id
        LIMIT 1;
        IF FOUND THEN
            RETURN jsonb_build_object('success', true, 'idempotent', true, 'error', 'Lot already exists for this payment intent');
        END IF;
    END IF;

    -- Create a new credit lot with expiry
    INSERT INTO public.report_credit_lots (user_id, stripe_payment_intent_id, credits_purchased, credits_remaining, expires_at)
    VALUES (p_user_id, p_stripe_payment_intent_id, p_credits, p_credits, NOW() + (p_expiry_days || ' days')::INTERVAL)
    RETURNING id INTO v_lot_id;

    -- Update user_profiles balance
    UPDATE public.user_profiles
    SET report_credits = report_credits + p_credits
    WHERE id = p_user_id
    RETURNING report_credits INTO v_balance_after;

    -- Log transaction
    INSERT INTO public.credit_transactions (user_id, credits, transaction_type, description, balance_after)
    VALUES (p_user_id, p_credits, 'credit_purchase', COALESCE(p_description, 'Report credits purchased'), v_balance_after);

    RETURN jsonb_build_object(
        'success', true,
        'lot_id', v_lot_id,
        'credits_added', p_credits,
        'balance_after', v_balance_after
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.add_report_credits_with_lot(UUID, INTEGER, VARCHAR, VARCHAR, INTEGER) FROM authenticated, anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_report_credits_with_lot(UUID, INTEGER, VARCHAR, VARCHAR, INTEGER) TO service_role;

-- Recreate reserve_report_credit with FIFO lot consumption
CREATE OR REPLACE FUNCTION public.reserve_report_credit(
    p_user_id UUID,
    p_idempotency_key VARCHAR,
    p_occupation_code VARCHAR,
    p_client_label VARCHAR,
    p_human_review_acknowledgement BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_existing record;
    v_ledger_id UUID;
    v_balance_after INTEGER;
    v_lot record;
    v_consumed INTEGER := 0;
BEGIN
    -- Check for existing ledger entry (idempotency)
    SELECT id, status, report_id INTO v_existing
    FROM public.report_generation_ledger
    WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key
    LIMIT 1;

    IF FOUND THEN
        IF v_existing.status = 'succeeded' THEN
            RETURN jsonb_build_object(
                'success', true,
                'idempotent', true,
                'ledger_id', v_existing.id,
                'report_id', v_existing.report_id,
                'status', 'succeeded',
                'remaining_credits', (SELECT report_credits FROM public.user_profiles WHERE id = p_user_id)
            );
        ELSIF v_existing.status = 'reserved' THEN
            RETURN jsonb_build_object(
                'success', true,
                'idempotent', true,
                'ledger_id', v_existing.id,
                'status', 'reserved',
                'remaining_credits', (SELECT report_credits FROM public.user_profiles WHERE id = p_user_id)
            );
        ELSIF v_existing.status = 'refunded' OR v_existing.status = 'failed' THEN
            RETURN jsonb_build_object(
                'success', false,
                'idempotent', true,
                'status', 'conflict',
                'error', 'Previous attempt was refunded or failed. Use a new idempotency key.'
            );
        ELSE
            RETURN jsonb_build_object(
                'success', true,
                'idempotent', true,
                'ledger_id', v_existing.id,
                'status', v_existing.status,
                'remaining_credits', (SELECT report_credits FROM public.user_profiles WHERE id = p_user_id)
            );
        END IF;
    END IF;

    -- Check total balance
    SELECT report_credits INTO v_balance_after
    FROM public.user_profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_balance_after IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
    END IF;

    IF v_balance_after < 1 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
    END IF;

    -- FIFO: consume 1 credit from the oldest non-expired lot with remaining credits
    SELECT id INTO v_lot
    FROM public.report_credit_lots
    WHERE user_id = p_user_id
      AND credits_remaining > 0
      AND expires_at > NOW()
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        -- No valid lot found — check if there are expired lots (credits expired)
        SELECT count(*) INTO v_consumed
        FROM public.report_credit_lots
        WHERE user_id = p_user_id
          AND credits_remaining > 0
          AND expires_at <= NOW();

        IF v_consumed > 0 THEN
            -- Expire the credits in user_profiles to reflect reality
            UPDATE public.user_profiles
            SET report_credits = (
                SELECT COALESCE(SUM(credits_remaining), 0)
                FROM public.report_credit_lots
                WHERE user_id = p_user_id
                  AND expires_at > NOW()
            )
            WHERE id = p_user_id;

            RETURN jsonb_build_object('success', false, 'error', 'Credits have expired');
        END IF;

        RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
    END IF;

    -- Consume 1 credit from the oldest lot
    UPDATE public.report_credit_lots
    SET credits_remaining = credits_remaining - 1,
        updated_at = NOW()
    WHERE id = v_lot.id;

    -- Deduct from user_profiles
    v_balance_after := v_balance_after - 1;
    UPDATE public.user_profiles
    SET report_credits = v_balance_after
    WHERE id = p_user_id;

    -- Create ledger entry
    INSERT INTO public.report_generation_ledger (user_id, idempotency_key, status, occupation_code, client_label, human_review_acknowledgement)
    VALUES (p_user_id, p_idempotency_key, 'reserved', p_occupation_code, p_client_label, p_human_review_acknowledgement)
    RETURNING id INTO v_ledger_id;

    -- Log transaction
    INSERT INTO public.credit_transactions (user_id, credits, transaction_type, description, balance_after)
    VALUES (p_user_id, -1, 'report_reservation', 'Report credit reserved for ' || p_occupation_code, v_balance_after);

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'ledger_id', v_ledger_id,
        'status', 'reserved',
        'remaining_credits', v_balance_after
    );
END;
$$;

-- Re-grant (function signature unchanged from v3)
REVOKE EXECUTE ON FUNCTION public.reserve_report_credit(UUID, VARCHAR, VARCHAR, VARCHAR, BOOLEAN) FROM authenticated, anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_report_credit(UUID, VARCHAR, VARCHAR, VARCHAR, BOOLEAN) TO service_role;

-- Recreate refund_report_credit to restore to the original lot if possible
CREATE OR REPLACE FUNCTION public.refund_report_credit(
    p_ledger_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID;
    v_balance_after INTEGER;
    v_ledger record;
BEGIN
    SELECT * INTO v_ledger
    FROM public.report_generation_ledger
    WHERE id = p_ledger_id AND status = 'reserved'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    v_user_id := v_ledger.user_id;

    -- Mark as refunded
    UPDATE public.report_generation_ledger
    SET status = 'refunded', updated_at = NOW()
    WHERE id = p_ledger_id AND status = 'reserved';

    -- Try to restore credit to the oldest non-expired lot (matches FIFO consumption order)
    UPDATE public.report_credit_lots
    SET credits_remaining = credits_remaining + 1,
        updated_at = NOW()
    WHERE user_id = v_user_id
      AND expires_at > NOW()
      AND id = (
        SELECT id FROM public.report_credit_lots
        WHERE user_id = v_user_id AND expires_at > NOW()
        ORDER BY created_at ASC LIMIT 1
    );

    -- Update user_profiles balance
    UPDATE public.user_profiles
    SET report_credits = report_credits + 1
    WHERE id = v_user_id
    RETURNING report_credits INTO v_balance_after;

    INSERT INTO public.credit_transactions (user_id, credits, transaction_type, description, balance_after)
    VALUES (v_user_id, 1, 'report_refund', 'Report credit refunded (generation failed)', v_balance_after);

    RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refund_report_credit(UUID) FROM authenticated, anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.refund_report_credit(UUID) TO service_role;

-- ============================================================================
-- G-11: Stripe webhook idempotency — track processed event IDs
-- ============================================================================

-- Revoke the old add_report_credits function (replaced by add_report_credits_with_lot)
-- Old function doesn't create credit lots, so it must not be callable
REVOKE EXECUTE ON FUNCTION public.add_report_credits(UUID, INTEGER, VARCHAR, TEXT) FROM authenticated, anon, PUBLIC, service_role;

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    payload_hash VARCHAR(64)
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage webhook events"
    ON public.stripe_webhook_events
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

GRANT ALL ON public.stripe_webhook_events TO service_role;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.pilot_terms_versions IS 'Governance table for pilot terms versions — enrollment blocked unless status=approved';
COMMENT ON TABLE public.report_credit_lots IS 'Credit lots with 30-day expiry, consumed FIFO by reserve_report_credit';
COMMENT ON TABLE public.stripe_webhook_events IS 'Idempotency tracking for Stripe webhook event processing';
COMMENT ON FUNCTION public.add_report_credits_with_lot IS 'Add report credits with a new lot and expiry — called from stripe-webhook';

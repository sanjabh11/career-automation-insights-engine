-- Report Generation Credit Ledger
-- Creates idempotent credit reservation/refund system for report generation
-- Replaces client-side credit deduction with server-authoritative flow

-- Create report generation ledger table
CREATE TABLE IF NOT EXISTS public.report_generation_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    idempotency_key VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'reserved' NOT NULL CHECK (status IN ('reserved', 'succeeded', 'failed', 'refunded')),
    occupation_code VARCHAR(20) NOT NULL,
    client_label VARCHAR(255) NOT NULL,
    report_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, idempotency_key)
);

-- Enable RLS
ALTER TABLE public.report_generation_ledger ENABLE ROW LEVEL SECURITY;

-- Users can only see their own ledger entries
CREATE POLICY "Users can view own ledger entries"
    ON public.report_generation_ledger
    FOR SELECT
    USING (auth.uid() = user_id);

-- No direct INSERT/UPDATE/DELETE via API — only via service role (edge functions)

-- Function: reserve_report_credit
-- Atomically checks credits, deducts 1, and creates ledger entry
-- Idempotent: if key exists, returns existing status
CREATE OR REPLACE FUNCTION public.reserve_report_credit(
    p_user_id UUID,
    p_idempotency_key VARCHAR,
    p_occupation_code VARCHAR,
    p_client_label VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing record;
    v_credits INTEGER;
    v_ledger_id UUID;
BEGIN
    -- Check for existing ledger entry (idempotency)
    SELECT id, status, report_id INTO v_existing
    FROM public.report_generation_ledger
    WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key
    LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'idempotent', true,
            'ledger_id', v_existing.id,
            'status', v_existing.status,
            'remaining_credits', (SELECT report_credits FROM public.user_profiles WHERE id = p_user_id)
        );
    END IF;

    -- Check and deduct credit atomically
    SELECT report_credits INTO v_credits
    FROM public.user_profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_credits IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
    END IF;

    IF v_credits < 1 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
    END IF;

    -- Deduct 1 credit
    UPDATE public.user_profiles
    SET report_credits = report_credits - 1
    WHERE id = p_user_id;

    -- Create ledger entry
    INSERT INTO public.report_generation_ledger (user_id, idempotency_key, status, occupation_code, client_label)
    VALUES (p_user_id, p_idempotency_key, 'reserved', p_occupation_code, p_client_label)
    RETURNING id INTO v_ledger_id;

    -- Log transaction
    INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
    VALUES (p_user_id, -1, 'report_reservation', 'Report credit reserved for ' || p_occupation_code);

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'ledger_id', v_ledger_id,
        'status', 'reserved',
        'remaining_credits', v_credits - 1
    );
END;
$$;

-- Function: complete_report_generation
-- Marks a ledger entry as succeeded and links the report
CREATE OR REPLACE FUNCTION public.complete_report_generation(
    p_ledger_id UUID,
    p_report_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.report_generation_ledger
    SET status = 'succeeded', report_id = p_report_id, updated_at = NOW()
    WHERE id = p_ledger_id AND status = 'reserved';
    RETURN FOUND;
END;
$$;

-- Function: refund_report_credit
-- Marks a ledger entry as refunded and restores 1 credit
CREATE OR REPLACE FUNCTION public.refund_report_credit(
    p_ledger_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the user_id from the ledger entry
    SELECT user_id INTO v_user_id
    FROM public.report_generation_ledger
    WHERE id = p_ledger_id AND status = 'reserved'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Update ledger status
    UPDATE public.report_generation_ledger
    SET status = 'refunded', updated_at = NOW()
    WHERE id = p_ledger_id AND status = 'reserved';

    -- Restore 1 credit
    UPDATE public.user_profiles
    SET report_credits = report_credits + 1
    WHERE id = v_user_id;

    -- Log refund transaction
    INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
    VALUES (v_user_id, 1, 'report_refund', 'Report credit refunded (generation failed)');

    RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.reserve_report_credit(UUID, VARCHAR, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_report_generation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_report_credit(UUID) TO authenticated;

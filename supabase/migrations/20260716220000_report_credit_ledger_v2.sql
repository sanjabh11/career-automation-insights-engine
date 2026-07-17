-- Report Generation Credit Ledger v2
-- Fixes: column mismatch (amount→credits), adds balance_after, restricts grants to service_role,
-- drops report_url NOT NULL for private storage flow, adds storage bucket and purge function

-- 1. Recreate functions with correct column names and search_path

CREATE OR REPLACE FUNCTION public.reserve_report_credit(
    p_user_id UUID,
    p_idempotency_key VARCHAR,
    p_occupation_code VARCHAR,
    p_client_label VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing record;
    v_credits INTEGER;
    v_ledger_id UUID;
    v_balance_after INTEGER;
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

    v_balance_after := v_credits - 1;

    -- Deduct 1 credit
    UPDATE public.user_profiles
    SET report_credits = v_balance_after
    WHERE id = p_user_id;

    -- Create ledger entry
    INSERT INTO public.report_generation_ledger (user_id, idempotency_key, status, occupation_code, client_label)
    VALUES (p_user_id, p_idempotency_key, 'reserved', p_occupation_code, p_client_label)
    RETURNING id INTO v_ledger_id;

    -- Log transaction with correct column names
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

-- 2. complete_report_generation (unchanged logic, add search_path)
CREATE OR REPLACE FUNCTION public.complete_report_generation(
    p_ledger_id UUID,
    p_report_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.report_generation_ledger
    SET status = 'succeeded', report_id = p_report_id, updated_at = NOW()
    WHERE id = p_ledger_id AND status = 'reserved';
    RETURN FOUND;
END;
$$;

-- 3. refund_report_credit (fix column names, add search_path)
CREATE OR REPLACE FUNCTION public.refund_report_credit(
    p_ledger_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_balance_after INTEGER;
BEGIN
    SELECT user_id INTO v_user_id
    FROM public.report_generation_ledger
    WHERE id = p_ledger_id AND status = 'reserved'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    UPDATE public.report_generation_ledger
    SET status = 'refunded', updated_at = NOW()
    WHERE id = p_ledger_id AND status = 'reserved';

    -- Restore 1 credit and compute new balance
    UPDATE public.user_profiles
    SET report_credits = report_credits + 1
    WHERE id = v_user_id
    RETURNING report_credits INTO v_balance_after;

    -- Log refund with correct column names
    INSERT INTO public.credit_transactions (user_id, credits, transaction_type, description, balance_after)
    VALUES (v_user_id, 1, 'report_refund', 'Report credit refunded (generation failed)', v_balance_after);

    RETURN true;
END;
$$;

-- 4. Revoke PUBLIC/anon/authenticated grants, grant service_role only
REVOKE EXECUTE ON FUNCTION public.reserve_report_credit(UUID, VARCHAR, VARCHAR, VARCHAR) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.complete_report_generation(UUID, UUID) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refund_report_credit(UUID) FROM authenticated, anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.reserve_report_credit(UUID, VARCHAR, VARCHAR, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_report_generation(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_report_credit(UUID) TO service_role;

-- 5. Drop NOT NULL constraint on report_url for private storage flow
ALTER TABLE public.generated_counselor_reports ALTER COLUMN report_url DROP NOT NULL;

-- 6. Create private storage bucket for report artifacts
INSERT INTO storage.buckets (id, name, public)
VALUES ('coach-report-artifacts', 'coach-report-artifacts', false)
ON CONFLICT (id) DO NOTHING;

-- 7. Daily purge function for expired artifacts
CREATE OR REPLACE FUNCTION public.cleanup_expired_report_artifacts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete expired report records (older than 30 days)
    DELETE FROM public.generated_counselor_reports
    WHERE created_at < NOW() - INTERVAL '30 days'
    RETURNING 1 INTO v_deleted_count;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN v_deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_report_artifacts() TO service_role;

-- 8. Schedule daily purge via pg_cron (if extension available)
DO $cron_schedule$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'cleanup-expired-reports',
            '0 3 * * *',
            $job$SELECT public.cleanup_expired_report_artifacts();$job$
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- pg_cron not available — function can be called manually or via external scheduler
    NULL;
END;
$cron_schedule$;

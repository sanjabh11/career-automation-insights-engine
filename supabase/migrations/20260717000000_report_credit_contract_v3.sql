-- Report Credit Contract v3 — Transaction-Safe Pilot Infrastructure
-- Addresses: B1-1 through B1-3, B1-5, B1-9
--
-- Fixes:
--   1. SECURITY DEFINER SET search_path = '' on all functions (fully qualified table names)
--   2. Idempotency state machine: succeeded → return full ledger; reserved → 202; refunded → 409 conflict
--   3. Cleanup function: use generated_at (not created_at), add report_cleanup_log, two-step delete
--   4. pilot_participants table for server-owned eligibility (not user_metadata)
--   5. human_review_acknowledgement column on ledger
--   6. artifact_path column on generated_counselor_reports
--   7. expires_at default 30 days

-- ============================================================================
-- 1. Add columns to generated_counselor_reports
-- ============================================================================

ALTER TABLE public.generated_counselor_reports
    ADD COLUMN IF NOT EXISTS artifact_path TEXT;

ALTER TABLE public.generated_counselor_reports
    ADD COLUMN IF NOT EXISTS human_review_acknowledgement BOOLEAN DEFAULT false;

-- Set default expiry to 30 days from generation if not already set
ALTER TABLE public.generated_counselor_reports
    ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '30 days');

-- ============================================================================
-- 2. Add human_review_acknowledgement to report_generation_ledger
-- ============================================================================

ALTER TABLE public.report_generation_ledger
    ADD COLUMN IF NOT EXISTS human_review_acknowledgement BOOLEAN DEFAULT false;

-- ============================================================================
-- 3. Recreate reserve_report_credit with full idempotency state machine
-- ============================================================================

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
        -- Idempotency state machine: return appropriate response per status
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
            -- Terminal state — new key required
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

    -- Create ledger entry with human_review_acknowledgement
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

-- ============================================================================
-- 4. Recreate complete_report_generation with search_path = ''
-- ============================================================================

CREATE OR REPLACE FUNCTION public.complete_report_generation(
    p_ledger_id UUID,
    p_report_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.report_generation_ledger
    SET status = 'succeeded', report_id = p_report_id, updated_at = NOW()
    WHERE id = p_ledger_id AND status = 'reserved';
    RETURN FOUND;
END;
$$;

-- ============================================================================
-- 5. Recreate refund_report_credit with search_path = ''
-- ============================================================================

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

    UPDATE public.user_profiles
    SET report_credits = report_credits + 1
    WHERE id = v_user_id
    RETURNING report_credits INTO v_balance_after;

    INSERT INTO public.credit_transactions (user_id, credits, transaction_type, description, balance_after)
    VALUES (v_user_id, 1, 'report_refund', 'Report credit refunded (generation failed)', v_balance_after);

    RETURN true;
END;
$$;

-- ============================================================================
-- 6. Revoke all grants, re-grant to service_role only
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.reserve_report_credit(UUID, VARCHAR, VARCHAR, VARCHAR, BOOLEAN) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.complete_report_generation(UUID, UUID) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refund_report_credit(UUID) FROM authenticated, anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.reserve_report_credit(UUID, VARCHAR, VARCHAR, VARCHAR, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_report_generation(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_report_credit(UUID) TO service_role;

-- Also revoke old signature (in case it still exists from v1)
REVOKE EXECUTE ON FUNCTION public.reserve_report_credit(UUID, VARCHAR, VARCHAR, VARCHAR) FROM authenticated, anon, PUBLIC;

-- ============================================================================
-- 7. Create report_cleanup_log table for tracking storage deletion failures
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.report_cleanup_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.generated_counselor_reports(id) ON DELETE SET NULL,
    artifact_path TEXT,
    storage_deleted BOOLEAN DEFAULT false,
    metadata_deleted BOOLEAN DEFAULT false,
    error_message TEXT,
    cleaned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.report_cleanup_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage cleanup log"
    ON public.report_cleanup_log
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

GRANT ALL ON public.report_cleanup_log TO service_role;

-- ============================================================================
-- 8. Recreate cleanup function: use generated_at, two-step delete, log failures
-- ============================================================================

-- v2 declared this function with RETURNS INTEGER. PostgreSQL cannot replace a
-- function when only its return type changes, so remove the v2 signature before
-- installing the row-returning contract.
DROP FUNCTION IF EXISTS public.cleanup_expired_report_artifacts();

CREATE OR REPLACE FUNCTION public.cleanup_expired_report_artifacts()
RETURNS TABLE(report_id UUID, artifact_path TEXT, storage_deleted BOOLEAN, metadata_deleted BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_expired RECORD;
    v_storage_deleted BOOLEAN;
BEGIN
    FOR v_expired IN
        SELECT id, artifact_path, report_url
        FROM public.generated_counselor_reports
        WHERE expires_at IS NOT NULL
          AND expires_at < NOW()
    LOOP
        v_storage_deleted := false;

        -- Step 1: Attempt to delete Storage object (by artifact_path or report_url)
        -- Note: SQL functions cannot directly delete Supabase Storage objects.
        -- A companion edge function (cleanup-report-artifacts) must be called FIRST
        -- to delete the storage object, then this function cleans up the metadata row.
        -- We log storage_deleted=false to accurately reflect that the SQL function
        -- did not perform the storage deletion itself.
        IF v_expired.artifact_path IS NOT NULL OR v_expired.report_url IS NOT NULL THEN
            -- Record the artifact path for the cleanup log — external edge function
            -- should have already deleted the storage object.
            NULL; -- No storage deletion performed by this SQL function
        END IF;

        -- Step 2: Delete metadata row
        DELETE FROM public.generated_counselor_reports
        WHERE id = v_expired.id;

        -- Log the cleanup
        INSERT INTO public.report_cleanup_log (report_id, artifact_path, storage_deleted, metadata_deleted)
        VALUES (v_expired.id, COALESCE(v_expired.artifact_path, v_expired.report_url), v_storage_deleted, true);

        -- Yield result
        report_id := v_expired.id;
        artifact_path := COALESCE(v_expired.artifact_path, v_expired.report_url);
        storage_deleted := v_storage_deleted;
        metadata_deleted := true;
        RETURN NEXT;
    END LOOP;
END;
$$;

-- Revoke all grants on cleanup function, grant service_role only
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_report_artifacts() FROM authenticated, anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_report_artifacts() TO service_role;

-- ============================================================================
-- 9. Create pilot_participants table (B1-5)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pilot_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    country VARCHAR(2) NOT NULL CHECK (country IN ('US', 'CA')),
    terms_version VARCHAR(20) NOT NULL DEFAULT 'v1-draft',
    accepted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    consent_source VARCHAR(50) NOT NULL DEFAULT 'web_enrollment',
    active BOOLEAN DEFAULT true NOT NULL,
    interview_status VARCHAR(30) DEFAULT 'not_contacted',
    pilot_status VARCHAR(30) DEFAULT 'enrolled',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

ALTER TABLE public.pilot_participants ENABLE ROW LEVEL SECURITY;

-- Users can view their own enrollment
CREATE POLICY "Users can view own pilot enrollment"
    ON public.pilot_participants
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own enrollment (via edge function with service_role)
CREATE POLICY "Users can insert own pilot enrollment"
    ON public.pilot_participants
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Service role can manage all
CREATE POLICY "Service role can manage pilot participants"
    ON public.pilot_participants
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

GRANT SELECT, INSERT ON public.pilot_participants TO authenticated;
GRANT ALL ON public.pilot_participants TO service_role;

-- ============================================================================
-- 10. Update existing report records: set artifact_path from report_url if null
-- ============================================================================

UPDATE public.generated_counselor_reports
SET artifact_path = report_url
WHERE artifact_path IS NULL AND report_url IS NOT NULL;

-- ============================================================================
-- Migration Complete
-- ============================================================================

COMMENT ON TABLE public.pilot_participants IS 'Pilot enrollment records for coach pilot (US/CA only, terms-accepted)';
COMMENT ON TABLE public.report_cleanup_log IS 'Tracks storage + metadata cleanup for expired report artifacts';
COMMENT ON COLUMN public.generated_counselor_reports.artifact_path IS 'Path in coach-report-artifacts storage bucket';
COMMENT ON COLUMN public.generated_counselor_reports.human_review_acknowledgement IS 'User confirmed human review requirement';
COMMENT ON COLUMN public.report_generation_ledger.human_review_acknowledgement IS 'Persisted human review acknowledgement at reservation time';

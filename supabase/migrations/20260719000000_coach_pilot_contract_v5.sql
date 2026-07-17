-- Coach Pilot Contract v5 — fail-closed credit, terms, webhook, and cleanup boundaries
--
-- This is a forward-only corrective migration for the untracked pilot migrations.
-- It deliberately does not delete or deduplicate legacy rows. The partial unique
-- payment-intent index will fail loudly if legacy data contains a duplicate.
--
-- Preconditions: the earlier report-credit, pilot-governance, and credit-lot
-- migrations must have been applied in timestamp order. Apply only after a
-- target-database dry run and owner approval.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Expand schema for exact terms, lot-linked reservations, and safe retries
-- -----------------------------------------------------------------------------

ALTER TABLE public.pilot_participants
    ADD COLUMN IF NOT EXISTS terms_hash VARCHAR(64);

ALTER TABLE public.report_credit_lots
    ADD COLUMN IF NOT EXISTS package_id VARCHAR(50) NOT NULL DEFAULT 'legacy';

ALTER TABLE public.report_generation_ledger
    ADD COLUMN IF NOT EXISTS lot_id UUID REFERENCES public.report_credit_lots(id) ON DELETE SET NULL;

ALTER TABLE public.report_generation_ledger
    ADD COLUMN IF NOT EXISTS request_hash VARCHAR(64);

ALTER TABLE public.report_generation_ledger
    ADD COLUMN IF NOT EXISTS reservation_expires_at TIMESTAMPTZ;

ALTER TABLE public.report_generation_ledger
    ADD COLUMN IF NOT EXISTS failure_code VARCHAR(80);

DO $$
BEGIN
    ALTER TABLE public.pilot_participants
        ADD CONSTRAINT pilot_participants_terms_hash_format
        CHECK (terms_hash IS NULL OR terms_hash ~ '^[0-9a-fA-F]{64}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_report_credit_lots_fifo
    ON public.report_credit_lots (user_id, expires_at, created_at, id)
    WHERE credits_remaining > 0;

-- This is intentionally not a CONCURRENTLY index: Supabase migrations execute
-- transactionally. A duplicate payment intent must stop the migration rather
-- than silently creating a non-idempotent fulfillment path.
CREATE UNIQUE INDEX IF NOT EXISTS report_credit_lots_payment_intent_uidx
    ON public.report_credit_lots (stripe_payment_intent_id)
    WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_report_generation_ledger_lot
    ON public.report_generation_ledger (lot_id)
    WHERE lot_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS pilot_terms_versions_single_approved_uidx
    ON public.pilot_terms_versions (status)
    WHERE status = 'approved';

-- Keep the checked-in draft record aligned with the checked-in draft document.
-- It remains draft and therefore cannot authorize enrollment.
UPDATE public.pilot_terms_versions
SET content_hash = '002690e8743564bfe26fb38ca40d7b93cd27a752384cd8fa3c211760e1aa15ee'
WHERE version = 'v1-draft'
  AND status = 'draft';

-- -----------------------------------------------------------------------------
-- 2. Server-owned package fulfillment (starter is the only pilot package)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fulfill_report_credit_purchase(
    p_user_id UUID,
    p_package_id VARCHAR,
    p_stripe_payment_intent_id VARCHAR,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_credits INTEGER;
    v_expiry_days INTEGER;
    v_lot_id UUID;
    v_existing RECORD;
    v_balance_after INTEGER;
BEGIN
    IF p_user_id IS NULL OR p_package_id IS NULL OR p_stripe_payment_intent_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User, package, and payment intent are required');
    END IF;

    -- The coach pilot has one published package. Credit amounts and expiry are
    -- never accepted from the webhook payload.
    IF p_package_id = 'starter' THEN
        v_credits := 5;
        v_expiry_days := 30;
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Unsupported coach pilot package');
    END IF;

    SELECT COALESCE(report_credits, 0)
    INTO v_balance_after
    FROM public.user_profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
    END IF;

    INSERT INTO public.report_credit_lots (
        user_id,
        package_id,
        stripe_payment_intent_id,
        credits_purchased,
        credits_remaining,
        expires_at
    )
    VALUES (
        p_user_id,
        p_package_id,
        p_stripe_payment_intent_id,
        v_credits,
        v_credits,
        NOW() + make_interval(days => v_expiry_days)
    )
    ON CONFLICT (stripe_payment_intent_id) DO NOTHING
    RETURNING id INTO v_lot_id;

    IF v_lot_id IS NULL THEN
        SELECT id, user_id, package_id, credits_purchased, credits_remaining, expires_at
        INTO v_existing
        FROM public.report_credit_lots
        WHERE stripe_payment_intent_id = p_stripe_payment_intent_id
        FOR UPDATE;

        IF NOT FOUND OR v_existing.user_id <> p_user_id OR v_existing.package_id <> p_package_id THEN
            RETURN jsonb_build_object('success', false, 'error', 'Payment intent is already bound to another purchase');
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'idempotent', true,
            'lot_id', v_existing.id,
            'credits_added', 0,
            'remaining_credits', v_balance_after
        );
    END IF;

    v_balance_after := v_balance_after + v_credits;

    UPDATE public.user_profiles
    SET report_credits = v_balance_after
    WHERE id = p_user_id;

    INSERT INTO public.credit_transactions (
        user_id,
        credits,
        transaction_type,
        stripe_payment_id,
        description,
        balance_after
    )
    VALUES (
        p_user_id,
        v_credits,
        'credit_purchase',
        p_stripe_payment_intent_id,
        COALESCE(p_description, 'Coach pilot report credit purchase'),
        v_balance_after
    );

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'lot_id', v_lot_id,
        'credits_added', v_credits,
        'remaining_credits', v_balance_after,
        'expires_at', (SELECT expires_at FROM public.report_credit_lots WHERE id = v_lot_id)
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fulfill_report_credit_purchase(UUID, VARCHAR, VARCHAR, TEXT)
    FROM authenticated, anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.fulfill_report_credit_purchase(UUID, VARCHAR, VARCHAR, TEXT)
    TO service_role;

-- Old callers may still exist in an unapplied migration; they must not be
-- callable once v5 is applied because they accept caller-controlled credits.
REVOKE EXECUTE ON FUNCTION public.add_report_credits_with_lot(UUID, INTEGER, VARCHAR, VARCHAR, INTEGER)
    FROM authenticated, anon, PUBLIC, service_role;
REVOKE EXECUTE ON FUNCTION public.add_report_credits(UUID, INTEGER, VARCHAR, TEXT)
    FROM authenticated, anon, PUBLIC, service_role;

-- -----------------------------------------------------------------------------
-- 3. Atomic reservation, exact-lot refund, and idempotent completion
-- -----------------------------------------------------------------------------

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
    v_existing RECORD;
    v_ledger_id UUID;
    v_lot RECORD;
    v_balance_before INTEGER;
    v_balance_after INTEGER;
    v_request_hash VARCHAR(64);
    v_inserted BOOLEAN := false;
BEGIN
    IF p_user_id IS NULL OR p_idempotency_key IS NULL OR p_occupation_code IS NULL OR p_client_label IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Reservation fields are required');
    END IF;

    v_request_hash := encode(
        digest(
            concat_ws(chr(0), p_occupation_code, p_client_label, p_human_review_acknowledgement::TEXT),
            'sha256'
        ),
        'hex'
    );

    -- Insert the reservation marker before taking the profile/lot locks. The
    -- unique key serializes same-key retries without a read-before-insert race.
    INSERT INTO public.report_generation_ledger (
        user_id,
        idempotency_key,
        status,
        occupation_code,
        client_label,
        human_review_acknowledgement,
        request_hash,
        reservation_expires_at
    )
    VALUES (
        p_user_id,
        p_idempotency_key,
        'reserved',
        p_occupation_code,
        p_client_label,
        p_human_review_acknowledgement,
        v_request_hash,
        NOW() + INTERVAL '15 minutes'
    )
    ON CONFLICT (user_id, idempotency_key) DO NOTHING
    RETURNING id INTO v_ledger_id;

    v_inserted := v_ledger_id IS NOT NULL;

    IF NOT v_inserted THEN
        SELECT id, status, report_id, request_hash, occupation_code, client_label, lot_id
        INTO v_existing
        FROM public.report_generation_ledger
        WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key
        FOR UPDATE;

        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'Reservation retry could not be resolved');
        END IF;

        IF (v_existing.request_hash IS NOT NULL AND v_existing.request_hash <> v_request_hash)
           OR v_existing.occupation_code <> p_occupation_code
           OR v_existing.client_label <> p_client_label THEN
            RETURN jsonb_build_object(
                'success', false,
                'idempotent', true,
                'status', 'conflict',
                'error', 'Idempotency key was already used with different report inputs'
            );
        END IF;

        IF v_existing.status = 'succeeded' THEN
            RETURN jsonb_build_object(
                'success', true,
                'idempotent', true,
                'ledger_id', v_existing.id,
                'report_id', v_existing.report_id,
                'status', 'succeeded',
                'remaining_credits', (SELECT COALESCE(report_credits, 0) FROM public.user_profiles WHERE id = p_user_id)
            );
        ELSIF v_existing.status = 'reserved' THEN
            RETURN jsonb_build_object(
                'success', true,
                'idempotent', true,
                'ledger_id', v_existing.id,
                'status', 'reserved',
                'remaining_credits', (SELECT COALESCE(report_credits, 0) FROM public.user_profiles WHERE id = p_user_id)
            );
        ELSE
            RETURN jsonb_build_object(
                'success', false,
                'idempotent', true,
                'status', 'conflict',
                'error', 'Previous attempt is terminal. Use a new idempotency key.'
            );
        END IF;
    END IF;

    SELECT COALESCE(report_credits, 0)
    INTO v_balance_before
    FROM public.user_profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        UPDATE public.report_generation_ledger
        SET status = 'failed', failure_code = 'profile_not_found', updated_at = NOW()
        WHERE id = v_ledger_id;
        RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
    END IF;

    -- Keep the aggregate balance and lot balance fail-closed. A legacy or
    -- partially migrated account must never be allowed to drive the aggregate
    -- below zero while a lot reservation is being consumed.
    IF v_balance_before < 1 THEN
        UPDATE public.report_generation_ledger
        SET status = 'failed', failure_code = 'balance_mismatch', updated_at = NOW()
        WHERE id = v_ledger_id;
        RETURN jsonb_build_object('success', false, 'error', 'Credit balance is not available for reservation');
    END IF;

    SELECT id, credits_remaining, expires_at
    INTO v_lot
    FROM public.report_credit_lots
    WHERE user_id = p_user_id
      AND credits_remaining > 0
      AND expires_at > NOW()
    ORDER BY created_at ASC, id ASC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        UPDATE public.report_generation_ledger
        SET status = 'failed', failure_code = 'no_active_credit_lot', updated_at = NOW()
        WHERE id = v_ledger_id;
        RETURN jsonb_build_object('success', false, 'error', 'No active report credit lot');
    END IF;

    UPDATE public.report_credit_lots
    SET credits_remaining = credits_remaining - 1,
        updated_at = NOW()
    WHERE id = v_lot.id;

    v_balance_after := v_balance_before - 1;

    UPDATE public.user_profiles
    SET report_credits = v_balance_after
    WHERE id = p_user_id;

    UPDATE public.report_generation_ledger
    SET lot_id = v_lot.id,
        request_hash = v_request_hash,
        reservation_expires_at = NOW() + INTERVAL '15 minutes',
        updated_at = NOW()
    WHERE id = v_ledger_id;

    INSERT INTO public.credit_transactions (user_id, credits, transaction_type, description, balance_after)
    VALUES (p_user_id, -1, 'report_reservation', 'Report credit reserved for ' || p_occupation_code, v_balance_after);

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'ledger_id', v_ledger_id,
        'lot_id', v_lot.id,
        'status', 'reserved',
        'remaining_credits', v_balance_after
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_report_generation(
    p_ledger_id UUID,
    p_report_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_status VARCHAR;
    v_existing_report UUID;
BEGIN
    UPDATE public.report_generation_ledger
    SET status = 'succeeded', report_id = p_report_id, updated_at = NOW()
    WHERE id = p_ledger_id AND status = 'reserved'
    RETURNING status, report_id INTO v_status, v_existing_report;

    IF FOUND THEN
        RETURN true;
    END IF;

    SELECT status, report_id INTO v_status, v_existing_report
    FROM public.report_generation_ledger
    WHERE id = p_ledger_id;

    RETURN v_status = 'succeeded' AND v_existing_report = p_report_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_report_credit(
    p_ledger_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_ledger RECORD;
    v_balance_after INTEGER;
BEGIN
    SELECT id, user_id, lot_id, status
    INTO v_ledger
    FROM public.report_generation_ledger
    WHERE id = p_ledger_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    IF v_ledger.status = 'refunded' THEN
        RETURN true;
    END IF;

    IF v_ledger.status <> 'reserved' OR v_ledger.lot_id IS NULL THEN
        -- Do not silently restore a credit to an arbitrary lot or aggregate
        -- balance when the reservation's source lot is unknown.
        RETURN false;
    END IF;

    SELECT COALESCE(report_credits, 0)
    INTO v_balance_after
    FROM public.user_profiles
    WHERE id = v_ledger.user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    v_balance_after := v_balance_after + 1;

    -- Lock and validate the profile before changing the lot so a missing
    -- profile can never leave a refunded lot and aggregate balance divergent.
    PERFORM 1
    FROM public.report_credit_lots
    WHERE id = v_ledger.lot_id AND user_id = v_ledger.user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    UPDATE public.report_credit_lots
    SET credits_remaining = credits_remaining + 1,
        updated_at = NOW()
    WHERE id = v_ledger.lot_id;

    UPDATE public.user_profiles
    SET report_credits = v_balance_after
    WHERE id = v_ledger.user_id;

    UPDATE public.report_generation_ledger
    SET status = 'refunded', updated_at = NOW()
    WHERE id = p_ledger_id AND status = 'reserved';

    INSERT INTO public.credit_transactions (user_id, credits, transaction_type, description, balance_after)
    VALUES (v_ledger.user_id, 1, 'report_refund', 'Report credit refunded (generation failed)', v_balance_after);

    RETURN true;
END;
$$;

-- Release reservations abandoned by a crashed or disconnected report request.
-- The exact source lot is restored through refund_report_credit; no aggregate
-- or arbitrary-lot fallback is permitted.
CREATE OR REPLACE FUNCTION public.release_expired_report_reservations(
    p_limit INTEGER DEFAULT 100
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_released_count INTEGER := 0;
    v_ledger_id UUID;
BEGIN
    FOR v_ledger_id IN
        SELECT id
        FROM public.report_generation_ledger
        WHERE status = 'reserved'
          AND reservation_expires_at IS NOT NULL
          AND reservation_expires_at < NOW()
        ORDER BY reservation_expires_at ASC, id ASC
        LIMIT GREATEST(COALESCE(p_limit, 100), 1)
        FOR UPDATE SKIP LOCKED
    LOOP
        IF public.refund_report_credit(v_ledger_id) THEN
            v_released_count := v_released_count + 1;
        END IF;
    END LOOP;

    RETURN v_released_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reserve_report_credit(UUID, VARCHAR, VARCHAR, VARCHAR, BOOLEAN)
    FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.complete_report_generation(UUID, UUID)
    FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refund_report_credit(UUID)
    FROM authenticated, anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.reserve_report_credit(UUID, VARCHAR, VARCHAR, VARCHAR, BOOLEAN)
    TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_report_generation(UUID, UUID)
    TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_report_credit(UUID)
    TO service_role;
REVOKE EXECUTE ON FUNCTION public.release_expired_report_reservations(INTEGER)
    FROM authenticated, anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_expired_report_reservations(INTEGER)
    TO service_role;

-- -----------------------------------------------------------------------------
-- 4. Webhook claim/lease state machine
-- -----------------------------------------------------------------------------

ALTER TABLE public.stripe_webhook_events
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'received';
ALTER TABLE public.stripe_webhook_events
    ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.stripe_webhook_events
    ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;
ALTER TABLE public.stripe_webhook_events
    ADD COLUMN IF NOT EXISTS last_error TEXT;

-- v4 made processed_at NOT NULL. A claimed-but-not-yet-finished event needs a
-- null completion timestamp; the status column is now the authoritative state.
ALTER TABLE public.stripe_webhook_events
    ALTER COLUMN processed_at DROP NOT NULL;

DO $$
BEGIN
    ALTER TABLE public.stripe_webhook_events
        ADD CONSTRAINT stripe_webhook_events_status_check
        CHECK (status IN ('received', 'processing', 'processed', 'failed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_stripe_webhook_event(
    p_event_id VARCHAR,
    p_event_type VARCHAR,
    p_payload_hash VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_existing RECORD;
    v_inserted BOOLEAN := false;
BEGIN
    INSERT INTO public.stripe_webhook_events (
        event_id,
        event_type,
        payload_hash,
        status,
        attempts,
        processing_started_at,
        processed_at
    )
    VALUES (p_event_id, p_event_type, p_payload_hash, 'processing', 1, NOW(), NULL)
    ON CONFLICT (event_id) DO NOTHING
    RETURNING event_id INTO v_existing;

    IF v_existing.event_id IS NOT NULL THEN
        RETURN jsonb_build_object('claimed', true, 'status', 'processing', 'attempts', 1);
    END IF;

    SELECT event_id, event_type, payload_hash, status, attempts, processing_started_at
    INTO v_existing
    FROM public.stripe_webhook_events
    WHERE event_id = p_event_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('claimed', false, 'status', 'missing');
    END IF;

    IF v_existing.payload_hash IS NOT NULL
       AND p_payload_hash IS NOT NULL
       AND v_existing.payload_hash <> p_payload_hash THEN
        RETURN jsonb_build_object('claimed', false, 'status', 'payload_conflict');
    END IF;

    IF v_existing.status = 'processed' THEN
        RETURN jsonb_build_object('claimed', false, 'status', 'processed');
    END IF;

    IF v_existing.status = 'processing'
       AND v_existing.processing_started_at IS NOT NULL
       AND v_existing.processing_started_at > NOW() - INTERVAL '15 minutes' THEN
        RETURN jsonb_build_object('claimed', false, 'status', 'processing', 'attempts', v_existing.attempts);
    END IF;

    UPDATE public.stripe_webhook_events
    SET status = 'processing',
        attempts = COALESCE(v_existing.attempts, 0) + 1,
        processing_started_at = NOW(),
        last_error = NULL,
        payload_hash = COALESCE(payload_hash, p_payload_hash)
    WHERE event_id = p_event_id;

    RETURN jsonb_build_object(
        'claimed', true,
        'status', 'processing',
        'attempts', COALESCE(v_existing.attempts, 0) + 1
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_stripe_webhook_event(
    p_event_id VARCHAR,
    p_status VARCHAR,
    p_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF p_status NOT IN ('processed', 'failed') THEN
        RETURN false;
    END IF;

    UPDATE public.stripe_webhook_events
    SET status = p_status,
        processed_at = CASE WHEN p_status = 'processed' THEN NOW() ELSE processed_at END,
        last_error = p_error,
        processing_started_at = NULL
    WHERE event_id = p_event_id;

    RETURN FOUND;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_stripe_webhook_event(VARCHAR, VARCHAR, VARCHAR)
    FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_stripe_webhook_event(VARCHAR, VARCHAR, TEXT)
    FROM authenticated, anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_stripe_webhook_event(VARCHAR, VARCHAR, VARCHAR)
    TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_stripe_webhook_event(VARCHAR, VARCHAR, TEXT)
    TO service_role;

-- -----------------------------------------------------------------------------
-- 5. Queue storage cleanup; never delete metadata before storage confirmation
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.report_cleanup_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.generated_counselor_reports(id) ON DELETE SET NULL,
    artifact_path TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    last_error TEXT,
    queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processing_started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS report_cleanup_queue_report_uidx
    ON public.report_cleanup_queue (report_id)
    WHERE report_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_report_cleanup_queue_pending
    ON public.report_cleanup_queue (status, queued_at)
    WHERE status IN ('pending', 'failed');

ALTER TABLE public.report_cleanup_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role can manage cleanup queue" ON public.report_cleanup_queue;
CREATE POLICY "Service role can manage cleanup queue"
    ON public.report_cleanup_queue
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
GRANT ALL ON public.report_cleanup_queue TO service_role;

DROP FUNCTION IF EXISTS public.cleanup_expired_report_artifacts();

CREATE OR REPLACE FUNCTION public.cleanup_expired_report_artifacts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_queued_count INTEGER;
BEGIN
    WITH queued AS (
        INSERT INTO public.report_cleanup_queue (report_id, artifact_path, status, last_error)
        SELECT id, COALESCE(artifact_path, report_url), 'pending', NULL
        FROM public.generated_counselor_reports
        WHERE expires_at IS NOT NULL AND expires_at < NOW()
        ON CONFLICT (report_id) DO UPDATE
        SET artifact_path = EXCLUDED.artifact_path,
            status = CASE
                WHEN public.report_cleanup_queue.status = 'failed' THEN 'pending'
                ELSE public.report_cleanup_queue.status
            END,
            last_error = CASE
                WHEN public.report_cleanup_queue.status = 'failed' THEN NULL
                ELSE public.report_cleanup_queue.last_error
            END
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_queued_count FROM queued;

    RETURN v_queued_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_report_cleanup_batch(p_limit INTEGER DEFAULT 20)
RETURNS TABLE(id UUID, report_id UUID, artifact_path TEXT, attempts INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    UPDATE public.report_cleanup_queue AS queue
    SET status = 'processing',
        attempts = queue.attempts + 1,
        processing_started_at = NOW(),
        last_error = NULL
    WHERE queue.id IN (
        SELECT candidate.id
        FROM public.report_cleanup_queue AS candidate
        WHERE candidate.status IN ('pending', 'failed')
        ORDER BY candidate.queued_at ASC
        LIMIT GREATEST(COALESCE(p_limit, 20), 1)
        FOR UPDATE SKIP LOCKED
    )
    RETURNING queue.id, queue.report_id, queue.artifact_path, queue.attempts;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_report_artifact_cleanup(
    p_report_id UUID,
    p_storage_deleted BOOLEAN,
    p_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_queue_id UUID;
BEGIN
    SELECT id INTO v_queue_id
    FROM public.report_cleanup_queue
    WHERE report_id = p_report_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    IF p_storage_deleted THEN
        DELETE FROM public.generated_counselor_reports WHERE id = p_report_id;
        UPDATE public.report_cleanup_queue
        SET status = 'completed', completed_at = NOW(), processing_started_at = NULL, last_error = NULL
        WHERE id = v_queue_id;
    ELSE
        UPDATE public.report_cleanup_queue
        SET status = 'failed', processing_started_at = NULL, last_error = COALESCE(p_error, 'Storage deletion not confirmed')
        WHERE id = v_queue_id;
    END IF;

    RETURN true;
END;
$$;

-- Queue-id variant used by the service worker. It also handles a queue row
-- whose report metadata was removed concurrently, which keeps the queue from
-- being stranded in processing solely because its nullable report_id was
-- cleared by ON DELETE SET NULL.
CREATE OR REPLACE FUNCTION public.finalize_report_cleanup_queue(
    p_queue_id UUID,
    p_storage_deleted BOOLEAN,
    p_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_report_id UUID;
BEGIN
    SELECT report_id
    INTO v_report_id
    FROM public.report_cleanup_queue
    WHERE id = p_queue_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    IF p_storage_deleted THEN
        IF v_report_id IS NOT NULL THEN
            DELETE FROM public.generated_counselor_reports WHERE id = v_report_id;
        END IF;
        UPDATE public.report_cleanup_queue
        SET status = 'completed', completed_at = NOW(), processing_started_at = NULL, last_error = NULL
        WHERE id = p_queue_id;
    ELSE
        UPDATE public.report_cleanup_queue
        SET status = 'failed', processing_started_at = NULL,
            last_error = COALESCE(p_error, 'Storage deletion not confirmed')
        WHERE id = p_queue_id;
    END IF;

    RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_expired_report_artifacts() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_report_cleanup_batch(INTEGER) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.finalize_report_artifact_cleanup(UUID, BOOLEAN, TEXT) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.finalize_report_cleanup_queue(UUID, BOOLEAN, TEXT) FROM authenticated, anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_report_artifacts() TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_report_cleanup_batch(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_report_artifact_cleanup(UUID, BOOLEAN, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_report_cleanup_queue(UUID, BOOLEAN, TEXT) TO service_role;

COMMENT ON TABLE public.report_cleanup_queue IS 'Storage cleanup queue. Metadata is deleted only after the storage worker confirms deletion.';
COMMENT ON FUNCTION public.fulfill_report_credit_purchase IS 'Server-mapped coach pilot package fulfillment; idempotent on Stripe payment intent.';
COMMENT ON FUNCTION public.reserve_report_credit IS 'Atomic same-key reservation with FIFO lot consumption and request-hash conflict detection.';
COMMENT ON FUNCTION public.refund_report_credit IS 'Restores exactly the lot recorded on the reservation; fails closed when that lot is unavailable.';
COMMENT ON FUNCTION public.release_expired_report_reservations IS 'Releases abandoned reservations through exact-lot refunds; service-role cleanup only.';
COMMENT ON FUNCTION public.finalize_report_cleanup_queue IS 'Finalizes a storage cleanup queue row after the worker confirms deletion.';

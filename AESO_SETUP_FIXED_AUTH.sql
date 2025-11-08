-- ============================================================================
-- AESO INTEGRATION - FIXED AUTHENTICATION VERSION
-- ============================================================================
-- This script fixes the cron job authentication issue by using CRON_SECRET
-- instead of trying to access app.supabase_service_role_key
--
-- PREREQUISITES:
-- 1. Extensions pg_cron and http must already exist (DO NOT CREATE)
-- 2. Environment variable CRON_SECRET must be set in Supabase Edge Functions
-- 3. Edge Function stream-aeso-grid-data must be deployed
--
-- WHAT THIS SCRIPT DOES:
-- 1. Creates/updates grid_status table with AESO columns
-- 2. Creates/updates provincial_generation table with data_source tracking
-- 3. Creates alberta_grid_prices table
-- 4. Creates logging tables (edge_invocation_log, stream_health)
-- 5. Creates a SECURE cron job using a stored secret
-- ============================================================================

-- ============================================================================
-- SECTION 1: Create helper function to store the cron secret securely
-- ============================================================================

-- Create a table to store the cron secret (only accessible by postgres role)
CREATE TABLE IF NOT EXISTS private.cron_secrets (
    id SERIAL PRIMARY KEY,
    secret_name TEXT UNIQUE NOT NULL,
    secret_value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure the private schema exists
CREATE SCHEMA IF NOT EXISTS private;

-- Revoke all public access to this table
REVOKE ALL ON private.cron_secrets FROM PUBLIC;
REVOKE ALL ON private.cron_secrets FROM anon;
REVOKE ALL ON private.cron_secrets FROM authenticated;

-- Create a secure function to get the cron secret
CREATE OR REPLACE FUNCTION private.get_cron_secret()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    secret_val TEXT;
BEGIN
    SELECT secret_value INTO secret_val
    FROM private.cron_secrets
    WHERE secret_name = 'aeso_cron_secret'
    LIMIT 1;

    RETURN secret_val;
END;
$$;

-- ============================================================================
-- SECTION 2: Update grid_status table
-- ============================================================================

-- Add timestamp and data_source columns if they don't exist
DO $$
BEGIN
    -- Add timestamp column (stores the actual time from data source)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'grid_status'
        AND column_name = 'timestamp'
    ) THEN
        ALTER TABLE public.grid_status
        ADD COLUMN timestamp TIMESTAMPTZ;

        COMMENT ON COLUMN public.grid_status.timestamp IS
        'Actual timestamp from data source (e.g., AESO report time)';
    END IF;

    -- Add data_source column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'grid_status'
        AND column_name = 'data_source'
    ) THEN
        ALTER TABLE public.grid_status
        ADD COLUMN data_source TEXT DEFAULT 'Manual';

        COMMENT ON COLUMN public.grid_status.data_source IS
        'Source of the data (e.g., "AESO Real-Time", "Manual", "Estimated")';
    END IF;
END $$;

-- Create index for efficient AESO data queries
CREATE INDEX IF NOT EXISTS idx_grid_status_alberta_realtime
ON public.grid_status(region, data_source, timestamp DESC)
WHERE region = 'Alberta' AND data_source = 'AESO Real-Time';

-- ============================================================================
-- SECTION 3: Update provincial_generation table
-- ============================================================================

DO $$
BEGIN
    -- Add data_source column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'provincial_generation'
        AND column_name = 'data_source'
    ) THEN
        ALTER TABLE public.provincial_generation
        ADD COLUMN data_source TEXT DEFAULT 'Manual';
    END IF;

    -- Add version column for tracking data updates
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'provincial_generation'
        AND column_name = 'version'
    ) THEN
        ALTER TABLE public.provincial_generation
        ADD COLUMN version INTEGER DEFAULT 1;
    END IF;
END $$;

-- ============================================================================
-- SECTION 4: Create alberta_grid_prices table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.alberta_grid_prices (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    pool_price NUMERIC(10,2), -- $/MWh
    forecast_pool_price NUMERIC(10,2), -- $/MWh (30-day rolling forecast)
    ail_demand NUMERIC(10,2), -- Alberta Internal Load (MW)
    ail_capability NUMERIC(10,2), -- Total generation capability (MW)
    contingency_reserve NUMERIC(10,2), -- Required reserves (MW)
    data_source TEXT DEFAULT 'AESO Real-Time',
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(timestamp, data_source)
);

CREATE INDEX IF NOT EXISTS idx_alberta_prices_timestamp
ON public.alberta_grid_prices(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_alberta_prices_source
ON public.alberta_grid_prices(data_source, timestamp DESC);

COMMENT ON TABLE public.alberta_grid_prices IS
'Alberta Energy Pool Prices from AESO - updated every 5 minutes';

-- ============================================================================
-- SECTION 5: Create logging tables
-- ============================================================================

-- Edge function invocation logging
CREATE TABLE IF NOT EXISTS public.edge_invocation_log (
    id BIGSERIAL PRIMARY KEY,
    function_name TEXT NOT NULL,
    invocation_time TIMESTAMPTZ DEFAULT NOW(),
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_edge_log_function_time
ON public.edge_invocation_log(function_name, invocation_time DESC);

-- Stream health monitoring
CREATE TABLE IF NOT EXISTS public.stream_health (
    id BIGSERIAL PRIMARY KEY,
    stream_name TEXT NOT NULL,
    last_successful_run TIMESTAMPTZ,
    last_failed_run TIMESTAMPTZ,
    consecutive_failures INTEGER DEFAULT 0,
    total_runs INTEGER DEFAULT 0,
    total_successes INTEGER DEFAULT 0,
    total_failures INTEGER DEFAULT 0,
    metadata JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stream_name)
);

COMMENT ON TABLE public.stream_health IS
'Monitors health and reliability of data streaming services';

-- ============================================================================
-- SECTION 6: IMPORTANT - MANUAL STEP REQUIRED
-- ============================================================================

-- You MUST manually insert the CRON_SECRET into the private.cron_secrets table
-- Run this command separately after setting your CRON_SECRET:
--
-- INSERT INTO private.cron_secrets (secret_name, secret_value)
-- VALUES ('aeso_cron_secret', 'YOUR_ACTUAL_CRON_SECRET_HERE')
-- ON CONFLICT (secret_name) DO UPDATE SET
--     secret_value = EXCLUDED.secret_value,
--     updated_at = NOW();

-- ============================================================================
-- SECTION 7: Delete existing cron job if it exists
-- ============================================================================

-- Remove the broken cron job
DO $$
DECLARE
    job_id BIGINT;
BEGIN
    -- Find and delete the existing job
    SELECT jobid INTO job_id
    FROM cron.job
    WHERE jobname = 'aeso-stream-every-5-min';

    IF job_id IS NOT NULL THEN
        PERFORM cron.unschedule(job_id);
        RAISE NOTICE 'Deleted existing cron job with ID: %', job_id;
    END IF;
END $$;

-- ============================================================================
-- SECTION 8: Create NEW cron job with proper authentication
-- ============================================================================

-- Create the cron job using the stored secret
DO $$
DECLARE
    new_job_id BIGINT;
BEGIN
    SELECT cron.schedule(
        'aeso-stream-every-5-min',  -- job name
        '*/5 * * * *',                -- every 5 minutes
        $$
        SELECT net.http_post(
            url := 'https://qnymbecjgeaoxsfphrti.supabase.co/functions/v1/stream-aeso-grid-data',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || private.get_cron_secret()
            )
        );
        $$
    ) INTO new_job_id;

    RAISE NOTICE 'Created new cron job with ID: %', new_job_id;
END $$;

-- ============================================================================
-- SECTION 9: Verification queries
-- ============================================================================

-- Show the created cron job
SELECT
    jobid,
    jobname,
    schedule,
    active,
    database,
    username
FROM cron.job
WHERE jobname = 'aeso-stream-every-5-min';

-- Show table structures
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('grid_status', 'provincial_generation', 'alberta_grid_prices')
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
--
-- NEXT STEPS:
--
-- 1. Set CRON_SECRET in Supabase Edge Functions:
--    supabase secrets set CRON_SECRET=your-secret-here --project-ref qnymbecjgeaoxsfphrti
--
-- 2. Insert the same secret into the database:
--    INSERT INTO private.cron_secrets (secret_name, secret_value)
--    VALUES ('aeso_cron_secret', 'your-secret-here')
--    ON CONFLICT (secret_name) DO UPDATE SET
--        secret_value = EXCLUDED.secret_value,
--        updated_at = NOW();
--
-- 3. Verify the Edge Function accepts this authorization:
--    Update stream-aeso-grid-data to check for Bearer token matching CRON_SECRET
--
-- 4. Test the cron job manually:
--    SELECT cron.run_job('aeso-stream-every-5-min');
--
-- 5. Monitor for data:
--    SELECT * FROM public.grid_status
--    WHERE region = 'Alberta' AND data_source = 'AESO Real-Time'
--    ORDER BY captured_at DESC LIMIT 5;
--
-- ============================================================================

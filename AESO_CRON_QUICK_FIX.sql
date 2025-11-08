-- ============================================================================
-- AESO CRON JOB - QUICK FIX FOR AUTHENTICATION ERROR
-- ============================================================================
-- This script fixes the existing cron job (ID: 8) by replacing it with
-- a version that uses the CRON_SECRET environment variable properly.
--
-- ERROR BEING FIXED:
-- "unrecognized configuration parameter app.supabase_service_role_key"
--
-- PREREQUISITES:
-- 1. CRON_SECRET must be set in Supabase Edge Functions secrets
-- 2. Edge Function stream-aeso-grid-data must accept Bearer token auth
-- ============================================================================

-- ============================================================================
-- STEP 1: Delete the broken cron job
-- ============================================================================

SELECT cron.unschedule(8);

-- ============================================================================
-- STEP 2: Create wrapper function for the HTTP call
-- ============================================================================

-- Create a function that will make the HTTP call
-- The CRON_SECRET will be passed as a parameter when calling this function
CREATE OR REPLACE FUNCTION public.invoke_aeso_stream(cron_secret TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    response jsonb;
BEGIN
    -- Make the HTTP POST request to the Edge Function
    SELECT content::jsonb INTO response
    FROM http((
        'POST',
        'https://qnymbecjgeaoxsfphrti.supabase.co/functions/v1/stream-aeso-grid-data',
        ARRAY[
            http_header('Content-Type', 'application/json'),
            http_header('Authorization', 'Bearer ' || cron_secret)
        ],
        'application/json',
        '{}'::text
    )::http_request);

    -- Log the invocation
    INSERT INTO public.edge_invocation_log (
        function_name,
        invocation_time,
        status_code,
        metadata
    ) VALUES (
        'stream-aeso-grid-data',
        NOW(),
        200,
        jsonb_build_object('triggered_by', 'cron', 'response', response)
    );

    RETURN response;
EXCEPTION WHEN OTHERS THEN
    -- Log errors
    INSERT INTO public.edge_invocation_log (
        function_name,
        invocation_time,
        status_code,
        error_message
    ) VALUES (
        'stream-aeso-grid-data',
        NOW(),
        500,
        SQLERRM
    );

    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- ============================================================================
-- STEP 3: Store the CRON_SECRET in a secure table
-- ============================================================================

-- Create schema for private data if it doesn't exist
CREATE SCHEMA IF NOT EXISTS private;

-- Create table to store secrets
CREATE TABLE IF NOT EXISTS private.secrets (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Revoke all public access
REVOKE ALL ON private.secrets FROM PUBLIC, anon, authenticated;

-- Grant access only to postgres and service_role
GRANT SELECT ON private.secrets TO postgres;

-- Function to get secret value
CREATE OR REPLACE FUNCTION private.get_secret(secret_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    secret_value TEXT;
BEGIN
    SELECT value INTO secret_value
    FROM private.secrets
    WHERE key = secret_key;

    RETURN secret_value;
END;
$$;

-- ============================================================================
-- STEP 4: YOU MUST RUN THIS MANUALLY - Insert your CRON_SECRET
-- ============================================================================

-- ⚠️ IMPORTANT: Replace 'YOUR_CRON_SECRET_HERE' with your actual secret
-- Run this command in SQL Editor:
--
-- INSERT INTO private.secrets (key, value)
-- VALUES ('CRON_SECRET', 'YOUR_CRON_SECRET_HERE')
-- ON CONFLICT (key) DO UPDATE SET
--     value = EXCLUDED.value,
--     updated_at = NOW();

-- ============================================================================
-- STEP 5: Create NEW cron job with fixed authentication
-- ============================================================================

SELECT cron.schedule(
    'aeso-stream-every-5-min',  -- job name
    '*/5 * * * *',                -- schedule: every 5 minutes
    $$SELECT public.invoke_aeso_stream(private.get_secret('CRON_SECRET'))$$
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- View the new cron job
SELECT
    jobid,
    jobname,
    schedule,
    command,
    active
FROM cron.job
WHERE jobname = 'aeso-stream-every-5-min';

-- ============================================================================
-- TESTING
-- ============================================================================

-- To test the cron job manually, first insert your secret:
-- INSERT INTO private.secrets (key, value) VALUES ('CRON_SECRET', 'your-actual-secret');

-- Then test the function:
-- SELECT public.invoke_aeso_stream(private.get_secret('CRON_SECRET'));

-- Or test the cron job directly:
-- SELECT cron.run_job((SELECT jobid FROM cron.job WHERE jobname = 'aeso-stream-every-5-min'));

-- Check for new data:
-- SELECT * FROM public.grid_status WHERE region = 'Alberta' ORDER BY captured_at DESC LIMIT 5;

-- Check logs:
-- SELECT * FROM public.edge_invocation_log ORDER BY invocation_time DESC LIMIT 10;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

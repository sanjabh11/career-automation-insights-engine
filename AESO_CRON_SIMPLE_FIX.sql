-- ============================================================================
-- AESO CRON JOB - SIMPLEST FIX (Replace YOUR_CRON_SECRET_HERE)
-- ============================================================================
-- This is the SIMPLEST solution to fix the authentication error.
--
-- BEFORE RUNNING:
-- 1. Replace 'YOUR_CRON_SECRET_HERE' with your actual CRON_SECRET value
-- 2. Make sure CRON_SECRET is set in Supabase Edge Functions secrets
--
-- This script:
-- 1. Deletes the broken cron job (ID: 8)
-- 2. Creates a new one with the secret hardcoded
--
-- NOTE: The secret will be stored in the cron.job table (visible to admins)
-- For higher security, use AESO_CRON_QUICK_FIX.sql instead
-- ============================================================================

-- Delete the broken cron job
SELECT cron.unschedule(8);

-- Create new cron job with your actual CRON_SECRET
-- ⚠️ REPLACE 'YOUR_CRON_SECRET_HERE' WITH YOUR ACTUAL SECRET BEFORE RUNNING
SELECT cron.schedule(
    'aeso-stream-every-5-min',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://qnymbecjgeaoxsfphrti.supabase.co/functions/v1/stream-aeso-grid-data',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer YOUR_CRON_SECRET_HERE'
        ),
        body := '{}'::jsonb
    );
    $$
);

-- Verify the new cron job was created
SELECT
    jobid,
    jobname,
    schedule,
    active
FROM cron.job
WHERE jobname = 'aeso-stream-every-5-min';

-- ============================================================================
-- WHAT YOUR CRON_SECRET IS:
-- ============================================================================
-- Your CRON_SECRET was mentioned in the handoff document as already being set.
-- To find it:
-- 1. Go to Supabase Dashboard
-- 2. Settings → Edge Functions → Secrets
-- 3. Look for CRON_SECRET
--
-- If you don't see it, you need to generate one:
-- supabase secrets set CRON_SECRET=$(openssl rand -base64 32) --project-ref qnymbecjgeaoxsfphrti
--
-- Then copy that value and replace YOUR_CRON_SECRET_HERE above
-- ============================================================================

-- ============================================================================
-- TESTING AFTER SETUP:
-- ============================================================================

-- Test the cron job manually:
-- SELECT cron.run_job((SELECT jobid FROM cron.job WHERE jobname = 'aeso-stream-every-5-min'));

-- Check if data is flowing:
-- SELECT * FROM public.grid_status
-- WHERE region = 'Alberta' AND data_source = 'AESO Real-Time'
-- ORDER BY captured_at DESC LIMIT 5;

-- Monitor cron job runs:
-- SELECT * FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'aeso-stream-every-5-min')
-- ORDER BY start_time DESC LIMIT 10;

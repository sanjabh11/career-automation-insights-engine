# 🚀 AESO Integration - Deployment Fix Guide

## 🔴 Current Issue

**Error:** `unrecognized configuration parameter "app.supabase_service_role_key"`

**Cause:** The cron job (ID: 8) is trying to use a database configuration parameter that doesn't exist.

**Status:**
- ✅ Cron job created successfully
- ✅ Schedule is correct (every 5 minutes)
- ❌ Authentication is broken
- ❌ Edge Function cannot be invoked

---

## 🎯 Three Solution Options

### Option 1: SIMPLEST (Recommended for Quick Deployment) ⚡

**File:** `AESO_CRON_SIMPLE_FIX.sql`

**Pros:**
- Fastest to implement (< 2 minutes)
- No complex setup required
- Works immediately

**Cons:**
- CRON_SECRET is visible in `cron.job` table to database admins
- Less secure (but acceptable for internal systems)

**Steps:**
1. Get your CRON_SECRET from Supabase Dashboard → Edge Functions → Secrets
2. Open `AESO_CRON_SIMPLE_FIX.sql`
3. Replace `YOUR_CRON_SECRET_HERE` with your actual secret
4. Run the SQL in Supabase SQL Editor
5. Done! ✅

---

### Option 2: SECURE (Recommended for Production) 🔒

**File:** `AESO_CRON_QUICK_FIX.sql`

**Pros:**
- CRON_SECRET stored securely in `private.secrets` table
- Not visible in cron job definition
- Better security posture

**Cons:**
- Requires 2 steps (run SQL, then insert secret)
- Slightly more complex

**Steps:**
1. Run `AESO_CRON_QUICK_FIX.sql` in SQL Editor
2. Then run this separately (replace the secret):
   ```sql
   INSERT INTO private.secrets (key, value)
   VALUES ('CRON_SECRET', 'your-actual-cron-secret-here')
   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
   ```
3. Test: `SELECT cron.run_job((SELECT jobid FROM cron.job WHERE jobname = 'aeso-stream-every-5-min'));`
4. Done! ✅

---

### Option 3: COMPREHENSIVE (Enterprise Setup) 🏢

**File:** `AESO_SETUP_FIXED_AUTH.sql`

**Pros:**
- Creates all tables (grid_status, alberta_grid_prices, logging)
- Full monitoring setup
- Enterprise-grade security
- Complete documentation

**Cons:**
- Most complex (5-10 minutes setup)
- Requires multiple manual steps

**Steps:**
1. Run `AESO_SETUP_FIXED_AUTH.sql` in SQL Editor
2. Insert CRON_SECRET into `private.cron_secrets` table
3. Verify all tables created
4. Review logging setup
5. Done! ✅

---

## 🚀 Recommended: Use Option 1 for Immediate Deployment

Since you need to "fix errors so deployment can be done **immediately**", I recommend **Option 1**.

### Quick Deployment (5 Minutes)

#### Step 1: Get Your CRON_SECRET

**Option A - If CRON_SECRET already exists:**
```bash
# Via Supabase Dashboard:
# Go to: Project Settings → Edge Functions → Secrets
# Find: CRON_SECRET
# Copy the value
```

**Option B - If CRON_SECRET doesn't exist yet:**
```bash
# Generate a secure random secret
openssl rand -base64 32

# Set it in Supabase (replace <your-secret> and project ref)
supabase secrets set CRON_SECRET=<your-secret> --project-ref qnymbecjgeaoxsfphrti
```

#### Step 2: Update the SQL File

1. Open `AESO_CRON_SIMPLE_FIX.sql`
2. Find this line:
   ```sql
   'Authorization', 'Bearer YOUR_CRON_SECRET_HERE'
   ```
3. Replace `YOUR_CRON_SECRET_HERE` with your actual secret
4. Save the file

#### Step 3: Run the Fix

1. Go to Supabase Dashboard → SQL Editor
2. Copy the entire contents of `AESO_CRON_SIMPLE_FIX.sql`
3. Paste into SQL Editor
4. Click **Run**

**Expected Output:**
```
SELECT 1  -- From cron.unschedule
SELECT 9  -- New job ID (or similar number)
```

#### Step 4: Verify the Fix

Run this query:
```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'aeso-stream-every-5-min';
```

**Expected Result:**
| jobid | jobname                 | schedule    | active |
|-------|-------------------------|-------------|--------|
| 9     | aeso-stream-every-5-min | */5 * * * * | true   |

#### Step 5: Test Manually

```sql
-- Run the cron job immediately (don't wait 5 minutes)
SELECT cron.run_job(
    (SELECT jobid FROM cron.job WHERE jobname = 'aeso-stream-every-5-min')
);
```

**Expected:** Returns job run details with no errors

#### Step 6: Check for Data

Wait 30 seconds, then run:
```sql
SELECT
    region,
    demand_mw,
    supply_mw,
    data_source,
    COALESCE(timestamp, captured_at) AS data_time
FROM grid_status
WHERE region = 'Alberta'
    AND data_source = 'AESO Real-Time'
ORDER BY captured_at DESC
LIMIT 5;
```

**Expected:** At least 1 row with recent Alberta data

---

## 🔧 Troubleshooting

### Issue: "relation private.secrets does not exist"
**Solution:** You're using the SECURE option but haven't run the setup script yet. Either:
- Run `AESO_CRON_QUICK_FIX.sql` first, OR
- Switch to `AESO_CRON_SIMPLE_FIX.sql` (simpler)

### Issue: "function invoke_aeso_stream does not exist"
**Solution:** Same as above - run the setup script first

### Issue: Cron job runs but no data appears
**Possible Causes:**
1. Edge Function `stream-aeso-grid-data` not deployed
2. CRON_SECRET mismatch between database and Edge Function
3. AESO API is down or returning errors
4. Table structure doesn't match what Edge Function expects

**Debug Steps:**
```sql
-- Check recent cron job runs
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'aeso-stream-every-5-min')
ORDER BY start_time DESC LIMIT 5;

-- Check if edge_invocation_log table exists and has data
SELECT * FROM public.edge_invocation_log
ORDER BY invocation_time DESC LIMIT 5;
```

### Issue: "Failed to run sql query"
**Solution:** Check that:
1. You replaced `YOUR_CRON_SECRET_HERE` with actual value
2. The secret doesn't have special characters that need escaping
3. You're running the entire script, not just part of it

---

## 📊 Success Criteria

Your deployment is successful when:

- [ ] Cron job exists and is active
- [ ] No authentication errors in logs
- [ ] Manual test (`cron.run_job()`) succeeds
- [ ] Alberta data appears in `grid_status` table
- [ ] Data timestamp is recent (< 10 minutes old)
- [ ] Data source is `'AESO Real-Time'`

---

## 🎯 After Successful Deployment

### Monitor Cron Job Health

```sql
-- Check last 10 runs
SELECT
    start_time,
    end_time,
    status,
    return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'aeso-stream-every-5-min')
ORDER BY start_time DESC
LIMIT 10;
```

### Check Data Freshness

```sql
-- Data should be < 10 minutes old
SELECT
    MAX(COALESCE(timestamp, captured_at)) AS latest_data,
    EXTRACT(EPOCH FROM (NOW() - MAX(COALESCE(timestamp, captured_at))))/60 AS age_minutes
FROM grid_status
WHERE region = 'Alberta' AND data_source = 'AESO Real-Time';
```

**Expected:** `age_minutes < 10`

### View Recent Alberta Data

```sql
SELECT
    COALESCE(timestamp, captured_at) AT TIME ZONE 'America/Edmonton' AS alberta_time,
    demand_mw,
    supply_mw,
    (supply_mw - demand_mw) AS surplus_mw,
    data_source
FROM grid_status
WHERE region = 'Alberta'
ORDER BY captured_at DESC
LIMIT 20;
```

---

## 🔗 Related Files

- `AESO_CRON_SIMPLE_FIX.sql` - Simplest fix (hardcoded secret)
- `AESO_CRON_QUICK_FIX.sql` - Secure fix (secret in private table)
- `AESO_SETUP_FIXED_AUTH.sql` - Complete setup with all tables

---

## 📞 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your CRON_SECRET is correct in both places:
   - Supabase Edge Functions Secrets
   - The SQL script (or private.secrets table)
3. Ensure Edge Function `stream-aeso-grid-data` is deployed
4. Check Edge Function logs in Supabase Dashboard

---

## ✅ Next Steps After Fix

Once the cron job is working:

1. **Final QA** - Test all dashboards
2. **Create Pull Request** - Merge AESO branch to main
3. **Deploy to Production** - Push changes live
4. **Monitor** - Watch for 24 hours to ensure stability
5. **Optional Enhancements:**
   - Add "⚡ Real-Time" badge for Alberta
   - Create Alberta pool price chart
   - Expand to other provinces (BC Hydro, Hydro-Québec)

---

**Last Updated:** 2025-11-08
**Branch:** `claude/aeso-setup-minimal-deploy-011CUvmxV9ypg8fZBEad4qia`
**Status:** Ready for immediate deployment fix

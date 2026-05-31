# Deployment Fix - Calculate APO 500 Error

## Issue
The `calculate-apo` function was returning a 500 Internal Server Error after the recent updates.

## Root Cause
The function was deployed **before** the database migrations were applied. The function code was trying to insert data into new columns (`ci_lower`, `ci_upper`, `bls_trend_pct`, etc.) that didn't exist in the `apo_logs` table yet.

## Resolution
1. ✅ Applied all migrations to the Supabase project (completed earlier)
2. ✅ Redeployed the `calculate-apo` function (just completed)

## Deployment Order (Critical)
**Always follow this order to avoid similar issues:**

1. **First**: Apply database migrations
   ```bash
   SUPABASE_DB_PASSWORD=<password> supabase db push
   ```

2. **Then**: Deploy edge functions
   ```bash
   supabase functions deploy <function-name>
   ```

3. **Finally**: Set any new secrets
   ```bash
   supabase secrets set KEY="value"
   ```

## Verification
The function should now work correctly. Test by:
1. Searching for an occupation in the UI
2. Clicking on a result to trigger APO calculation
3. Verify the response includes:
   - `ci`: Confidence interval object
   - `externalSignals`: BLS and economics data

## What Changed
The `calculate-apo` function now:
- Computes confidence intervals via Monte Carlo simulation
- Fetches BLS employment trends and adjusts APO accordingly
- Looks up automation economics by industry sector
- Applies economic viability discounts
- Logs all new fields to `apo_logs` table

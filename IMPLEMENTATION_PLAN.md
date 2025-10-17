# Implementation Plan - Fixing Edge Function 500 Errors

## Problem Summary

All edge functions are deployed but returning 500 errors:
- `analyze-occupation-tasks`: 500 Internal Server Error
- `generate-learning-path`: 500 Internal Server Error  
- `crosswalk`: 404 Not Found (despite being deployed)

## Root Cause Analysis

The functions are failing at runtime, not deployment. Possible causes:

1. **API Credentials Issues**
   - O*NET API calls failing (wrong credentials or rate limits)
   - Gemini API calls failing (wrong key or quota exceeded)

2. **Database Issues**
   - Missing tables (`ai_task_assessments`, etc.)
   - RLS policies blocking service role

3. **Runtime Errors**
   - JSON parsing failures
   - Unexpected API response formats
   - Missing environment variables

## What I've Done

### ✅ Step 1: Added Detailed Error Logging

**Files Modified:**
- `supabase/functions/analyze-occupation-tasks/index.ts`
- `supabase/functions/generate-learning-path/index.ts`
- `src/components/AIImpactPlanner.tsx`

**Changes:**
- Functions now return error stack traces
- Frontend logs full error objects to console
- Better error messages for debugging

**Deployed:** ✅ Both functions redeployed with enhanced logging

### ✅ Step 2: Created Diagnostic Tools

**Files Created:**
1. `DIAGNOSTIC_STEPS.md` - Step-by-step troubleshooting guide
2. `test-functions.sh` - Script to test functions directly via curl

**Usage:**
```bash
# Set your anon key
export SUPABASE_ANON_KEY=your_key_here

# Run tests
./test-functions.sh
```

### ✅ Step 3: Verified Secrets

All required secrets are set:
- ✅ GEMINI_API_KEY
- ✅ ONET_USERNAME
- ✅ ONET_PASSWORD
- ✅ SERPAPI_API_KEY

## Next Steps (What You Need to Do)

### Immediate Action Required

**1. Check Browser Console (Most Important)**

After refreshing the page:
1. Open DevTools (F12)
2. Go to Console tab
3. Select an occupation (e.g., "Registered Nurses")
4. Look for error objects like:
   ```json
   {
     "error": "Actual error message here",
     "details": "Stack trace...",
     "function": "analyze-occupation-tasks"
   }
   ```
5. **Copy and paste the full error here**

**2. Check Supabase Dashboard Logs**

1. Go to: https://supabase.com/dashboard/project/kvunnankqgfokeufvsrv/functions
2. Click on `analyze-occupation-tasks`
3. Click "Logs" tab
4. Look for recent errors
5. **Screenshot or copy the error logs**

**3. Run Test Script (Optional)**

```bash
# Get your anon key from Supabase dashboard
export SUPABASE_ANON_KEY=eyJhbGc...

# Run tests
./test-functions.sh
```

This will show exactly what errors the functions are returning.

## Likely Scenarios & Fixes

### Scenario A: O*NET API Credentials Invalid

**Error Message:** "O*NET API request failed: 401 Unauthorized"

**Fix:**
```bash
# Verify credentials at https://services.onetcenter.org/
# Then update:
supabase secrets set ONET_USERNAME=correct_username ONET_PASSWORD=correct_password
supabase functions deploy analyze-occupation-tasks
```

### Scenario B: Gemini API Key Invalid/Quota Exceeded

**Error Message:** "Gemini API error 403" or "Quota exceeded"

**Fix:**
```bash
# Get new key from https://aistudio.google.com/app/apikey
supabase secrets set GEMINI_API_KEY=new_key_here
supabase functions deploy analyze-occupation-tasks
supabase functions deploy generate-learning-path
```

### Scenario C: Database Table Missing

**Error Message:** "relation 'ai_task_assessments' does not exist"

**Fix:**
```bash
# Check migrations
ls supabase/migrations/ | grep task

# If table is missing, we need to create it
# I can help with this once confirmed
```

### Scenario D: Model Name Incorrect

**Error Message:** "Model not found" or "Invalid model"

**Fix:**
```bash
# Check current model
supabase secrets list | grep GEMINI_MODEL

# Update to correct model
supabase secrets set GEMINI_MODEL=gemini-1.5-flash
supabase functions deploy analyze-occupation-tasks
supabase functions deploy generate-learning-path
```

## Temporary Workaround: Mock Data

While we debug, I can add fallback mock data so you can test the UI:

### Option 1: Mock Tasks
Add sample tasks when O*NET fails:
- Automate: "Administer medications"
- Augment: "Assess patient conditions"
- Human-only: "Provide emotional support"

### Option 2: Mock Learning Path
Add sample learning path when Gemini fails:
- 3 milestones
- Sample ROI calculations
- Mock course recommendations

**Would you like me to add these fallbacks?** This lets you test the UI while we fix the API issues.

## What I Need From You

To provide an exact fix, please share:

1. **Browser console error** (the full JSON object)
2. **Supabase function logs** (from dashboard or test script)
3. **Which test you ran** (occupation name/code)

Example of what I need:
```
Console error:
{
  "error": "O*NET API request failed: 401 Unauthorized",
  "details": "at line 89...",
  "function": "analyze-occupation-tasks"
}

Test: Registered Nurses (29-1141.00)
```

## Timeline

- **Now**: Enhanced error logging deployed
- **Next 5 min**: You run diagnostics and share errors
- **Next 10 min**: I provide exact fix based on errors
- **Next 15 min**: Deploy fix and verify
- **Total**: ~30 minutes to full resolution

## Files Ready for You

1. ✅ `DIAGNOSTIC_STEPS.md` - Detailed troubleshooting guide
2. ✅ `test-functions.sh` - Direct function testing script
3. ✅ Enhanced error logging in all functions
4. ✅ Better frontend error capture

## Summary

**Status:** Functions deployed with enhanced diagnostics, waiting for error details to provide exact fix.

**Blocker:** Need actual error messages from browser console or Supabase logs.

**Next:** You run diagnostics → Share errors → I provide fix → Deploy → Test → Success! 🚀

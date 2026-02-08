# Diagnostic Steps for Edge Function Errors

## Current Status

Functions are deployed but returning 500 errors. I've added detailed error logging to help diagnose the issues.

## Step 1: Check Browser Console for Detailed Errors

After the latest deployment, the functions will return more detailed error information including:
- Error message
- Stack trace (first 3 lines)
- Timestamp
- Function name

### How to Check:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Clear console
4. Try to use the feature (e.g., select an occupation)
5. Look for the error details logged

The error will now show:
```json
{
  "error": "Actual error message",
  "details": "Stack trace snippet",
  "timestamp": "2025-10-17T...",
  "function": "analyze-occupation-tasks"
}
```

## Step 2: Check Supabase Dashboard Logs

1. Go to: https://supabase.com/dashboard/project/kvunnankqgfokeufvsrv/functions
2. Click on each function:
   - `analyze-occupation-tasks`
   - `generate-learning-path`
   - `crosswalk`
3. Click "Logs" tab
4. Look for recent errors with timestamps matching your test

## Step 3: Common Error Scenarios

### Scenario A: O*NET API Errors (analyze-occupation-tasks)

**Symptoms:**
- 500 error when selecting occupation
- Error message mentions "O*NET API request failed"

**Causes:**
- Invalid O*NET credentials
- O*NET API rate limiting
- Occupation code not found in O*NET

**Fix:**
```bash
# Verify credentials are correct
supabase secrets list | grep ONET
```

### Scenario B: Gemini API Errors

**Symptoms:**
- 500 error on learning path generation
- Error message mentions "Gemini API"

**Causes:**
- Invalid GEMINI_API_KEY
- API quota exceeded
- Model name incorrect

**Fix:**
```bash
# Check Gemini key is set
supabase secrets list | grep GEMINI

# Verify model name
supabase secrets list | grep GEMINI_MODEL
```

### Scenario C: Database Table Missing

**Symptoms:**
- Error mentions "relation does not exist"
- Error about `ai_task_assessments` table

**Fix:**
```bash
# Run migrations
supabase db push
```

### Scenario D: Crosswalk 404 Error

**Symptoms:**
- POST to crosswalk returns 404
- Function shows as deployed in CLI

**Possible Causes:**
1. Function name mismatch
2. Deployment didn't complete
3. Cache issue

**Fix:**
```bash
# Redeploy crosswalk
supabase functions deploy crosswalk

# Verify it's listed
supabase functions list | grep crosswalk
```

## Step 4: Test Individual Functions

You can test functions directly using curl:

### Test analyze-occupation-tasks:
```bash
curl -X POST \
  'https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/analyze-occupation-tasks' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"occupation_code":"29-1141.00","occupation_title":"Registered Nurses"}'
```

### Test generate-learning-path:
```bash
curl -X POST \
  'https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/generate-learning-path' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "targetOccupationCode":"29-1141.00",
    "userSkills":[{"name":"Patient Care","currentLevel":2,"targetLevel":4,"category":"Technical"}],
    "targetRole":"Senior Nurse",
    "currentRole":"Nurse",
    "timeCommitment":"10",
    "learningStyle":"hands-on",
    "budget":"moderate"
  }'
```

### Test crosswalk:
```bash
curl -X POST \
  'https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/crosswalk' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"onetCode":"29-1141.00"}'
```

## Step 5: Next Actions Based on Errors

### If you see "Gemini API key is not configured":
```bash
# Set the key
supabase secrets set GEMINI_API_KEY=your_actual_key_here
```

### If you see "O*NET credentials not configured":
```bash
# Set O*NET credentials
supabase secrets set ONET_USERNAME=your_username ONET_PASSWORD=your_password
```

### If you see "relation 'ai_task_assessments' does not exist":
```bash
# Check if migration exists
ls supabase/migrations/ | grep task

# If missing, the table needs to be created
```

### If you see JSON parse errors:
- The Gemini API might be returning non-JSON
- Check the model name is correct (should be gemini-2.0-flash-exp or gemini-1.5-flash)

## Step 6: Enable Fallback/Mock Data (Temporary)

If APIs are failing, we can add mock data to unblock testing:

1. I can add a fallback that returns sample tasks when O*NET fails
2. I can add sample learning paths when Gemini fails
3. This lets you test the UI while we fix the API issues

Would you like me to add these fallbacks?

## Quick Wins to Try First

1. **Clear browser cache** - Sometimes 404s are cached
2. **Hard refresh** (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. **Check browser console** for the new detailed error messages
4. **Paste the error details here** so I can provide specific fixes

## What I Need From You

Please provide:
1. **Browser console error** (the full JSON error object)
2. **Supabase function logs** (from the dashboard)
3. **Which occupation you're testing** (e.g., "Registered Nurses" 29-1141.00)

With this information, I can provide an exact fix!

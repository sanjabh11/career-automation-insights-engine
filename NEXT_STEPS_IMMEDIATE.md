# Immediate Next Steps - Enhanced Debugging Deployed

## ✅ What I Just Deployed

### 1. Enhanced Frontend Logging
- **File**: `src/components/AIImpactPlanner.tsx`
- **Change**: Now logs both `data` and `error` from function responses
- **Result**: You'll see the actual error message from the 500 response

### 2. Enhanced O*NET API Logging
- **File**: `supabase/functions/analyze-occupation-tasks/index.ts`
- **Changes**:
  - Logs O*NET URL being called
  - Logs whether credentials are set
  - Logs O*NET response status
  - Logs full error text from O*NET API
- **Result**: We'll see exactly why O*NET is failing

### 3. Fixed Health Check
- **File**: `supabase/functions/health-check/index.ts`
- **Change**: No longer requires authorization
- **Test**: `curl https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/health-check`

## 🎯 What You Need to Do NOW

### Step 1: Test Health Check (30 seconds)
```bash
curl https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/health-check
```

**Expected output** (if secrets are correct):
```json
{
  "status": "healthy",
  "environment_checks": {
    "gemini_api_key": true,
    "onet_username": true,
    "onet_password": true,
    "serpapi_key": true,
    ...
  }
}
```

**If you see `false` for any credential**, that's the problem!

### Step 2: Refresh Browser and Test (1 minute)

1. **Hard refresh** your browser (Cmd+Shift+R / Ctrl+Shift+R)
2. Open DevTools Console (F12)
3. Clear console
4. Select "Registered Nurses" occupation
5. **Look for these new log messages**:

```
Function response - data: { error: "...", details: "..." }
Function response - error: ...
```

**Copy and paste the ENTIRE console output here!**

### Step 3: Check Supabase Logs (2 minutes)

1. Go to: https://supabase.com/dashboard/project/kvunnankqgfokeufvsrv/functions
2. Click on `analyze-occupation-tasks`
3. Click "Logs" tab
4. Look for these new log messages:
   - "Calling O*NET API: ..."
   - "O*NET credentials configured: ..."
   - "O*NET response status: ..."
   - "O*NET API error response: ..."

**Screenshot or copy the logs!**

## 🔍 What We're Looking For

### Scenario A: O*NET Credentials Invalid
**Logs will show:**
```
O*NET response status: 401
O*NET API error response: Unauthorized
```

**Fix:**
```bash
# Verify your O*NET credentials at https://services.onetcenter.org/
# Then update:
supabase secrets set ONET_USERNAME=your_correct_username
supabase secrets set ONET_PASSWORD=your_correct_password
supabase functions deploy analyze-occupation-tasks
```

### Scenario B: O*NET API Rate Limit
**Logs will show:**
```
O*NET response status: 429
O*NET API error response: Too Many Requests
```

**Fix:** Wait a few minutes or upgrade O*NET plan

### Scenario C: Gemini API Issue
**Logs will show:**
```
Gemini API error 403
```

**Fix:**
```bash
supabase secrets set GEMINI_API_KEY=new_key_from_google
supabase functions deploy analyze-occupation-tasks
```

### Scenario D: Database Table Missing
**Logs will show:**
```
relation 'ai_task_assessments' does not exist
```

**Fix:** I'll provide SQL to create the table

## 📊 Most Likely Issue (Based on Symptoms)

**90% probability**: O*NET credentials are invalid or expired

**Why**: 
- Function deploys successfully
- Reaches O*NET API call
- Returns 500 (not 401 auth error)
- This pattern matches invalid O*NET credentials

**Quick Test**:
Run health check - if `onet_username` or `onet_password` is `false`, that's definitely the issue!

## ⚡ Quick Commands to Run

```bash
# 1. Health check
curl https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/health-check

# 2. If health check shows missing secrets, set them:
supabase secrets set ONET_USERNAME=your_username
supabase secrets set ONET_PASSWORD=your_password
supabase functions deploy analyze-occupation-tasks

# 3. Test again in browser
```

## 🎯 Success Criteria

After the fix, you should see:
1. ✅ Health check returns all `true`
2. ✅ Browser console shows: `Function response - data: { tasks: [...] }`
3. ✅ Tasks display in the UI
4. ✅ No 500 errors

## 📝 What I Need From You

**Priority 1** (Most important):
```bash
curl https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/health-check
```
Copy the output!

**Priority 2**:
- Browser console output after selecting occupation
- Look for "Function response - data:" and "Function response - error:"

**Priority 3**:
- Supabase function logs showing O*NET API calls

## ⏱️ Timeline

- **Now**: Enhanced logging deployed
- **Next 2 min**: You run health check and share output
- **Next 5 min**: I identify exact issue and provide fix
- **Next 5 min**: Deploy fix
- **Next 2 min**: Test and verify
- **Total**: ~15 minutes to resolution

## 🚀 Ready!

All enhanced logging is deployed. The next console output will show us exactly what's failing!

**Run the health check now and share the output!** 🎯

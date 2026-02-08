# Deployment Commands - Ready to Execute

**Date:** October 15, 2025  
**Status:** Migrations complete, ready for function deployment

## Prerequisites

Ensure you have:
- Supabase CLI authenticated: `supabase login`
- Project linked: `supabase link --project-ref kvunnankqgfokeufvsrv`
- Service role key in environment: `export SUPABASE_SERVICE_ROLE_KEY=your_key`

## 1. Deploy Edge Functions

### Deploy New Functions
```bash
# STEM membership sync
supabase functions deploy sync-stem-membership

# Knowledge/Abilities sync
supabase functions deploy sync-knowledge-abilities
```

### Deploy Updated Functions
```bash
# Updated with x-api-key enforcement
supabase functions deploy analyze-occupation-tasks

# Updated with POST body support
supabase functions deploy hot-technologies
```

## 2. Populate STEM Membership Table

**Run this ONCE to populate the STEM membership table:**

```bash
curl -X POST "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/sync-stem-membership" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

**Expected Response:**
```json
{
  "message": "STEM membership sync completed",
  "totalOccupations": 450,
  "stemTypes": ["Research", "Engineering", "Technology", "Mathematics"],
  "syncedAt": "2025-10-15T..."
}
```

**Verify:**
```bash
psql "$SUPABASE_POSTGRES_URI" \
  -c "SELECT COUNT(*) FROM public.onet_stem_membership;"
```

## 3. Populate Knowledge/Abilities (Sample Occupations)

**Run for key occupations to populate Work Dimensions page:**

```bash
# Software Developers
curl -X POST "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/sync-knowledge-abilities" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"occupationCode":"15-1252.00"}'

# Registered Nurses
curl -X POST "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/sync-knowledge-abilities" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"occupationCode":"29-1141.00"}'

# Financial Analysts
curl -X POST "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/sync-knowledge-abilities" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"occupationCode":"13-2051.00"}'

# Marketing Managers
curl -X POST "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/sync-knowledge-abilities" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"occupationCode":"11-2021.00"}'

# Data Scientists
curl -X POST "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/sync-knowledge-abilities" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"occupationCode":"15-2051.00"}'
```

**Expected Response (per occupation):**
```json
{
  "occupationCode": "15-1252.00",
  "knowledgeCount": 35,
  "abilitiesCount": 52,
  "syncedAt": "2025-10-15T..."
}
```

**Verify:**
```bash
psql "$SUPABASE_POSTGRES_URI" \
  -c "SELECT occupation_code, COUNT(*) as knowledge_count FROM public.onet_knowledge GROUP BY occupation_code;"
```

## 4. Test Frontend Pages

### STEM Browse
```bash
# Start dev server if not running
npm run dev

# Visit in browser
open http://localhost:5173/browse/stem
```

**Expected:**
- STEM occupation cards display
- Each card shows STEM type badge (e.g., "Research • Computer Science")
- Badges only appear after STEM sync completes

### Work Dimensions
```bash
open http://localhost:5173/work-dimensions
```

**Expected:**
- **Abilities Tab:** Shows grouped abilities with occupation counts
- **Knowledge Tab:** Shows grouped knowledge areas with occupation counts
- **Importance Filters:** 3.0+, 3.5+, 4.0+, 4.5+ work correctly
- **Note:** Data appears only after syncing knowledge/abilities for multiple occupations

### Tech Skills Discovery
```bash
open http://localhost:5173/tech-skills
```

**Expected:**
- Lists hot technologies with heat index
- Search/filter works
- Click technology shows related occupations

## 5. Schema Validation Queries

```bash
# Check STEM membership
psql "$SUPABASE_POSTGRES_URI" <<EOF
-- STEM membership stats
SELECT 
  stem_occupation_type, 
  COUNT(*) as occupation_count 
FROM public.onet_stem_membership 
GROUP BY stem_occupation_type 
ORDER BY occupation_count DESC;

-- Sample STEM occupations
SELECT 
  occupation_code, 
  stem_occupation_type, 
  job_family 
FROM public.onet_stem_membership 
LIMIT 10;
EOF

# Check knowledge/abilities
psql "$SUPABASE_POSTGRES_URI" <<EOF
-- Knowledge stats
SELECT 
  occupation_code, 
  COUNT(*) as knowledge_count,
  AVG(importance) as avg_importance
FROM public.onet_knowledge 
GROUP BY occupation_code;

-- Top knowledge areas
SELECT 
  name, 
  COUNT(DISTINCT occupation_code) as occupation_count,
  AVG(importance) as avg_importance
FROM public.onet_knowledge 
GROUP BY name 
ORDER BY occupation_count DESC 
LIMIT 10;

-- Abilities stats
SELECT 
  occupation_code, 
  COUNT(*) as abilities_count,
  AVG(importance) as avg_importance
FROM public.onet_abilities 
GROUP BY occupation_code;
EOF
```

## 6. Optional: Bulk Knowledge/Abilities Sync

**To populate Work Dimensions with comprehensive data, sync top 50 occupations:**

```bash
# Create a script to sync multiple occupations
cat > sync_top_occupations.sh <<'SCRIPT'
#!/bin/bash

# Top 50 occupation codes (by popularity/demand)
OCCUPATIONS=(
  "15-1252.00"  # Software Developers
  "29-1141.00"  # Registered Nurses
  "13-2051.00"  # Financial Analysts
  "11-2021.00"  # Marketing Managers
  "15-2051.00"  # Data Scientists
  "11-3021.00"  # Computer and Information Systems Managers
  "29-1171.00"  # Nurse Practitioners
  "13-1111.00"  # Management Analysts
  "15-1244.00"  # Network and Computer Systems Administrators
  "11-2022.00"  # Sales Managers
  # Add more as needed
)

for code in "${OCCUPATIONS[@]}"; do
  echo "Syncing $code..."
  curl -X POST "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/sync-knowledge-abilities" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"occupationCode\":\"$code\"}" \
    --silent
  echo ""
  sleep 1  # Rate limiting
done

echo "Bulk sync complete!"
SCRIPT

chmod +x sync_top_occupations.sh
./sync_top_occupations.sh
```

## 7. Environment Variables Check

Ensure these are set in Supabase Dashboard → Settings → Edge Functions:

```bash
# O*NET Credentials
ONET_USERNAME=your_username
ONET_PASSWORD=your_password

# Gemini AI
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.5-flash

# Optional: LLM Security
LLM_FUNCTION_API_KEY=your_secret_key  # For x-api-key enforcement
```

## 8. Deployment Verification Checklist

- [ ] All 4 Edge Functions deployed successfully
- [ ] STEM membership table populated (400-600 records)
- [ ] Knowledge/Abilities synced for at least 5 occupations
- [ ] STEM browse page shows type/family chips
- [ ] Work Dimensions page displays data in all tabs
- [ ] Tech Skills page loads and search works
- [ ] No console errors in browser dev tools
- [ ] Database queries return expected results

## Troubleshooting

### Function Deployment Fails
```bash
# Check authentication
supabase login

# Re-link project
supabase link --project-ref kvunnankqgfokeufvsrv

# Try with debug
supabase functions deploy sync-stem-membership --debug
```

### STEM Sync Returns Empty
- Verify O*NET credentials are set in Supabase Dashboard
- Check function logs: `supabase functions logs sync-stem-membership`
- Test O*NET API directly: `curl -u "$ONET_USERNAME:$ONET_PASSWORD" "https://services.onetcenter.org/ws/online/stem/types"`

### Knowledge/Abilities Sync Fails
- Verify occupation code format (e.g., "15-1252.00" not "15-1252")
- Check service role key is correct
- View function logs: `supabase functions logs sync-knowledge-abilities`

### Frontend Shows No Data
- Verify tables are populated: Run schema validation queries
- Check browser console for API errors
- Ensure Supabase anon key is correct in `.env.local`
- Clear browser cache and reload

---

**All commands ready to execute. Start with Edge Function deployment, then populate tables, then test frontend.**

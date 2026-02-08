# Deployment Instructions

## Issue Summary
The API errors occur because:
1. The `fetch-related-occupations` edge function is not deployed to Supabase
2. The `onet_related_occupations` table may not exist in your remote database

## Steps to Fix

### 1. Deploy Edge Function
```bash
# Log in to Supabase (if not already)
npx supabase login

# Link your project (if not already linked)
npx supabase link --project-ref kvunnankqgfokeufvsrv

# Deploy the edge function
npx supabase functions deploy fetch-related-occupations
```

### 2. Apply Database Migrations
```bash
# Push migrations to remote database
npx supabase db push

# Or manually run the migrations in Supabase Studio:
# 1. Go to https://supabase.com/dashboard/project/kvunnankqgfokeufvsrv/editor
# 2. Navigate to SQL Editor
# 3. Run: supabase/migrations/20251121_create_onet_related_occupations.sql
# 4. Run: supabase/migrations/20251121_seed_related_occupations.sql
```

### 3. Verify Deployment
After deployment, check:
- Edge function is listed in Supabase Dashboard > Edge Functions
- Table exists in Supabase Dashboard > Table Editor
- Run a test query: `SELECT * FROM onet_related_occupations LIMIT 1;`

## Alternative: Disable the Feature Temporarily
If you want to continue development without these features, you can:
1. Comment out the `useRelatedOccupations` hook in `SidebarContent.tsx`
2. The app will continue to function without related occupations display

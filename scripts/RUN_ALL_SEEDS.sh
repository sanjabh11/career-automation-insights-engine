#!/bin/bash
set -e

echo "=========================================="
echo "Running All Seed Scripts"
echo "=========================================="
echo ""

PROJECT_REF="kvunnankqgfokeufvsrv"

echo "Step 1: Adding description column to job_zones..."
supabase db push --project-ref "$PROJECT_REF" || echo "Migration may already be applied"
echo ""

echo "Step 2: Seeding STEM data..."
psql "$DATABASE_URL" -f supabase/data/imports/01_import_stem_complete.sql || \
  supabase db execute --project-ref "$PROJECT_REF" --file supabase/data/imports/01_import_stem_complete.sql
echo ""

echo "Step 3: Seeding Job Zones..."
psql "$DATABASE_URL" -f supabase/data/imports/02_seed_job_zones_FINAL.sql || \
  supabase db execute --project-ref "$PROJECT_REF" --file supabase/data/imports/02_seed_job_zones_FINAL.sql
echo ""

echo "Step 4: Seeding Hot Technologies..."
psql "$DATABASE_URL" -f supabase/data/imports/03_seed_hot_technologies_FINAL.sql || \
  supabase db execute --project-ref "$PROJECT_REF" --file supabase/data/imports/03_seed_hot_technologies_FINAL.sql
echo ""

echo "Step 5: Running verification..."
psql "$DATABASE_URL" -f supabase/data/imports/04_verify_all_seeds.sql || \
  supabase db execute --project-ref "$PROJECT_REF" --file supabase/data/imports/04_verify_all_seeds.sql
echo ""

echo "=========================================="
echo "All seeds complete! Now testing endpoints..."
echo "=========================================="
echo ""

./test_endpoints.sh

echo ""
echo "=========================================="
echo "DONE - Check results above"
echo "=========================================="

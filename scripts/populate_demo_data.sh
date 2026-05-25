#!/bin/bash
# Populate demo data for UI feature validation
# Run from project root: bash scripts/populate_demo_data.sh

set -e

echo "🚀 Populating demo data for Career Automation Insights Engine"
echo "=============================================================="

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install: https://supabase.com/docs/guides/cli"
    exit 1
fi

# 1. Set SerpAPI secret
echo ""
echo "📝 Step 1: Setting SERPAPI_API_KEY secret..."
if [ -z "$SERPAPI_API_KEY" ]; then
    echo "⚠️  SERPAPI_API_KEY is not set. Skipping Supabase secret update."
else
  supabase secrets set SERPAPI_API_KEY="$SERPAPI_API_KEY" || {
    echo "⚠️  Failed to set secret (may already exist or need auth)"
  }
fi

# 2. Populate BLS employment data (sample for SOC-6 15-1252)
echo ""
echo "📊 Step 2: Inserting BLS employment sample data via psql..."

if ! command -v psql &> /dev/null; then
  echo "❌ psql not found. Install PostgreSQL client or set PSQL_CMD before running."
  exit 1
fi

if [ -z "$PSQL_CONN" ]; then
  echo "❌ PSQL_CONN is not set. Export a secure Postgres connection string before running this script."
  exit 1
fi

psql "$PSQL_CONN" <<'SQL'
INSERT INTO public.bls_employment_data (occupation_code_6, occupation_code_8, year, employment_level, projected_growth_10y, median_wage_annual, region)
VALUES
  ('15-1252', '15-1252.00', 2020, 1847900, 22.0, 110140, 'US'),
  ('15-1252', '15-1252.00', 2021, 1920000, 22.0, 115000, 'US'),
  ('15-1252', '15-1252.00', 2022, 1995000, 22.0, 120730, 'US'),
  ('15-1252', '15-1252.00', 2023, 2070000, 22.0, 127260, 'US'),
  ('15-1252', '15-1252.00', 2024, 2150000, 22.0, 132270, 'US')
ON CONFLICT (occupation_code_6, year, region) DO UPDATE
  SET employment_level = EXCLUDED.employment_level,
      projected_growth_10y = EXCLUDED.projected_growth_10y,
      median_wage_annual = EXCLUDED.median_wage_annual,
      occupation_code_8 = EXCLUDED.occupation_code_8,
      last_updated = NOW();
SQL
echo "✅ BLS data inserted for SOC-6 15-1252 (Software Developers)"

# 3. Invoke validate-apo and skill-demand-scraper via HTTP (requires service role key)
echo ""
echo "🎓 Step 3: Running academic validation (validate-apo)..."

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "⚠️  SUPABASE_SERVICE_ROLE_KEY not set. Export it to run steps 3 & 4, e.g."
  echo "    export SUPABASE_SERVICE_ROLE_KEY=..."
else
  curl -s -X POST \
    "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/validate-apo" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    --data '{"sinceDays": 90}' || echo "⚠️  Validation function request failed"

  echo ""
  echo "🔍 Step 4: Scraping skill demand signals (this may take 30-60 seconds)..."
  curl -s -X POST \
    "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/skill-demand-scraper" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    --data '{"skills": ["Python","Excel","JavaScript","SQL","AWS","Salesforce","React","Git"], "occupationCode": "ALL"}' || echo "⚠️  Skill demand scrape request failed"
fi

echo ""
echo "=============================================================="
echo "✅ Demo data population complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Navigate to http://localhost:5173/ (or your deployed URL)"
echo "  2. Search for 'Software Developer' and click result"
echo "  3. Observe: BLS sparkline, Economic Viability card, External Signals badges"
echo "  4. Visit /validation to see Academic Validation badge"
echo "  5. Visit /tech-skills and search for 'Python' to see demand badges"
echo ""
echo "📸 Capture screenshots for nomination evidence!"

#!/bin/bash
# Apply hot technologies seed migration via Supabase REST API

SUPABASE_URL="https://kvunnankqgfokeufvsrv.supabase.co"
SERVICE_ROLE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env | cut -d= -f2)

SQL="INSERT INTO public.onet_hot_technologies_master (technology_name, category, description, related_occupations_count, trending_score)
VALUES
  ('Excel', 'Analytics', 'Spreadsheet analysis and reporting', 0, 0.70),
  ('Python', 'Programming', 'General-purpose programming language', 0, 0.85),
  ('Salesforce', 'CRM', 'Customer relationship management platform', 0, 0.65),
  ('AWS', 'Cloud', 'Amazon Web Services cloud platform', 0, 0.80),
  ('Tableau', 'BI', 'Business intelligence and data visualization', 0, 0.68),
  ('React', 'Frontend', 'JavaScript library for building UIs', 0, 0.72)
ON CONFLICT (technology_name) DO NOTHING;"

curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${SQL}\"}"

echo ""
echo "Seed migration applied (or skipped if already exists)"

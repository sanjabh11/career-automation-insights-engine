#!/bin/bash

# Test script for verifying all endpoints return source: "db"
# Run after importing SQL scripts

#!/bin/bash

# Get current anon key from .env
ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d '=' -f2)

echo "=== Testing STEM Filter ==="
curl -s -X POST \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/search-occupations" \
  -d '{"filters":{"stem":true},"limit":5}' | jq '.source, .total'

echo ""
echo "=== Testing Job Zones ==="
curl -s -X POST \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/browse-job-zones" \
  -d '{}' | jq '.source, .totalZones'

echo ""
echo "=== Testing Hot Technologies ==="
curl -s -X POST \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/hot-technologies" \
  -d '{"limit":10}' | jq '.source, .totalCount'

echo ""
echo "=== Testing Career Clusters ==="
curl -s -X POST \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/browse-career-clusters" \
  -d '{}' | jq '.source, .clusters | length'

echo ""
echo "=== All tests complete ==="
echo "Expected results:"
echo "  STEM: source='db', total=100"
echo "  Job Zones: source='db', totalZones=5"
echo "  Hot Tech: source='db', totalCount=40"
echo "  Clusters: source='db', length=16"

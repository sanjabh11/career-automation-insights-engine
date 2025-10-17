#!/bin/bash

# Test Edge Functions
# Usage: ./test-functions.sh

echo "Testing Edge Functions..."
echo "========================="
echo ""

# Get anon key from environment or prompt
if [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "Please set SUPABASE_ANON_KEY environment variable"
  echo "Or run: export SUPABASE_ANON_KEY=your_key_here"
  exit 1
fi

BASE_URL="https://kvunnankqgfokeufvsrv.supabase.co/functions/v1"

echo "1. Testing analyze-occupation-tasks..."
echo "--------------------------------------"
RESPONSE=$(curl -s -X POST \
  "$BASE_URL/analyze-occupation-tasks" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"occupation_code":"29-1141.00","occupation_title":"Registered Nurses"}')

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""
echo ""

echo "2. Testing generate-learning-path..."
echo "------------------------------------"
RESPONSE=$(curl -s -X POST \
  "$BASE_URL/generate-learning-path" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "targetOccupationCode":"29-1141.00",
    "userSkills":[{"name":"Patient Care","currentLevel":2,"targetLevel":4,"category":"Technical"}],
    "targetRole":"Senior Nurse",
    "currentRole":"Nurse",
    "timeCommitment":"10",
    "learningStyle":"hands-on",
    "budget":"moderate",
    "currentSalary":70000,
    "targetSalary":90000
  }')

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""
echo ""

echo "3. Testing crosswalk..."
echo "----------------------"
RESPONSE=$(curl -s -X POST \
  "$BASE_URL/crosswalk" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"onetCode":"29-1141.00"}')

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""
echo ""

echo "4. Testing hot-technologies..."
echo "------------------------------"
RESPONSE=$(curl -s -X GET \
  "$BASE_URL/hot-technologies?limit=5" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""
echo ""

echo "Testing complete!"
echo "================="
echo ""
echo "If you see errors, check:"
echo "1. DIAGNOSTIC_STEPS.md for troubleshooting"
echo "2. Supabase Dashboard logs"
echo "3. Browser console for detailed error messages"

#!/bin/bash

# Phase 1 Implementation Testing Script
# Tests all new O*NET enrichment endpoints
# Usage: ./test-phase1-endpoints.sh [SUPABASE_PROJECT_URL]

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_URL="${1:-http://localhost:54321}"
FUNCTIONS_URL="${PROJECT_URL}/functions/v1"
ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dW5uYW5rcWdmb2tldWZ2c3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4ODYyMTksImV4cCI6MjA2NTQ2MjIxOX0.eFRKKSAWaXQgCCX7UpU0hF0dnEyJ2IXUnaGsc8MEGOU}"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Phase 1 Implementation Test Suite${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "Testing against: $FUNCTIONS_URL"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_field="$5"
    
    echo -e "${YELLOW}Testing:${NC} $name"
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -X POST "$FUNCTIONS_URL/$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ANON_KEY" \
            -d "$data")
    else
        response=$(curl -s "$FUNCTIONS_URL/$endpoint" \
            -H "Authorization: Bearer $ANON_KEY")
    fi
    
    if echo "$response" | jq -e "$expected_field" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC} - $name"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} - $name"
        echo "Response: $response" | jq '.' 2>/dev/null || echo "$response"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo -e "${YELLOW}1. Testing O*NET Enrichment Function${NC}"
echo "-------------------------------------------"
test_endpoint \
    "Fetch enrichment for Software Developers" \
    "POST" \
    "onet-enrichment" \
    '{"occupationCode": "15-1252.00"}' \
    '.occupation_code'

test_endpoint \
    "Verify Bright Outlook field" \
    "POST" \
    "onet-enrichment" \
    '{"occupationCode": "15-1252.00"}' \
    '.bright_outlook'

test_endpoint \
    "Verify related occupations" \
    "POST" \
    "onet-enrichment" \
    '{"occupationCode": "15-1252.00"}' \
    '.relatedOccupations | length'

echo ""
echo -e "${YELLOW}2. Testing Career Clusters Browse${NC}"
echo "-------------------------------------------"
test_endpoint \
    "Get all career clusters" \
    "GET" \
    "browse-career-clusters" \
    "" \
    '.clusters | length'

test_endpoint \
    "Get specific cluster (IT)" \
    "GET" \
    "browse-career-clusters?clusterId=IT" \
    "" \
    '.cluster.cluster_name'

test_endpoint \
    "Get IT cluster with occupations" \
    "GET" \
    "browse-career-clusters?clusterId=IT&includeOccupations=true&limit=5" \
    "" \
    '.occupations | length'

echo ""
echo -e "${YELLOW}3. Testing Job Zones Browse${NC}"
echo "-------------------------------------------"
test_endpoint \
    "Get all job zones" \
    "GET" \
    "browse-job-zones" \
    "" \
    '.zones | length'

test_endpoint \
    "Get Zone 4 (Bachelor's degree)" \
    "GET" \
    "browse-job-zones?zone=4" \
    "" \
    '.zone.zone_name'

test_endpoint \
    "Get Zone 4 with occupations" \
    "GET" \
    "browse-job-zones?zone=4&includeOccupations=true&limit=5" \
    "" \
    '.occupations'

echo ""
echo -e "${YELLOW}4. Testing Advanced Search${NC}"
echo "-------------------------------------------"
test_endpoint \
    "Search by keyword (software)" \
    "POST" \
    "search-occupations" \
    '{"keyword": "software", "limit": 5}' \
    '.occupations | length'

test_endpoint \
    "Search with Bright Outlook filter" \
    "POST" \
    "search-occupations" \
    '{"filters": {"brightOutlook": true}, "limit": 5}' \
    '.occupations'

test_endpoint \
    "Search with STEM filter" \
    "POST" \
    "search-occupations" \
    '{"filters": {"stem": true}, "limit": 5}' \
    '.occupations'

test_endpoint \
    "Search with Job Zone filter" \
    "POST" \
    "search-occupations" \
    '{"filters": {"jobZone": 4}, "limit": 5}' \
    '.occupations'

test_endpoint \
    "Search with combined filters" \
    "POST" \
    "search-occupations" \
    '{"keyword": "engineer", "filters": {"stem": true, "brightOutlook": true}, "limit": 3}' \
    '.total'

echo ""
echo -e "${YELLOW}5. Testing Cache Behavior${NC}"
echo "-------------------------------------------"
echo "First call (should populate cache)..."
time curl -s -X POST "$FUNCTIONS_URL/onet-enrichment" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ANON_KEY" \
    -d '{"occupationCode": "15-1252.00"}' > /dev/null

echo "Second call (should use cache)..."
response=$(time curl -s -X POST "$FUNCTIONS_URL/onet-enrichment" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ANON_KEY" \
    -d '{"occupationCode": "15-1252.00"}')

if echo "$response" | jq -e '.cached == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED${NC} - Cache working correctly"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - Cache not working (might be first run)"
    ((TESTS_FAILED++))
fi

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test Results${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! Phase 1 implementation is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please check the errors above.${NC}"
    exit 1
fi

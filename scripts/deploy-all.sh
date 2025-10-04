#!/bin/bash

# Complete Deployment Script for Phase 1 & Phase 2
# Deploys all database migrations and Edge Functions
# Usage: ./deploy-all.sh [SUPABASE_PROJECT_REF]

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_REF="${1}"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Complete Deployment: Phase 1 & Phase 2${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Step 1: Link Project
if [ -z "$PROJECT_REF" ]; then
    echo -e "${YELLOW}No project ref provided. Using existing link...${NC}"
else
    echo -e "${YELLOW}Linking to project: $PROJECT_REF${NC}"
    supabase link --project-ref "$PROJECT_REF"
fi

# Step 2: Deploy Database
echo ""
echo -e "${YELLOW}Step 1/3: Deploying Database Migrations${NC}"
echo -e "${YELLOW}========================================${NC}"
supabase db push

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database migrations deployed successfully${NC}"
else
    echo -e "${RED}✗ Database migration failed${NC}"
    exit 1
fi

# Step 3: Deploy Edge Functions
echo ""
echo -e "${YELLOW}Step 2/3: Deploying Edge Functions${NC}"
echo -e "${YELLOW}========================================${NC}"

FUNCTIONS=(
    "onet-enrichment"
    "browse-career-clusters"
    "browse-job-zones"
    "search-occupations"
    "fetch-work-context"
    "search-tasks"
    "search-activities"
    "hot-technologies"
    "market-intelligence"
    "ai-career-coach"
    "skill-recommendations"
    "analyze-occupation-tasks"
)

FAILED_FUNCTIONS=()

for func in "${FUNCTIONS[@]}"; do
    echo -e "${YELLOW}Deploying ${func}...${NC}"
    if supabase functions deploy "$func"; then
        echo -e "${GREEN}✓ ${func} deployed${NC}"
    else
        echo -e "${RED}✗ ${func} failed${NC}"
        FAILED_FUNCTIONS+=("$func")
    fi
done

# Step 4: Summary
echo ""
echo -e "${YELLOW}Step 3/3: Deployment Summary${NC}"
echo -e "${YELLOW}========================================${NC}"

if [ ${#FAILED_FUNCTIONS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All ${#FUNCTIONS[@]} functions deployed successfully!${NC}"
else
    echo -e "${RED}✗ ${#FAILED_FUNCTIONS[@]} functions failed:${NC}"
    for func in "${FAILED_FUNCTIONS[@]}"; do
        echo -e "${RED}  - ${func}${NC}"
    done
    exit 1
fi

# List deployed functions
echo ""
echo -e "${YELLOW}Verifying deployment...${NC}"
supabase functions list

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Run test suite: ./scripts/test-phase1-endpoints.sh"
echo "2. Verify database tables populated"
echo "3. Test frontend integration"
echo "4. Monitor Supabase logs"
echo ""
echo -e "${GREEN}All systems ready for production! 🚀${NC}"

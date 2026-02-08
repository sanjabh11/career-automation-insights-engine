#!/bin/bash

# Fix Dev Server Script
# This script clears Vite cache and restarts the dev server

echo "🔧 Fixing Dev Server Issues..."
echo ""

# Step 1: Stop any running dev servers
echo "1️⃣ Stopping any running dev servers..."
pkill -f "vite" || true
sleep 2

# Step 2: Clear Vite cache
echo "2️⃣ Clearing Vite cache..."
rm -rf node_modules/.vite
rm -rf .vite
rm -rf dist

# Step 3: Clear npm cache (optional, only if needed)
# echo "3️⃣ Clearing npm cache..."
# npm cache clean --force

# Step 4: Verify critical files exist
echo "3️⃣ Verifying critical files..."
if [ ! -f "src/pages/IndustryDashboardPage.tsx" ]; then
  echo "❌ ERROR: src/pages/IndustryDashboardPage.tsx is missing!"
  exit 1
fi

if [ ! -f "src/pages/ImpactDashboard.tsx" ]; then
  echo "❌ ERROR: src/pages/ImpactDashboard.tsx is missing!"
  exit 1
fi

if [ ! -f "src/pages/ValidationCenter.tsx" ]; then
  echo "❌ ERROR: src/pages/ValidationCenter.tsx is missing!"
  exit 1
fi

if [ ! -f "src/pages/ResponsibleAI.tsx" ]; then
  echo "❌ ERROR: src/pages/ResponsibleAI.tsx is missing!"
  exit 1
fi

echo "✅ All critical files verified"
echo ""

# Step 5: Start dev server
echo "4️⃣ Starting dev server..."
echo "   Server will be available at: http://localhost:8080/"
echo ""
echo "   Press Ctrl+C to stop the server"
echo ""

npm run dev

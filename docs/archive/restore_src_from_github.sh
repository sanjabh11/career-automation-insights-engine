#!/bin/bash

echo "🔧 Restoring ALL Source Files from GitHub"
echo "=========================================="
echo ""

GITHUB_REPO="https://github.com/sanjabh11/career-automation-insights-engine"
COMMIT="c2fb9dc"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Clone the specific commit to a temp directory
TEMP_DIR="/tmp/github_restore_${TIMESTAMP}"

echo "1️⃣ Cloning repository at commit ${COMMIT}..."
git clone --depth 1 "${GITHUB_REPO}" "${TEMP_DIR}" 2>&1 | grep -v "Cloning\|Receiving\|Resolving" || true
cd "${TEMP_DIR}"
git checkout "${COMMIT}" 2>&1 | grep -v "HEAD\|detached" || true

echo ""
echo "2️⃣ Backing up current corrupted files..."
cd - > /dev/null
if [ -d "src" ]; then
    mv src "src.backup.${TIMESTAMP}"
    echo "✅ Backed up src directory"
fi

echo ""
echo "3️⃣ Copying fresh files from GitHub..."
cp -R "${TEMP_DIR}/src" ./
echo "✅ Copied src directory"

# Copy other potentially corrupted directories
for dir in public scripts supabase; do
    if [ -d "${TEMP_DIR}/${dir}" ]; then
        if [ -d "${dir}" ]; then
            mv "${dir}" "${dir}.backup.${TIMESTAMP}"
        fi
        cp -R "${TEMP_DIR}/${dir}" ./
        echo "✅ Copied ${dir} directory"
    fi
done

echo ""
echo "4️⃣ Cleaning up..."
rm -rf "${TEMP_DIR}"
echo "✅ Cleanup complete"

echo ""
echo "5️⃣ Clearing extended attributes..."
find . -type f -not -path "./node_modules/*" -not -path "./.git/*" -exec xattr -c {} \; 2>/dev/null
echo "✅ Extended attributes cleared"

echo ""
echo "6️⃣ Verifying critical source files..."
test_files=(
    "src/main.tsx"
    "src/App.tsx"
    "src/hooks/use-mobile.ts"
    "src/components/EnhancedAPODashboardHeader.tsx"
)

all_good=true
for file in "${test_files[@]}"; do
    if [ -f "$file" ]; then
        if cat "$file" > /dev/null 2>&1; then
            echo "  ✅ $file is readable"
        else
            echo "  ❌ $file still has issues"
            all_good=false
        fi
    else
        echo "  ⚠️  $file not found"
        all_good=false
    fi
done

echo ""
if [ "$all_good" = true ]; then
    echo "🎉 All source files successfully restored!"
    echo ""
    echo "📋 Next step: Run 'npm run dev' to start the development server"
else
    echo "⚠️  Some files still have issues."
    exit 1
fi

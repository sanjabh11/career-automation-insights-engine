#!/bin/bash

echo "🔧 Restoring Files from GitHub (commit c2fb9dc)"
echo "================================================"
echo ""

GITHUB_BASE="https://raw.githubusercontent.com/sanjabh11/career-automation-insights-engine/c2fb9dc"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Function to safely restore a file from GitHub
restore_file() {
    local filename=$1
    local github_path=$2
    
    echo "📥 Restoring $filename..."
    
    # Backup existing file if it exists
    if [ -f "$filename" ]; then
        echo "  📦 Backing up existing file..."
        mv "$filename" "${filename}.backup.${TIMESTAMP}" 2>/dev/null || rm -f "$filename"
    fi
    
    # Download from GitHub
    if curl -sf "${GITHUB_BASE}/${github_path}" -o "$filename"; then
        chmod 644 "$filename"
        # Verify it's readable
        if cat "$filename" > /dev/null 2>&1; then
            echo "  ✅ $filename restored successfully"
            return 0
        else
            echo "  ❌ $filename downloaded but not readable"
            return 1
        fi
    else
        echo "  ❌ Failed to download $filename"
        return 1
    fi
}

# Restore critical configuration files
echo "1️⃣ Restoring configuration files..."
restore_file "package.json" "package.json"
restore_file "vite.config.ts" "vite.config.ts"
restore_file "tsconfig.json" "tsconfig.json"
restore_file "tsconfig.app.json" "tsconfig.app.json"
restore_file "tsconfig.node.json" "tsconfig.node.json"
restore_file "index.html" "index.html"
restore_file "postcss.config.js" "postcss.config.js"
restore_file "tailwind.config.ts" "tailwind.config.ts"
restore_file ".env.example" ".env.example"

echo ""
echo "2️⃣ Clearing extended attributes from all project files..."
find . -maxdepth 3 -type f -not -path "./node_modules/*" -not -path "./.git/*" -exec xattr -c {} \; 2>/dev/null
echo "✅ Extended attributes cleared"

echo ""
echo "3️⃣ Handling .env files..."
# If .env doesn't exist, create from .env.example
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "  📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "  ⚠️  Remember to update .env with your actual API keys!"
elif [ -f ".env" ]; then
    # Try to read .env
    if ! cat .env > /dev/null 2>&1; then
        echo "  ⚠️  .env is corrupted, recreating from .env.example..."
        rm -f .env
        cp .env.example .env 2>/dev/null || touch .env
        echo "  ⚠️  Remember to update .env with your actual API keys!"
    else
        echo "  ✅ .env is readable"
    fi
fi

echo ""
echo "4️⃣ Verifying all critical files..."
critical_files=("package.json" "vite.config.ts" "tsconfig.json" "index.html")
all_good=true

for file in "${critical_files[@]}"; do
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
    echo "🎉 All files successfully restored from GitHub!"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Review and update .env with your API keys"
    echo "  2. Run: rm -rf node_modules"
    echo "  3. Run: npm install --ignore-scripts"
    echo "  4. Run: npm run dev"
else
    echo "⚠️  Some files still have issues. Check the output above."
    exit 1
fi

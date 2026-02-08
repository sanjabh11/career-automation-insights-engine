#!/bin/bash

echo "🔧 Fixing corrupted package.json..."

# Backup the corrupted file
if [ -f "package.json" ]; then
    echo "📦 Backing up corrupted package.json..."
    mv package.json package.json.corrupted.$(date +%Y%m%d_%H%M%S)
fi

# Replace with fixed version
if [ -f "package.json.fixed" ]; then
    echo "✅ Installing fixed package.json..."
    mv package.json.fixed package.json
    chmod 644 package.json
    echo "✅ package.json has been restored!"
else
    echo "❌ Error: package.json.fixed not found!"
    exit 1
fi

# Verify the file is readable
if cat package.json > /dev/null 2>&1; then
    echo "✅ Verification: package.json is now readable"
else
    echo "❌ Error: package.json still has issues"
    exit 1
fi

echo ""
echo "🎉 Fix complete! You can now run: npm install"

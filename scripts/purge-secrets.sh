#!/bin/bash

# Script to purge secrets from git history using BFG Repo-Cleaner
# This script should be run on a fresh clone of the repository

set -e

echo "🔍 RAI AI Farming Mobile - Secret Purge Script"
echo "=============================================="

# Check if BFG is installed
if ! command -v bfg &> /dev/null; then
    echo "❌ BFG Repo-Cleaner is not installed."
    echo "Please install it first:"
    echo "  - Download from: https://rtyley.github.io/bfg-repo-cleaner/"
    echo "  - Or use: brew install bfg (on macOS)"
    exit 1
fi

# Create secrets file with known leaked keys
echo "📝 Creating secrets file..."
cat > secrets.txt << 'EOF'
AIzaSyA0c40zoJGzs-Eaq5Pn5a80KRDMsyU5d9k
69z56nx86o9g7ut24iwuzq5p1ik9rek8v61ggigg
29e794ca05b243e559caf94c5a638d02
YOUR_OPENCAGE_API_KEY_HERE
your-api-key-here
EOF

echo "✅ Secrets file created with known leaked keys"

# Create a fresh mirror clone
echo "🔄 Creating fresh mirror clone..."
if [ -d "rai-ai-mobile.git" ]; then
    rm -rf rai-ai-mobile.git
fi

git clone --mirror https://github.com/bovornv/rai-ai-mobile.git
cd rai-ai-mobile.git

echo "🧹 Running BFG to remove secrets..."
bfg --replace-text ../secrets.txt

echo "🧽 Cleaning up repository..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "🚀 Force pushing cleaned repository..."
git push --force

echo "✅ Secret purge completed!"
echo ""
echo "⚠️  IMPORTANT: All collaborators must re-clone the repository:"
echo "   git clone https://github.com/bovornv/rai-ai-mobile.git"
echo ""
echo "🧹 Cleaning up temporary files..."
cd ..
rm -rf rai-ai-mobile.git
rm -f secrets.txt

echo "🎉 Done! Repository has been cleaned of secrets."

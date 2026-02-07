#!/bin/bash
# Deploy UAT to Production
# This script merges uat into production and deploys to production

echo "=== Deploy UAT to Production ==="

# Confirmation
echo ""
echo "⚠️  This will deploy UAT changes to PRODUCTION!"
read -p "Have you tested everything in UAT? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled"
    exit 0
fi

# Switch to production
echo ""
echo "Switching to production branch..."
git checkout production
if [ $? -ne 0 ]; then
    echo "❌ Error switching to production"
    exit 1
fi

# Update production
echo "Updating production branch..."
git pull origin production
if [ $? -ne 0 ]; then
    echo "❌ Error pulling production"
    exit 1
fi

# Merge uat into production
echo ""
echo "Merging uat into production..."
git merge uat --no-ff -m "Merge uat into production for production release"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Merge conflict detected!"
    echo "Please resolve conflicts and try again"
    exit 1
fi

# Check IS_PRODUCTION flag
echo ""
echo "⚠️  IMPORTANT: Check IS_PRODUCTION flag..."
echo "Opening environments.ts..."
code "src/lib/firebase/config/environments.ts" 2>/dev/null || open "src/lib/firebase/config/environments.ts" 2>/dev/null || echo "Please open src/lib/firebase/config/environments.ts manually"

echo ""
read -p "Is IS_PRODUCTION set to true? (yes/no): " flagCheck

if [ "$flagCheck" != "yes" ]; then
    echo ""
    echo "❌ Please set IS_PRODUCTION = true in environments.ts"
    echo "Then run: git add . && git commit -m 'Set production flag'"
    echo "And run this script again"
    exit 1
fi

# Save current Git config
originalName=$(git config user.name)
originalEmail=$(git config user.email)

# Change to WEBSTUDIOCSE author
echo ""
echo "Changing author to WEBSTUDIOCSE..."
git config user.name "WEBSTUDIOCSE"
git config user.email "saurabhjadhav.webstudio@gmail.com"

# Amend last commit with new author
git commit --amend --reset-author --no-edit

# Push to production
echo ""
echo "Deploying to production..."
git push origin production --force

if [ $? -ne 0 ]; then
    echo "❌ Error pushing to production"
    git config user.name "$originalName"
    git config user.email "$originalEmail"
    exit 1
fi

# Restore original Git config
git config user.name "$originalName"
git config user.email "$originalEmail"

echo ""
echo "=== Complete! ==="
echo "✅ Successfully deployed to PRODUCTION! 🚀"
echo ""
echo "Production URL: https://www.elitemindsetforge.com"
echo "GitHub Actions will complete the deployment"

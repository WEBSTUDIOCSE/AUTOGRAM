#!/bin/bash
# Deploy UAT to Production (Vercel)
# This script merges uat into main and pushes (Vercel auto-deploys)

echo "=== Deploy UAT to Production ==="

# Switch to main
echo ""
echo "Switching to main branch..."
git checkout main
if [ $? -ne 0 ]; then
    echo "❌ Error switching to main"
    exit 1
fi

# Update main
echo "Updating main branch..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "❌ Error pulling main"
    exit 1
fi

# Merge uat into main
echo ""
echo "Merging uat into main..."
git merge uat --no-ff -m "Merge uat into main for production release"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Merge conflict detected!"
    echo "Please resolve conflicts and try again"
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

# Push to main (Vercel auto-deploys)
echo ""
echo "Pushing to main..."
git push origin main --force

if [ $? -ne 0 ]; then
    echo "❌ Error pushing to main"
    git config user.name "$originalName"
    git config user.email "$originalEmail"
    exit 1
fi

# Restore original Git config
git config user.name "$originalName"
git config user.email "$originalEmail"

echo ""
echo "=== Complete! ==="
echo "✅ Successfully pushed to main branch! 🚀"
echo ""
echo "Production URL: https://www.autograminsta.online"
echo "Vercel is now deploying... Check Vercel dashboard for status"

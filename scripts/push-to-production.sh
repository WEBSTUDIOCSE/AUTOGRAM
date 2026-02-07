#!/bin/bash
# Push to Production
# Quick script to push changes to production branch for deployment

echo "=== Push to Production ==="

# Get current branch
currentBranch=$(git branch --show-current)

if [ "$currentBranch" != "production" ]; then
    echo "❌ Error: You're on '$currentBranch' branch, not 'production'"
    echo "Switch to production branch first: git checkout production"
    exit 1
fi

# Confirmation
echo ""
echo "⚠️  This will push to PRODUCTION!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled"
    exit 0
fi

# Check for uncommitted changes
status=$(git status --porcelain)
if [ -n "$status" ]; then
    echo ""
    echo "⚠️  Uncommitted changes detected:"
    git status --short
    read -p "Commit changes now? (y/n): " commit
    
    if [ "$commit" = "y" ]; then
        read -p "Enter commit message: " message
        git add .
        git commit -m "$message"
    else
        echo "Please commit changes first"
        exit 1
    fi
fi

# Check IS_PRODUCTION flag
echo ""
read -p "Confirmed IS_PRODUCTION = true in environments.ts? (yes/no): " flagCheck

if [ "$flagCheck" != "yes" ]; then
    echo "❌ Please verify IS_PRODUCTION flag first"
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

# Push
echo ""
echo "Pushing to production..."
git push origin production --force

if [ $? -eq 0 ]; then
    # Restore original Git config
    git config user.name "$originalName"
    git config user.email "$originalEmail"
    
    echo ""
    echo "=== Complete! ==="
    echo "✅ Pushed to production successfully! 🚀"
    echo ""
    echo "Production URL: https://www.elitemindsetforge.com"
    echo "GitHub Actions will complete the deployment"
else
    # Restore original Git config
    git config user.name "$originalName"
    git config user.email "$originalEmail"
    
    echo "❌ Error pushing to remote"
    exit 1
fi

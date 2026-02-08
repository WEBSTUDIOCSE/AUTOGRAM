#!/bin/bash
# Push to UAT
# Quick script to push changes to uat branch for deployment

echo "=== Push to UAT ==="

# Get current branch
currentBranch=$(git branch --show-current)

if [ "$currentBranch" != "uat" ]; then
    echo "⚠️  Warning: You're on '$currentBranch' branch, not 'uat'"
    read -p "Continue pushing to current branch? (y/n): " response
    
    if [ "$response" != "y" ]; then
        echo "Cancelled"
        exit 0
    fi
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

# Push to uat (Vercel auto-deploys)
echo ""
echo "Pushing to $currentBranch..."
git push origin "$currentBranch"

if [ $? -eq 0 ]; then
    echo ""
    echo "=== Complete! ==="
    echo "✅ Pushed to $currentBranch successfully!"
    if [ "$currentBranch" = "uat" ]; then
        echo "Vercel is now deploying to UAT preview..."
        echo "Check Vercel dashboard for deployment status"
    fi
else
    echo "❌ Error pushing to remote"
    exit 1
fi

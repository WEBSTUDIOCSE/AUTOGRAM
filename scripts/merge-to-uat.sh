#!/bin/bash
# Merge Feature to UAT (Vercel)
# This script merges your current feature branch to uat

echo "=== Merge Feature to UAT ==="

# Get current branch
featureBranch=$(git branch --show-current)

# Check if on a feature branch
if [ "$featureBranch" = "uat" ] || [ "$featureBranch" = "main" ]; then
    echo "❌ Error: You're on $featureBranch branch. Switch to a feature branch first."
    exit 1
fi

echo "Current branch: $featureBranch"

# Ensure all changes are committed
status=$(git status --porcelain)
if [ -n "$status" ]; then
    echo ""
    echo "⚠️  Uncommitted changes detected:"
    git status --short
    read -p "Do you want to commit them now? (y/n): " response
    
    if [ "$response" = "y" ]; then
        read -p "Enter commit message: " message
        git add .
        git commit -m "$message"
        if [ $? -ne 0 ]; then
            echo "❌ Error committing changes"
            exit 1
        fi
    else
        echo "Please commit your changes first"
        exit 1
    fi
fi

# Push feature branch
echo ""
echo "Pushing $featureBranch to remote..."
git push origin "$featureBranch"

# Switch to uat
echo ""
echo "Switching to uat branch..."
git checkout uat
if [ $? -ne 0 ]; then
    echo "❌ Error switching to uat"
    exit 1
fi

# Update uat
echo "Updating uat branch..."
git pull origin uat
if [ $? -ne 0 ]; then
    echo "❌ Error pulling uat"
    exit 1
fi

# Merge feature into uat
echo ""
echo "Merging $featureBranch into uat..."
git merge "$featureBranch" --no-ff -m "Merge $featureBranch into uat"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Merge conflict detected!"
    echo "Please resolve conflicts manually:"
    echo "1. Open conflicted files in VS Code"
    echo "2. Resolve conflicts"
    echo "3. git add ."
    echo "4. git commit -m 'Resolve merge conflicts'"
    echo "5. Run this script again"
    exit 1
fi

# Push to uat (Vercel auto-deploys)
echo ""
echo "Pushing to uat..."
git push origin uat

echo ""
echo "=== Complete! ==="
echo "✅ Feature merged to uat successfully!"
echo ""
echo "Next steps:"
echo "1. Check Vercel dashboard for UAT preview deployment"
echo "2. Test in UAT environment"
echo "3. When ready, run: ./scripts/deploy-to-production.sh"

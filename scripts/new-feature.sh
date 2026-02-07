#!/bin/bash
# Create New Feature Branch
# This script helps you create a new feature branch from uat (main branch)

echo "=== Create New Feature Branch ==="

# Get current branch
currentBranch=$(git branch --show-current)

# Switch to uat (main) and update
echo "Switching to uat (main) branch and updating..."
git checkout uat
if [ $? -ne 0 ]; then
    echo "❌ Error switching to uat branch"
    exit 1
fi

git pull origin uat
if [ $? -ne 0 ]; then
    echo "❌ Error pulling latest changes"
    exit 1
fi

# Get feature name from user
echo ""
echo "Feature branch naming:"
echo "  - Features: feature/description (e.g., feature/add-payment)"
echo "  - Bug fixes: fix/description (e.g., fix/login-bug)"
echo "  - Hotfixes: hotfix/description (e.g., hotfix/security-patch)"

echo ""
read -p "Enter branch name: " featureName

if [ -z "$featureName" ]; then
    echo "❌ Error: Branch name cannot be empty"
    exit 1
fi

# Create and switch to new branch
echo ""
echo "Creating branch: $featureName"
git checkout -b "$featureName"

if [ $? -ne 0 ]; then
    echo "❌ Error creating branch"
    exit 1
fi

echo ""
echo "=== Complete! ==="
echo "✅ Created and switched to branch: $featureName"
echo ""
echo "Next steps:"
echo "1. Make your changes"
echo "2. git add ."
echo "3. git commit -m 'Your message'"
echo "4. ./scripts/merge-to-uat.sh"

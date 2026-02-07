#!/bin/bash

# Automated Firestore Indexes Setup
# Installs Firebase CLI (if needed) and deploys all indexes to production

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_ID="${1:-production}"

echo "🔥 Firestore Indexes Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found"
    echo ""
    echo "Installing Firebase CLI globally..."
    npm install -g firebase-tools
    echo ""
fi

# Check if user is authenticated
if ! firebase projects:list &> /dev/null 2>&1; then
    echo "⚠️  You need to authenticate with Firebase"
    echo ""
    echo "Running: firebase login"
    firebase login
    echo ""
fi

# Get the actual project ID from .firebaserc if using 'production' alias
if [ "$PROJECT_ID" = "production" ]; then
    if [ -f "$ROOT_DIR/.firebaserc" ]; then
        ACTUAL_PROJECT_ID=$(grep -A 2 '"production"' "$ROOT_DIR/.firebaserc" | grep -oP ':\s*"\K[^"]+' | head -1 || echo "")
        if [ -n "$ACTUAL_PROJECT_ID" ]; then
            PROJECT_ID="$ACTUAL_PROJECT_ID"
            echo "📋 Using production project: $PROJECT_ID"
        fi
    fi
fi

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "production" ]; then
    echo "❌ Could not determine project ID"
    echo "Usage: $0 [project-id]"
    echo "Example: $0 autogram-14ddc"
    exit 1
fi

echo ""
echo "🚀 Deploying indexes to: $PROJECT_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$ROOT_DIR"

# Set the project
firebase use "$PROJECT_ID" --add || firebase use "$PROJECT_ID"

# Deploy indexes
firebase deploy --only firestore:indexes

echo ""
echo "✅ Firestore indexes deployed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 View your indexes:"
echo "   https://console.firebase.google.com/project/$PROJECT_ID/firestore/indexes"
echo ""

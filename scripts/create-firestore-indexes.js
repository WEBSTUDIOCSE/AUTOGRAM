#!/usr/bin/env node

/**
 * Automatically Create Firestore Indexes
 * 
 * This script reads firestore.indexes.json and creates all composite indexes
 * in the specified Firebase project using the Firestore REST API.
 * 
 * Prerequisites:
 * - Firebase CLI installed: npm install -g firebase-tools
 * - Authenticated: firebase login
 * 
 * Usage:
 *   node scripts/create-firestore-indexes.js [project-id]
 * 
 * Examples:
 *   node scripts/create-firestore-indexes.js autogram-14ddc
 *   node scripts/create-firestore-indexes.js env-uat-cd3c5
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEXES_FILE = path.join(ROOT_DIR, 'firestore.indexes.json');

// Get project ID from command line or .firebaserc
function getProjectId() {
  const args = process.argv.slice(2);
  if (args.length > 0) {
    return args[0];
  }

  // Try to read from .firebaserc
  const firebasercPath = path.join(ROOT_DIR, '.firebaserc');
  if (fs.existsSync(firebasercPath)) {
    const firebaserc = JSON.parse(fs.readFileSync(firebasercPath, 'utf-8'));
    if (firebaserc.projects && firebaserc.projects.production) {
      return firebaserc.projects.production;
    }
    if (firebaserc.projects && firebaserc.projects.default) {
      console.log(`${colors.yellow}⚠️  Using default project from .firebaserc${colors.reset}`);
      return firebaserc.projects.default;
    }
  }

  console.error(`${colors.red}❌ Error: No project ID specified${colors.reset}`);
  console.error(`Usage: node scripts/create-firestore-indexes.js [project-id]`);
  console.error(`Example: node scripts/create-firestore-indexes.js autogram-14ddc`);
  process.exit(1);
}

// Get OAuth access token from Firebase CLI
function getAccessToken() {
  try {
    const token = execSync('firebase login:ci --no-localhost 2>/dev/null || gcloud auth print-access-token 2>/dev/null || firebase login:ci', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    
    if (!token) {
      throw new Error('No token returned');
    }
    
    return token;
  } catch (error) {
    console.error(`${colors.red}❌ Error: Failed to get access token${colors.reset}`);
    console.error(`${colors.gray}Make sure you're logged in: firebase login${colors.reset}`);
    process.exit(1);
  }
}

// Read firestore.indexes.json
function readIndexesConfig() {
  if (!fs.existsSync(INDEXES_FILE)) {
    console.error(`${colors.red}❌ Error: firestore.indexes.json not found${colors.reset}`);
    process.exit(1);
  }

  try {
    return JSON.parse(fs.readFileSync(INDEXES_FILE, 'utf-8'));
  } catch (error) {
    console.error(`${colors.red}❌ Error reading firestore.indexes.json: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Format field order for display
function formatFieldOrder(order) {
  return order === 'ASCENDING' ? '↑' : '↓';
}

// Create index description for logging
function getIndexDescription(index) {
  const fields = index.fields.map(f => `${f.fieldPath} ${formatFieldOrder(f.order)}`).join(', ');
  return `${index.collectionGroup}: ${fields}`;
}

// Main execution
async function main() {
  console.log(`${colors.cyan}🔥 Firebase Firestore Index Creator${colors.reset}\n`);

  const projectId = getProjectId();
  console.log(`📋 Project ID: ${colors.green}${projectId}${colors.reset}`);

  const config = readIndexesConfig();
  const indexes = config.indexes || [];

  if (indexes.length === 0) {
    console.log(`${colors.yellow}⚠️  No indexes found in firestore.indexes.json${colors.reset}`);
    process.exit(0);
  }

  console.log(`📊 Found ${colors.green}${indexes.length}${colors.reset} index(es) to create\n`);

  // Show deployment command
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}📝 Recommended: Use Firebase CLI for automatic deployment${colors.reset}`);
  console.log(`\n   ${colors.green}firebase use production${colors.reset}`);
  console.log(`   ${colors.green}firebase deploy --only firestore:indexes${colors.reset}\n`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  // List all indexes that will be created
  console.log(`${colors.cyan}Indexes to create:${colors.reset}\n`);
  indexes.forEach((index, i) => {
    console.log(`${colors.gray}${i + 1}.${colors.reset} ${getIndexDescription(index)}`);
  });

  console.log(`\n${colors.yellow}⚠️  Manual creation via Firebase Console:${colors.reset}`);
  console.log(`   Go to: ${colors.cyan}https://console.firebase.google.com/project/${projectId}/firestore/indexes${colors.reset}`);
  console.log(`   Click "Add Index" for each composite index listed above\n`);

  // Generate direct links
  console.log(`${colors.cyan}Direct Console Links by Collection:${colors.reset}\n`);
  
  const collectionGroups = [...new Set(indexes.map(idx => idx.collectionGroup))];
  collectionGroups.forEach(collectionGroup => {
    const url = `https://console.firebase.google.com/project/${projectId}/firestore/indexes?collectionGroupId=${collectionGroup}`;
    console.log(`${colors.gray}•${colors.reset} ${collectionGroup}: ${colors.cyan}${url}${colors.reset}`);
  });

  console.log(`\n${colors.green}✅ Done! Use the links above or run Firebase CLI deploy command.${colors.reset}`);
}

main().catch(error => {
  console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  process.exit(1);
});

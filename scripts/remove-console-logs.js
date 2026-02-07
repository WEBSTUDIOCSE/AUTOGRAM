#!/usr/bin/env node

/**
 * Remove Console Logs Script
 * Removes all console.log, console.warn, console.error, console.debug, console.info
 * statements from TypeScript/TSX files in src/ and functions/ directories.
 * 
 * Handles:
 * - Single-line: console.log("message");
 * - Multi-line: console.log(\n  "message",\n  variable\n);
 * - Template literals: console.log(`value: ${x}`);
 * - Chained/nested parentheses: console.log(obj.method(arg));
 * - With/without semicolons
 * - Preserves non-console code on the same line
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const TARGET_DIRS = ['src', 'functions/src'];
const FILE_EXTENSIONS = ['.ts', '.tsx'];

// Track statistics
let totalFiles = 0;
let modifiedFiles = 0;
let totalRemoved = 0;
const modifiedFilesList = [];

/**
 * Recursively find all files with target extensions
 */
function findFiles(dir, extensions) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      results.push(...findFiles(fullPath, extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Remove console statements from file content.
 * Uses a character-by-character parser to handle nested parentheses and multi-line statements.
 */
function removeConsoleStatements(content) {
  const consolePattern = /console\.(log|warn|error|debug|info)\s*\(/g;
  let result = '';
  let lastIndex = 0;
  let removedCount = 0;
  let match;

  while ((match = consolePattern.exec(content)) !== null) {
    const startIndex = match.index;

    // Check if this is inside a string or comment — simple heuristic:
    // Look backwards to see if we're in a comment line
    const lineStart = content.lastIndexOf('\n', startIndex) + 1;
    const beforeOnLine = content.substring(lineStart, startIndex).trimStart();
    if (beforeOnLine.startsWith('//') || beforeOnLine.startsWith('*')) {
      continue; // Skip comments
    }

    // Find the matching closing parenthesis
    const parenStart = startIndex + match[0].length - 1; // Position of '('
    let depth = 1;
    let i = parenStart + 1;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inTemplateLiteral = false;
    let escaped = false;

    while (i < content.length && depth > 0) {
      const char = content[i];

      if (escaped) {
        escaped = false;
        i++;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        i++;
        continue;
      }

      if (!inDoubleQuote && !inTemplateLiteral && char === "'") {
        inSingleQuote = !inSingleQuote;
      } else if (!inSingleQuote && !inTemplateLiteral && char === '"') {
        inDoubleQuote = !inDoubleQuote;
      } else if (!inSingleQuote && !inDoubleQuote && char === '`') {
        inTemplateLiteral = !inTemplateLiteral;
      } else if (!inSingleQuote && !inDoubleQuote && !inTemplateLiteral) {
        if (char === '(') depth++;
        else if (char === ')') depth--;
      }

      i++;
    }

    if (depth !== 0) {
      // Unmatched parenthesis — skip this match
      continue;
    }

    // i is now just past the closing ')'
    let endIndex = i;

    // Skip optional semicolon after closing paren
    if (endIndex < content.length && content[endIndex] === ';') {
      endIndex++;
    }

    // Check if the entire line is just this console statement (with whitespace)
    const lineEnd = content.indexOf('\n', endIndex);
    const actualLineEnd = lineEnd === -1 ? content.length : lineEnd;
    const afterStatement = content.substring(endIndex, actualLineEnd).trim();
    const beforeStatement = content.substring(lineStart, startIndex).trim();

    // Copy everything before this console statement
    if (beforeStatement === '' && afterStatement === '') {
      // The entire line(s) is just the console statement — remove the whole line including newline
      result += content.substring(lastIndex, lineStart);
      lastIndex = actualLineEnd + 1; // Skip past the newline
    } else if (beforeStatement === '') {
      // Console is at beginning but there's code after — just remove the console part
      result += content.substring(lastIndex, lineStart);
      lastIndex = endIndex;
      // Remove trailing whitespace/newline if the line becomes empty-ish
      while (lastIndex < content.length && (content[lastIndex] === ' ' || content[lastIndex] === '\t')) {
        lastIndex++;
      }
    } else {
      // There's code before — just remove the console part
      result += content.substring(lastIndex, startIndex);
      lastIndex = endIndex;
    }

    removedCount++;
  }

  // Append remaining content
  result += content.substring(lastIndex);

  // Clean up: remove blank lines that were left behind (3+ consecutive newlines → 2)
  result = result.replace(/\n{3,}/g, '\n\n');

  return { result, removedCount };
}

// Main execution
console.log('🔍 Scanning for console statements...\n');

for (const targetDir of TARGET_DIRS) {
  const fullDir = path.join(ROOT_DIR, targetDir);
  const files = findFiles(fullDir, FILE_EXTENSIONS);

  for (const filePath of files) {
    totalFiles++;
    const content = fs.readFileSync(filePath, 'utf-8');
    const { result, removedCount } = removeConsoleStatements(content);

    if (removedCount > 0) {
      fs.writeFileSync(filePath, result, 'utf-8');
      modifiedFiles++;
      totalRemoved += removedCount;
      const relativePath = path.relative(ROOT_DIR, filePath);
      modifiedFilesList.push({ path: relativePath, count: removedCount });
      console.log(`  ✅ ${relativePath} — removed ${removedCount} console statement(s)`);
    }
  }
}

console.log('\n' + '─'.repeat(60));
console.log(`📊 Summary:`);
console.log(`   Files scanned:    ${totalFiles}`);
console.log(`   Files modified:   ${modifiedFiles}`);
console.log(`   Statements removed: ${totalRemoved}`);
console.log('─'.repeat(60));

if (modifiedFilesList.length > 0) {
  console.log('\n📝 Modified files:');
  modifiedFilesList.forEach(f => console.log(`   ${f.path} (${f.count})`));
}

console.log('\n✨ Done!');

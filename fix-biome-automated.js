#!/usr/bin/env node
/**
 * Automated Biome Fix Script
 * Fixes common Biome linting issues programmatically
 */

const fs = require("node:fs");
const path = require("node:path");

const SRC_DIR = path.join(__dirname, "src");

// Statistics
const stats = {
  filesProcessed: 0,
  buttonsFixed: 0,
  anyTypesFixed: 0,
  unusedVarsFixed: 0,
};

/**
 * Find all TypeScript/TSX files recursively
 */
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !filePath.includes("node_modules")) {
      findFiles(filePath, fileList);
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Fix missing type="button" on buttons
 */
function fixButtonTypes(content) {
  let fixed = content;
  let count = 0;

  // Pattern: <button without type attribute (not inside a string)
  // Match buttons that don't have type= already
  const buttonPattern = /(<button\s+)(?!.*type=)([^>]*>)/g;

  fixed = fixed.replace(buttonPattern, (match, buttonTag, rest) => {
    // Skip if it's inside a comment or string
    if (match.includes("//") || match.includes("/*")) {
      return match;
    }

    // Check if it's a submit button (has form or submit in className/onClick)
    const isSubmit =
      rest.includes('type="submit"') ||
      rest.includes("type='submit'") ||
      (rest.includes("form") && !rest.includes("onClick"));

    if (!isSubmit) {
      count++;
      return `${buttonTag}type="button" ${rest}`;
    }

    return match;
  });

  stats.buttonsFixed += count;
  return fixed;
}

/**
 * Fix 'any' types - replace with 'unknown' in catch blocks
 */
function fixAnyTypes(content) {
  let fixed = content;
  let count = 0;

  // Pattern: catch (err: any) or catch (error: any)
  const anyPattern = /catch\s*\((\w+):\s*any\)/g;

  fixed = fixed.replace(anyPattern, (_match, varName) => {
    count++;
    return `catch (${varName}: unknown)`;
  });

  stats.anyTypesFixed += count;
  return fixed;
}

/**
 * Fix unused variables by prefixing with underscore
 * This is a simple heuristic - Biome will still need to verify
 */
function fixUnusedVariables(content) {
  const fixed = content;
  const _count = 0;

  // Pattern: const { var1, var2 } = ... where variables might be unused
  // This is tricky, so we'll be conservative and only fix obvious cases

  // Fix unused destructured variables that are clearly unused
  // Pattern: const { unusedVar } = ... where unusedVar is never referenced
  const _destructurePattern = /const\s+\{\s*([^}]+)\s*\}\s*=/g;

  // This is complex - we'll let Biome handle most of this
  // But we can fix simple cases like: const { search, key } = useLocation()
  // where search and key are unused

  return fixed;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    const originalContent = content;

    // Apply fixes
    content = fixButtonTypes(content);
    content = fixAnyTypes(content);
    content = fixUnusedVariables(content);

    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, "utf8");
      stats.filesProcessed++;
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log("🔍 Finding files...");
  const files = findFiles(SRC_DIR);
  console.log(`📁 Found ${files.length} files to process\n`);

  console.log("🔧 Applying automated fixes...\n");

  files.forEach((file) => {
    processFile(file);
  });

  console.log("\n✅ Automated fixes complete!");
  console.log(`\n📊 Statistics:`);
  console.log(`   Files processed: ${stats.filesProcessed}`);
  console.log(`   Buttons fixed: ${stats.buttonsFixed}`);
  console.log(`   'any' types fixed: ${stats.anyTypesFixed}`);
  console.log(`\n💡 Run 'npm run check:fix' to apply Biome's auto-fixes`);
}

if (require.main === module) {
  main();
}

module.exports = { fixButtonTypes, fixAnyTypes, processFile };

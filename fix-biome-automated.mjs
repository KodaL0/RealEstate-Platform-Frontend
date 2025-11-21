#!/usr/bin/env node
/**
 * Automated Biome Fix Script
 * Fixes common Biome linting issues programmatically
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, "src");

// Statistics
const stats = {
  filesProcessed: 0,
  buttonsFixed: 0,
  anyTypesFixed: 0,
  errors: [],
};

/**
 * Find all TypeScript/TSX files recursively
 */
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !filePath.includes("node_modules") && !filePath.includes(".git")) {
      findFiles(filePath, fileList);
    } else if (
      (file.endsWith(".tsx") || file.endsWith(".ts")) &&
      !file.includes(".test.") &&
      !file.includes(".spec.")
    ) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Fix missing type="button" on buttons
 */
function fixButtonTypes(content) {
  const _fixed = content;
  let count = 0;

  // More sophisticated pattern: find <button that doesn't have type attribute
  // We need to handle multi-line buttons carefully
  const lines = content.split("\n");
  const newLines = [];
  let inButtonTag = false;
  let _buttonStartLine = -1;
  let buttonContent = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line starts a button tag
    if (line.match(/^\s*<button\s/) && !line.includes("type=")) {
      // Check if button tag closes on same line
      if (line.includes(">")) {
        // Single line button
        if (!line.includes('type="submit"') && !line.includes("type='submit'")) {
          // Insert type="button" after <button
          const newLine = line.replace(/^((\s*)<button\s+)/, '$1type="button" ');
          newLines.push(newLine);
          count++;
        } else {
          newLines.push(line);
        }
      } else {
        // Multi-line button - collect until we find >
        inButtonTag = true;
        _buttonStartLine = i;
        buttonContent = line;
      }
    } else if (inButtonTag) {
      buttonContent += `\n${line}`;
      if (line.includes(">")) {
        // Button tag closes
        if (!buttonContent.includes("type=")) {
          // Insert type="button"
          const fixedContent = buttonContent.replace(/^((\s*)<button\s+)/, '$1type="button" ');
          newLines.push(...fixedContent.split("\n"));
          count++;
        } else {
          newLines.push(...buttonContent.split("\n"));
        }
        inButtonTag = false;
        buttonContent = "";
      }
    } else {
      newLines.push(line);
    }
  }

  stats.buttonsFixed += count;
  return newLines.join("\n");
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
 * Process a single file
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    const originalContent = content;

    // Apply fixes
    content = fixButtonTypes(content);
    content = fixAnyTypes(content);

    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, "utf8");
      stats.filesProcessed++;
      return true;
    }

    return false;
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
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

  files.forEach((file, index) => {
    if (processFile(file)) {
      const relativePath = path.relative(__dirname, file);
      console.log(`   ✓ Fixed: ${relativePath}`);
    }
    if ((index + 1) % 50 === 0) {
      console.log(`   Processed ${index + 1}/${files.length} files...`);
    }
  });

  console.log("\n✅ Automated fixes complete!");
  console.log(`\n📊 Statistics:`);
  console.log(`   Files processed: ${stats.filesProcessed}`);
  console.log(`   Buttons fixed: ${stats.buttonsFixed}`);
  console.log(`   'any' types fixed: ${stats.anyTypesFixed}`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors: ${stats.errors.length}`);
    stats.errors.forEach(({ file, error }) => {
      console.log(`   ${file}: ${error}`);
    });
  }

  console.log(`\n💡 Next: Run 'npm run check:fix' to apply Biome's auto-fixes`);
}

main();

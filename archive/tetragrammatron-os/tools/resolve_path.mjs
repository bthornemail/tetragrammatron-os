#!/usr/bin/env node
/**
 * resolve_path.mjs
 * Resolves logical path names to actual filesystem paths
 * 
 * Usage: node tools/resolve_path.mjs <logical.path>
 * Example: node tools/resolve_path.mjs services.viewer_react
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PATHS_CONFIG = path.join(ROOT, "descriptors/paths.yaml");

// Simple YAML parser for our specific use case (nested key: value pairs)
function parseYaml(content) {
  const result = {};
  const lines = content.split('\n');
  const stack = [{ obj: result, indent: -1 }];
  let inPaths = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    // Calculate indentation (spaces before first non-space)
    const indent = line.length - line.trimStart().length;
    
    // Pop stack until we're at the right level
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    
    const current = stack[stack.length - 1].obj;
    
    // Parse key: value
    const match = trimmed.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const key = match[1];
      let value = match[2].trim();
      
      // Skip version field
      if (key === 'version') continue;
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      if (value === '') {
        // Nested object - create it and push to stack
        current[key] = {};
        stack.push({ obj: current[key], indent: indent });
        if (key === 'paths') {
          inPaths = true;
        }
      } else {
        // Leaf value
        current[key] = value;
      }
    }
  }
  
  // Return with paths at top level
  return { paths: result.paths || {} };
}

function loadPathsConfig() {
  if (!fs.existsSync(PATHS_CONFIG)) {
    throw new Error(`Paths config not found: ${PATHS_CONFIG}`);
  }
  const content = fs.readFileSync(PATHS_CONFIG, "utf8");
  return parseYaml(content);
}

export function resolvePath(logicalPath) {
  const config = loadPathsConfig();
  const parts = logicalPath.split(".");
  
  let current = config.paths;
  for (const part of parts) {
    if (current[part] === undefined) {
      throw new Error(`Path not found: ${logicalPath} (failed at: ${part})`);
    }
    current = current[part];
  }
  
  if (typeof current !== "string") {
    throw new Error(`Path ${logicalPath} does not resolve to a string`);
  }
  
  return path.resolve(ROOT, current);
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const logicalPath = process.argv[2];
  if (!logicalPath) {
    console.error("Usage: resolve_path.mjs <logical.path>");
    console.error("Example: resolve_path.mjs services.viewer_react");
    process.exit(1);
  }
  try {
    const resolved = resolvePath(logicalPath);
    console.log(resolved);
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
}

#!/usr/bin/env node
/**
 * test_gen_indexes.mjs
 * Unit tests for gen_tree_indexes.mjs
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const INDEXER = path.join(ROOT, "tools/gen_tree_indexes.mjs");

function runTool(tool, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn("node", [tool, ...args], {
      cwd: ROOT,
      stdio: "pipe"
    });
    
    let stdout = "";
    let stderr = "";
    
    proc.stdout.on("data", (data) => { stdout += data.toString(); });
    proc.stderr.on("data", (data) => { stderr += data.toString(); });
    
    proc.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
    
    proc.on("error", reject);
  });
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    return true;
  } catch (e) {
    console.error(`✖ ${name}: ${e.message}`);
    return false;
  }
}

async function main() {
  let passed = 0;
  let failed = 0;

  // Test 1: Index generation produces valid JSON
  await test("index generation produces valid JSON", async () => {
    const testTrees = path.join(__dirname, "../tmp/test_trees");
    
    // Create test tree structure
    if (fs.existsSync(testTrees)) {
      fs.rmSync(testTrees, { recursive: true, force: true });
    }
    fs.mkdirSync(testTrees, { recursive: true });
    fs.mkdirSync(path.join(testTrees, "test-tree", "branches", "test-branch", "books", "test-book"), { recursive: true });
    
    // Create entries.jsonl
    fs.writeFileSync(
      path.join(testTrees, "test-tree", "branches", "test-branch", "books", "test-book", "entries.jsonl"),
      '{"t":"2025-01-01T00:00:00Z","k":"test.key","v":"test"}'
    );
    
    const result = await runTool(INDEXER, [testTrees]);
    if (result.code !== 0) {
      throw new Error(`Index generation failed: ${result.stderr}`);
    }
    
    // Verify index files exist and are valid JSON
    const rootIndex = path.join(testTrees, "index.json");
    if (!fs.existsSync(rootIndex)) {
      throw new Error("Root index.json not created");
    }
    
    const rootData = JSON.parse(fs.readFileSync(rootIndex, "utf8"));
    if (!rootData.trees || !Array.isArray(rootData.trees)) {
      throw new Error("Root index missing trees array");
    }
    
    // Verify tree index
    const treeIndex = path.join(testTrees, "test-tree", "index.json");
    if (!fs.existsSync(treeIndex)) {
      throw new Error("Tree index.json not created");
    }
    
    const treeData = JSON.parse(fs.readFileSync(treeIndex, "utf8"));
    if (!treeData.branches || !Array.isArray(treeData.branches)) {
      throw new Error("Tree index missing branches array");
    }
    
    // Verify branch index
    const branchIndex = path.join(testTrees, "test-tree", "branches", "test-branch", "index.json");
    if (!fs.existsSync(branchIndex)) {
      throw new Error("Branch index.json not created");
    }
    
    const branchData = JSON.parse(fs.readFileSync(branchIndex, "utf8"));
    if (!branchData.books || !Array.isArray(branchData.books)) {
      throw new Error("Branch index missing books array");
    }
    
    // Verify book index
    const bookIndex = path.join(testTrees, "test-tree", "branches", "test-branch", "books", "test-book", "index.json");
    if (!fs.existsSync(bookIndex)) {
      throw new Error("Book index.json not created");
    }
    
    const bookData = JSON.parse(fs.readFileSync(bookIndex, "utf8"));
    if (typeof bookData.has_entries !== "boolean") {
      throw new Error("Book index missing has_entries boolean");
    }
    
    if (!bookData.has_entries) {
      throw new Error("Book index should have has_entries=true when entries.jsonl exists");
    }
    
    passed++;
  });

  // Test 2: Idempotence
  await test("index generation is idempotent", async () => {
    const testTrees = path.join(__dirname, "../tmp/test_trees_idemp");
    
    if (fs.existsSync(testTrees)) {
      fs.rmSync(testTrees, { recursive: true, force: true });
    }
    fs.mkdirSync(testTrees, { recursive: true });
    fs.mkdirSync(path.join(testTrees, "tree1"), { recursive: true });
    
    // Run twice
    await runTool(INDEXER, [testTrees]);
    const index1 = fs.readFileSync(path.join(testTrees, "index.json"), "utf8");
    
    await runTool(INDEXER, [testTrees]);
    const index2 = fs.readFileSync(path.join(testTrees, "index.json"), "utf8");
    
    if (index1 !== index2) {
      throw new Error("Index generation is not idempotent");
    }
    
    passed++;
  });

  // Test 3: Deterministic ordering
  await test("index generation uses deterministic ordering", async () => {
    const testTrees = path.join(__dirname, "../tmp/test_trees_order");
    
    if (fs.existsSync(testTrees)) {
      fs.rmSync(testTrees, { recursive: true, force: true });
    }
    fs.mkdirSync(testTrees, { recursive: true });
    fs.mkdirSync(path.join(testTrees, "zebra"), { recursive: true });
    fs.mkdirSync(path.join(testTrees, "alpha"), { recursive: true });
    fs.mkdirSync(path.join(testTrees, "beta"), { recursive: true });
    
    await runTool(INDEXER, [testTrees]);
    const rootData = JSON.parse(fs.readFileSync(path.join(testTrees, "index.json"), "utf8"));
    
    // Should be sorted lexicographically
    const expected = ["alpha", "beta", "zebra"];
    if (JSON.stringify(rootData.trees) !== JSON.stringify(expected)) {
      throw new Error(`Expected sorted order ${expected}, got ${rootData.trees}`);
    }
    
    passed++;
  });

  console.log(`\nTests: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});



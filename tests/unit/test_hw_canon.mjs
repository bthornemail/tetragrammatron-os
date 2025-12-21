#!/usr/bin/env node
/**
 * test_hw_canon.mjs
 * Unit tests for hw_canon.mjs
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const CANONIZER = path.join(ROOT, "tools/hw_canon.mjs");

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

  // Test 1: Canonicalization produces valid JSON
  await test("canonicalization produces valid JSON", async () => {
    const input = path.join(__dirname, "../fixtures/valid_probe.jsonl");
    const output = path.join(__dirname, "../tmp/test_canon.json");
    
    // Ensure tmp directory exists
    const tmpDir = path.dirname(output);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    const result = await runTool(CANONIZER, [input, output]);
    if (result.code !== 0) {
      throw new Error(`Canonicalization failed: ${result.stderr}`);
    }
    
    // Verify output is valid JSON
    const content = fs.readFileSync(output, "utf8");
    const canon = JSON.parse(content);
    
    if (!canon.meta || !canon.fields) {
      throw new Error("Canonical record missing required structure");
    }
    
    // Verify quadrant tags exist
    const hasQuadrants = Object.values(canon.fields).every(f => f.q && ["KK", "KU", "UK", "UU"].includes(f.q));
    if (!hasQuadrants) {
      throw new Error("Some fields missing quadrant tags");
    }
    
    passed++;
  });

  // Test 2: Determinism - same input produces same output
  await test("canonicalization is deterministic", async () => {
    const input = path.join(__dirname, "../fixtures/valid_probe.jsonl");
    const output1 = path.join(__dirname, "../tmp/test_canon1.json");
    const output2 = path.join(__dirname, "../tmp/test_canon2.json");
    
    await runTool(CANONIZER, [input, output1]);
    await runTool(CANONIZER, [input, output2]);
    
    const content1 = fs.readFileSync(output1, "utf8");
    const content2 = fs.readFileSync(output2, "utf8");
    
    // Parse and compare (ignoring generated_at_utc)
    const canon1 = JSON.parse(content1);
    const canon2 = JSON.parse(content2);
    
    delete canon1.meta.generated_at_utc;
    delete canon2.meta.generated_at_utc;
    
    if (JSON.stringify(canon1) !== JSON.stringify(canon2)) {
      throw new Error("Canonicalization is not deterministic");
    }
    
    passed++;
  });

  // Test 3: Defaults are applied for missing fields
  await test("defaults applied for missing fields", async () => {
    const input = path.join(__dirname, "../fixtures/valid_probe.jsonl");
    const output = path.join(__dirname, "../tmp/test_canon_defaults.json");
    
    await runTool(CANONIZER, [input, output]);
    const canon = JSON.parse(fs.readFileSync(output, "utf8"));
    
    // Should have derived fields even if not in probe
    if (!canon.fields.word_bits) {
      throw new Error("word_bits should be derived from cpu.arch");
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


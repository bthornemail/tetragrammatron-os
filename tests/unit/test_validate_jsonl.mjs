#!/usr/bin/env node
/**
 * test_validate_jsonl.mjs
 * Unit tests for validate_jsonl.mjs
 */

import { spawn } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const VALIDATOR = path.join(ROOT, "tools/validate_jsonl.mjs");
const SCHEMA = path.join(ROOT, "schemas/hw_event.schema.json");

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

  // Test 1: Valid probe should pass
  await test("valid probe passes validation", async () => {
    const validProbe = path.join(__dirname, "../fixtures/valid_probe.jsonl");
    const result = await runTool(VALIDATOR, [validProbe, SCHEMA]);
    if (result.code !== 0) {
      throw new Error(`Expected exit code 0, got ${result.code}\n${result.stderr}`);
    }
    if (!result.stdout.includes("OK:")) {
      throw new Error(`Expected success message, got: ${result.stdout}`);
    }
    passed++;
  });

  // Test 2: Invalid probe should fail
  await test("invalid probe fails validation", async () => {
    const invalidProbe = path.join(__dirname, "../fixtures/invalid_probe.jsonl");
    const result = await runTool(VALIDATOR, [invalidProbe, SCHEMA]);
    if (result.code === 0) {
      throw new Error(`Expected non-zero exit code for invalid probe`);
    }
    passed++;
  });

  // Test 3: Missing file should fail
  await test("missing file fails gracefully", async () => {
    const result = await runTool(VALIDATOR, ["nonexistent.jsonl", SCHEMA]);
    if (result.code === 0) {
      throw new Error(`Expected non-zero exit code for missing file`);
    }
    passed++;
  });

  // Test 4: Missing schema should fail
  await test("missing schema fails gracefully", async () => {
    const validProbe = path.join(__dirname, "fixtures/valid_probe.jsonl");
    const result = await runTool(VALIDATOR, [validProbe, "nonexistent.schema.json"]);
    if (result.code === 0) {
      throw new Error(`Expected non-zero exit code for missing schema`);
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


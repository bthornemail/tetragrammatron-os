#!/usr/bin/env node
/**
 * test_hw_project.mjs
 * Unit tests for hw_project.mjs
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const PROJECTOR = path.join(ROOT, "tools/hw_project.mjs");

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

  // Test 1: Projection produces valid sphere record
  await test("projection produces valid sphere record", async () => {
    // First create a canonical record
    const canonInput = path.join(__dirname, "../fixtures/valid_probe.jsonl");
    const canonOutput = path.join(__dirname, "../tmp/test_canon_for_proj.json");
    const sphereOutput = path.join(__dirname, "../tmp/test_sphere.json");
    
    const tmpDir = path.dirname(canonOutput);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    // Generate canon first
    const canonProc = spawn("node", [
      path.join(ROOT, "tools/hw_canon.mjs"),
      canonInput,
      canonOutput
    ], { cwd: ROOT, stdio: "pipe" });
    await new Promise((resolve) => canonProc.on("close", resolve));
    
    // Now project
    const result = await runTool(PROJECTOR, [canonOutput, sphereOutput]);
    if (result.code !== 0) {
      throw new Error(`Projection failed: ${result.stderr}`);
    }
    
    // Verify output structure
    const sphere = JSON.parse(fs.readFileSync(sphereOutput, "utf8"));
    
    if (typeof sphere.pointer !== "number" || sphere.pointer < 0 || sphere.pointer > 7) {
      throw new Error("Pointer must be 0-7");
    }
    
    if (typeof sphere.admissible !== "boolean") {
      throw new Error("Admissible must be boolean");
    }
    
    // Verify admissibility rule: (p + 2) % 8 ≠ 0 (equiv p ≠ 6)
    if (sphere.pointer === 6 && sphere.admissible) {
      throw new Error("Pointer 6 should not be admissible");
    }
    
    if (sphere.pointer !== 6 && !sphere.admissible) {
      throw new Error(`Pointer ${sphere.pointer} should be admissible`);
    }
    
    passed++;
  });

  // Test 2: Determinism
  await test("projection is deterministic", async () => {
    const tmpDir = path.join(__dirname, "../tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    const canonInput = path.join(__dirname, "../fixtures/valid_probe.jsonl");
    const canonOutput = path.join(tmpDir, "test_canon_det.json");
    const sphere1 = path.join(tmpDir, "test_sphere1.json");
    const sphere2 = path.join(tmpDir, "test_sphere2.json");
    
    // Generate canon
    const canonProc = spawn("node", [
      path.join(ROOT, "tools/hw_canon.mjs"),
      canonInput,
      canonOutput
    ], { cwd: ROOT, stdio: "pipe" });
    await new Promise((resolve) => canonProc.on("close", resolve));
    
    // Project twice
    await runTool(PROJECTOR, [canonOutput, sphere1]);
    await runTool(PROJECTOR, [canonOutput, sphere2]);
    
    const s1 = JSON.parse(fs.readFileSync(sphere1, "utf8"));
    const s2 = JSON.parse(fs.readFileSync(sphere2, "utf8"));
    
    // Compare (ignoring generated_at_utc)
    delete s1.meta.generated_at_utc;
    delete s2.meta.generated_at_utc;
    
    if (JSON.stringify(s1) !== JSON.stringify(s2)) {
      throw new Error("Projection is not deterministic");
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


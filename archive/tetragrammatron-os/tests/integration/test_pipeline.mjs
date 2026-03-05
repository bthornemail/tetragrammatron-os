#!/usr/bin/env node
/**
 * test_pipeline.mjs
 * End-to-end pipeline test: probe → canon → sphere
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

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

  const tmpDir = path.join(__dirname, "../tmp");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  // Test: Full pipeline
  await test("full pipeline: probe → canon → sphere", async () => {
    const probe = path.join(__dirname, "../fixtures/valid_probe.jsonl");
    const canon = path.join(tmpDir, "pipeline_canon.json");
    const sphere = path.join(tmpDir, "pipeline_sphere.json");
    const schema = path.join(ROOT, "schemas/hw_event.schema.json");

    // Step 1: Validate probe
    const validateResult = await runTool(
      path.join(ROOT, "tools/validate_jsonl.mjs"),
      [probe, schema]
    );
    if (validateResult.code !== 0) {
      throw new Error(`Validation failed: ${validateResult.stderr}`);
    }

    // Step 2: Canonicalize
    const canonResult = await runTool(
      path.join(ROOT, "tools/hw_canon.mjs"),
      [probe, canon]
    );
    if (canonResult.code !== 0) {
      throw new Error(`Canonicalization failed: ${canonResult.stderr}`);
    }

    // Step 3: Project
    const projectResult = await runTool(
      path.join(ROOT, "tools/hw_project.mjs"),
      [canon, sphere]
    );
    if (projectResult.code !== 0) {
      throw new Error(`Projection failed: ${projectResult.stderr}`);
    }

    // Verify outputs
    const canonData = JSON.parse(fs.readFileSync(canon, "utf8"));
    const sphereData = JSON.parse(fs.readFileSync(sphere, "utf8"));

    if (!canonData.meta || !canonData.fields) {
      throw new Error("Invalid canonical structure");
    }

    if (typeof sphereData.pointer !== "number" || typeof sphereData.admissible !== "boolean") {
      throw new Error("Invalid sphere structure");
    }

    // Verify admissibility
    if (sphereData.pointer === 6 && sphereData.admissible) {
      throw new Error("Pointer 6 should not be admissible");
    }

    passed++;
  });

  // Test: Pipeline preserves data integrity
  await test("pipeline preserves data integrity", async () => {
    const probe = path.join(__dirname, "../fixtures/valid_probe.jsonl");
    const canon = path.join(tmpDir, "integrity_canon.json");
    const sphere = path.join(tmpDir, "integrity_sphere.json");

    // Run pipeline
    await runTool(path.join(ROOT, "tools/hw_canon.mjs"), [probe, canon]);
    await runTool(path.join(ROOT, "tools/hw_project.mjs"), [canon, sphere]);

    // Verify probe data is preserved in canon
    const probeData = fs.readFileSync(probe, "utf8").split("\n")
      .filter(l => l.trim() && !l.startsWith("#"))
      .map(l => JSON.parse(l));

    const canonData = JSON.parse(fs.readFileSync(canon, "utf8"));

    // Check that observed values are preserved
    for (const event of probeData) {
      if (event.k && canonData.fields[event.k]) {
        const field = canonData.fields[event.k];
        if (field.q === "KK" && field.v !== event.v) {
          throw new Error(`Value mismatch for ${event.k}: ${field.v} !== ${event.v}`);
        }
      }
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


#!/usr/bin/env node
/**
 * run_all.mjs
 * Run all test suites
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const TEST_SUITES = [
  "tests/unit/test_validate_jsonl.mjs",
  "tests/unit/test_hw_canon.mjs",
  "tests/unit/test_hw_project.mjs",
  "tests/integration/test_pipeline.mjs"
];

function runTest(testPath) {
  return new Promise((resolve) => {
    const proc = spawn("node", [testPath], {
      cwd: ROOT,
      stdio: "inherit"
    });
    
    proc.on("close", (code) => {
      resolve(code === 0);
    });
  });
}

async function main() {
  console.log("Running test suites...\n");
  
  let passed = 0;
  let failed = 0;

  for (const suite of TEST_SUITES) {
    console.log(`\n--- ${suite} ---`);
    const success = await runTest(suite);
    if (success) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log(`\n\nSummary: ${passed} suites passed, ${failed} suites failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});




#!/usr/bin/env node
/**
 * test_canisa_toolchain.mjs
 * Validates the CanISA toolchain CLI by assembling, running, and reducing a sample program.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const CLI = path.join(ROOT, "tools/canbc/cli.mjs");
const SAMPLE = path.join(ROOT, "tests/fixtures/canisa/sample.canisa");
const TMP = path.join(ROOT, "tests/tmp/canisa_toolchain");
const ADDR = "1A:04:9F:22:80:03:11:C7";

function runCli(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn("node", [CLI, ...args], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });

    proc.on("close", (code) => resolve({ code, stdout, stderr }));
    proc.on("error", reject);
  });
}

function ensureTmp() {
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(TMP, { recursive: true });
}

function readJsonl(file) {
  return fs
    .readFileSync(file, "utf8")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function testCanisaToolchain() {
  ensureTmp();
  const outProgram = path.join(TMP, "program.canbc");
  const tracePath = path.join(TMP, "trace.jsonl");
  const statePath = path.join(TMP, "state.json");

  const build = await runCli(["build", "--addr", ADDR, "--in", SAMPLE, "--out", outProgram]);
  if (build.code !== 0) {
    throw new Error(`assembly failed: ${build.stderr}`);
  }
  if (!fs.existsSync(outProgram)) {
    throw new Error("program.canbc not created");
  }

  const run = await runCli(["run", "--in", outProgram, "--out", tracePath]);
  if (run.code !== 0) {
    throw new Error(`execution failed: ${run.stderr}`);
  }
  if (!fs.existsSync(tracePath)) {
    throw new Error("trace.jsonl not created");
  }

  const events = readJsonl(tracePath);
  if (events.length < 3) {
    throw new Error("expected at least 3 events in trace");
  }

  const addrBytesEvent = events.find((e) => e.k === "addr.bytes");
  if (!addrBytesEvent) {
    throw new Error("addr.bytes event missing");
  }
  if (!Array.isArray(addrBytesEvent.v) || addrBytesEvent.v.length !== 8) {
    throw new Error("addr.bytes event malformed");
  }

  const residueEvent = events.find((e) => e.k === "addr.r2.mod8");
  if (!residueEvent || residueEvent.v !== 7) {
    throw new Error("addr.r2.mod8 event missing or incorrect");
  }

  const state = await runCli(["state", "--events", tracePath, "--out", statePath]);
  if (state.code !== 0) {
    throw new Error(`state reducer failed: ${state.stderr}`);
  }
  const snapshot = JSON.parse(fs.readFileSync(statePath, "utf8"));
  if (snapshot.addr !== ADDR) {
    throw new Error("state addr mismatch");
  }
  if (!snapshot.kv || snapshot.kv["addr.r2.mod8"] !== 7) {
    throw new Error("state snapshot missing addr.r2.mod8 key");
  }
  if (!Array.isArray(snapshot.kv["addr.bytes"]) || snapshot.kv["addr.bytes"].length !== 8) {
    throw new Error("state snapshot missing addr.bytes vector");
  }
}

async function main() {
  try {
    await testCanisaToolchain();
    console.log("✓ CanISA toolchain CLI");
  } catch (err) {
    console.error(`✖ CanISA toolchain CLI: ${err.message}`);
    process.exit(1);
  }
}

main();

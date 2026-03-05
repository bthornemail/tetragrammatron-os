#!/usr/bin/env node
/**
 * validate_jsonl.mjs
 * Minimal JSONL validator for ULP probe events.
 *
 * - No dependencies
 * - Strict JSON parsing
 * - Validates required keys + formats + key pattern
 * - Prints line numbers and exits non-zero on error
 */

import fs from "node:fs";
import readline from "node:readline";

function die(msg, code = 2) {
  console.error(msg);
  process.exit(code);
}

function loadSchema(path) {
  try {
    return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch (e) {
    die(`Failed to read schema at ${path}: ${e.message}`);
  }
}

function isRFC3339Z(s) {
  return typeof s === "string" && /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$/.test(s);
}

function isKey(s) {
  return typeof s === "string" && /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(s);
}

function isJsonValue(v) {
  // JSON.parse already ensures it is a JSON value;
  // we just disallow undefined (shouldn't happen) and functions.
  return v !== undefined && typeof v !== "function";
}

function validateEvent(obj) {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return "event must be an object";
  }

  // additionalProperties: false for the base contract (tight)
  const allowed = new Set(["t", "k", "v", "src", "q"]);
  for (const k of Object.keys(obj)) {
    if (!allowed.has(k)) return `unexpected key "${k}" (additionalProperties=false)`;
  }

  if (!("t" in obj) || !("k" in obj) || !("v" in obj)) {
    return "missing required field: t, k, or v";
  }

  if (!isRFC3339Z(obj.t)) {
    return `field "t" must be RFC3339 UTC timestamp (YYYY-MM-DDTHH:MM:SSZ)`;
  }

  if (!isKey(obj.k)) {
    return `field "k" must match pattern: ^[a-z][a-z0-9_]*(\\.[a-z][a-z0-9_]*)+$`;
  }

  if (!isJsonValue(obj.v)) {
    return `field "v" must be a valid JSON value`;
  }

  if ("src" in obj && (typeof obj.src !== "string" || obj.src.length > 128)) {
    return `field "src" must be a string with maxLength 128`;
  }

  if ("q" in obj && !["KK", "KU", "UK", "UU"].includes(obj.q)) {
    return `field "q" must be one of: KK, KU, UK, UU`;
  }

  return null;
}

async function main() {
  const [jsonlPath, schemaPath] = process.argv.slice(2);

  if (!jsonlPath || !schemaPath) {
    die(`Usage: validate_jsonl.mjs <probe.jsonl> <hw_event.schema.json>`);
  }

  // Load schema only so we can show it's bound to a file.
  // (We do not implement full JSON Schema; we enforce the exact constraints we care about.)
  loadSchema(schemaPath);

  const input = fs.createReadStream(jsonlPath, { encoding: "utf8" });
  const rl = readline.createInterface({ input, crlfDelay: Infinity });

  let lineNo = 0;
  let okCount = 0;

  for await (const line of rl) {
    lineNo++;
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;

    let obj;
    try {
      obj = JSON.parse(s);
    } catch (e) {
      die(`❌ JSON parse error at line ${lineNo}: ${e.message}
> ${s}`);
    }

    const err = validateEvent(obj);
    if (err) {
      die(`❌ Schema violation at line ${lineNo}: ${err}
> ${s}`);
    }

    okCount++;
  }

  console.log(`✅ OK: ${okCount} events valid in ${jsonlPath}`);
}

main().catch((e) => die(`Fatal: ${e.message}`));












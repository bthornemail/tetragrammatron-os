#!/usr/bin/env node
/**
 * hw_project.mjs
 *
 * Projection script: canonical record → sphere projection
 * Applies mod 8 operator and checks admissibility.
 */

import fs from "node:fs";

function die(msg, code = 2) {
  console.error(msg);
  process.exit(code);
}

function loadCanon(path) {
  try {
    return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch (e) {
    die(`Failed to read canonical record at ${path}: ${e.message}`);
  }
}

function computePointer(canon) {
  // Fold/land operation: combine hardware parameters into a single value
  // For simplicity, we'll use a hash-like combination of key fields
  let hash = 0;
  const fields = canon.fields || {};

  // Combine relevant hardware parameters
  const keys = ["word_bits", "cpu.cores", "mem.total_bytes", "cpu.arch", "cpu.endian"];
  for (const key of keys) {
    const field = fields[key];
    if (field && field.v !== null && field.v !== undefined) {
      const val = typeof field.v === "string" 
        ? field.v.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
        : Number(field.v);
      hash = ((hash << 5) - hash) + val;
      hash = hash & hash; // Convert to 32-bit integer
    }
  }

  // Apply mod 8 to get residue
  const pointer = Math.abs(hash) % 8;
  return pointer;
}

function isAdmissible(pointer) {
  // Admissibility rule: (p + 2) % 8 ≠ 0 (equiv p ≠ 6)
  return (pointer + 2) % 8 !== 0;
}

function project(canon) {
  const pointer = computePointer(canon);
  const admissible = isAdmissible(pointer);

  if (!admissible) {
    die(`❌ Pointer ${pointer} is not admissible (p ≠ 6 required)`);
  }

  // Extract VM state from canonical fields
  const vmState = {
    word_bits: canon.fields.word_bits?.v || 64,
    addr_bits: canon.fields.addr_bits?.v || canon.fields.word_bits?.v || 64,
    endian: canon.fields["cpu.endian"]?.v || "little",
    pointer,
    residue_class: pointer
  };

  return {
    meta: {
      schema_version: "1.0",
      generated_at_utc: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
      source: "canon.json"
    },
    pointer,
    admissible,
    vm_state: vmState
  };
}

function main() {
  const [canonPath, outputPath] = process.argv.slice(2);

  if (!canonPath) {
    die(`Usage: hw_project.mjs <canon.json> [sphere.json]`);
  }

  const canon = loadCanon(canonPath);
  const sphere = project(canon);

  const json = JSON.stringify(sphere, null, 2) + "\n";

  if (outputPath) {
    fs.writeFileSync(outputPath, json);
    console.log(`✅ Wrote sphere projection to ${outputPath}`);
    console.log(`   Pointer: ${sphere.pointer}, Admissible: ${sphere.admissible}`);
  } else {
    process.stdout.write(json);
  }
}

main();


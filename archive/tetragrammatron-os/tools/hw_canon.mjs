#!/usr/bin/env node
/**
 * hw_canon.mjs
 *
 * Canonicalization script: JSONL probe events → canonical record
 * with quadrant-tagged values and deterministic defaults.
 */

import fs from "node:fs";
import readline from "node:readline";

function die(msg, code = 2) {
  console.error(msg);
  process.exit(code);
}

function qvalue(q, v, defaulted = false, evidence = []) {
  return { q, v, defaulted, evidence };
}

function kk(v, evidence = []) {
  return qvalue("KK", v, false, evidence);
}

function ku(v, evidence = []) {
  return qvalue("KU", v, true, evidence);
}

function uk(v, evidence = []) {
  return qvalue("UK", v, false, evidence);
}

function uu(v, evidence = []) {
  return qvalue("UU", v, true, evidence);
}

async function readProbe(jsonlPath) {
  const events = [];
  const input = fs.createReadStream(jsonlPath, { encoding: "utf8" });
  const rl = readline.createInterface({ input, crlfDelay: Infinity });

  for await (const line of rl) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    try {
      events.push(JSON.parse(s));
    } catch (e) {
      die(`Failed to parse line in ${jsonlPath}: ${e.message}`);
    }
  }

  return events;
}

function indexLatest(events) {
  // Index latest value per key (monotone in time)
  const latest = {};
  for (const evt of events) {
    const key = evt.k;
    if (!latest[key] || evt.t > latest[key].t) {
      latest[key] = evt;
    }
  }
  return latest;
}

function resolveField(key, evt) {
  if (!evt) {
    // No event for this key - apply defaults
    return resolveDefault(key);
  }

  const q = evt.q || "KK"; // Default to KK if no quadrant specified
  const v = evt.v;

  switch (q) {
    case "KK":
      return kk(v, [`observed:${evt.t}`]);
    case "UK":
      return uk(v, [`derived:${key}`]);
    case "KU":
      return ku(v, [`default:${key}=${v}`]);
    case "UU":
      return uu(v, [`unknown:${key}`]);
    default:
      return kk(v, [`observed:${evt.t}`]);
  }
}

function resolveDefault(key) {
  // Conservative defaults for known unknowns
  const defaults = {
    "word_bits": ku(64, ["default:word_bits=64"]),
    "cpu.endian": ku("little", ["default:cpu.endian=little"]),
    "addr_bits": uk(64, ["derived:word_bits->addr_bits"]),
    "cpu.cores": ku(1, ["default:cpu.cores=1"]),
    "mem.total_bytes": ku(0, ["default:mem.total_bytes=0"]),
    "time.tick_hz": ku(1000000, ["default:time.tick_hz=1000000"]),
    "io.model": ku("nondet", ["default:io.model=nondet"]),
  };

  if (defaults[key]) {
    return defaults[key];
  }

  // Unknown unknown - use model default
  return uu(null, [`unknown:${key}`]);
}

function deriveFields(latest) {
  const fields = {};

  // Process observed fields
  for (const [key, evt] of Object.entries(latest)) {
    fields[key] = resolveField(key, evt);
  }

  // Derive word_bits from cpu.arch if not observed
  if (!fields["word_bits"] && latest["cpu.arch"]) {
    const arch = latest["cpu.arch"].v;
    if (arch === "aarch64" || arch === "x86_64") {
      fields["word_bits"] = uk(64, ["derived:arch->word_bits"]);
    } else if (arch) {
      fields["word_bits"] = uk(64, ["derived:arch->word_bits:default64"]);
    }
  }

  // Derive addr_bits from word_bits if not observed
  if (!fields["addr_bits"] && fields["word_bits"]) {
    fields["addr_bits"] = uk(fields["word_bits"].v, ["derived:word_bits->addr_bits"]);
  }

  // Derive endian from os.kernel if not observed
  if (!fields["cpu.endian"] && latest["os.kernel"]) {
    const kernel = latest["os.kernel"].v;
    if (kernel === "Linux" || kernel === "Android") {
      fields["cpu.endian"] = uk("little", ["derived:os.kernel->cpu.endian"]);
    }
  }

  return fields;
}

async function main() {
  const [probePath, outputPath] = process.argv.slice(2);

  if (!probePath) {
    die(`Usage: hw_canon.mjs <probe.jsonl> [canon.json]`);
  }

  const events = await readProbe(probePath);
  const latest = indexLatest(events);
  const fields = deriveFields(latest);

  const canon = {
    meta: {
      schema_version: "1.0",
      generated_at_utc: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
      source_set: [probePath]
    },
    fields
  };

  const json = JSON.stringify(canon, null, 2) + "\n";

  if (outputPath) {
    fs.writeFileSync(outputPath, json);
    console.log(`✅ Wrote canonical record to ${outputPath}`);
  } else {
    process.stdout.write(json);
  }
}

main().catch((e) => die(`Fatal: ${e.message}`));


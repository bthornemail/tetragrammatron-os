# Drift Tracking

**Extracted from:** CONVERSATION.md (lines 24000-24346)

## Overview

Drift tracking is a **non-invasive filesystem scanner** that produces normalized, replayable JSONL events and diff reports. It tracks structural and semantic changes without interpreting meaning.

## What "Drift" Means

Drift is **any structural or semantic change** detectable from the filesystem without interpreting meaning.

We track:

- **Structure drift**: added/removed/moved files, missing axis folders, missing context subfolders
- **Content drift** (non-invasive): hash change of files you designate as "semantic sources"
- **Index drift**: regeneration changes `index.json` outputs
- **Protocol drift**: edits to `AGENTS.md` / `README.md`

Everything becomes events in JSONL.

## Storage Layout

```
.ulp/
  drift/
    snapshots/
      latest.json
      <timestamp>.json
    events/
      drift.jsonl
    reports/
      <timestamp>.md
```

- **Snapshots**: stable canonical view of your project at time T
- **Events**: append-only drift log
- **Reports**: human readable delta summary

## Drift Tracker Script

### `tools/drift_scan.mjs`

The drift scanner:

- Walks `trees/**` (and optionally `descriptors/**`, `tools/**`, `ulp/viewer/**`)
- Builds a **canonical snapshot** of:
  - path
  - size
  - mtime
  - sha256 (only for selected extensions)
- Loads `.ulp/drift/snapshots/latest.json`
- Computes adds/removes/modifies
- Appends JSONL events
- Writes new snapshot + markdown report
- Optionally runs `validate_axes.mjs` first and records pass/fail in drift log

### Implementation

```javascript
#!/usr/bin/env node
/**
 * drift_scan.mjs
 * Non-invasive drift scanner: filesystem -> snapshot -> diff -> JSONL events.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const ROOTS = [
  "trees",
  "descriptors",
  "tools",
  "ulp/viewer"
];

const HASH_EXTS = new Set([
  ".md", ".json", ".jsonl", ".yaml", ".yml", ".canvas", ".canvasl", ".ts", ".tsx", ".js", ".mjs"
]);

const STATE_DIR = ".ulp/drift";
const SNAP_DIR = path.join(STATE_DIR, "snapshots");
const EVT_DIR  = path.join(STATE_DIR, "events");
const RPT_DIR  = path.join(STATE_DIR, "reports");
const LATEST   = path.join(SNAP_DIR, "latest.json");
const EVENTS   = path.join(EVT_DIR, "drift.jsonl");

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function sha256File(p) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(p));
  return h.digest("hex");
}

function isDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}
function isFile(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}

function walk(root) {
  const out = [];
  if (!fs.existsSync(root)) return out;

  const stack = [root];
  while (stack.length) {
    const cur = stack.pop();
    const st = fs.statSync(cur);

    if (st.isDirectory()) {
      for (const name of fs.readdirSync(cur)) {
        // ignore node_modules, dist, etc
        if (name === "node_modules" || name === "dist" || name === ".git") continue;
        stack.push(path.join(cur, name));
      }
    } else if (st.isFile()) {
      out.push(cur);
    }
  }
  return out;
}

function normalize(p) {
  return p.replace(/\\/g, "/");
}

function buildSnapshot() {
  const files = ROOTS.flatMap(walk).filter(p => isFile(p));

  const entries = {};
  for (const abs of files) {
    const rel = normalize(abs);
    const st = fs.statSync(abs);
    const ext = path.extname(abs).toLowerCase();

    const rec = {
      path: rel,
      size: st.size,
      mtimeMs: st.mtimeMs,
      ext
    };

    if (HASH_EXTS.has(ext)) {
      rec.sha256 = sha256File(abs);
    } else {
      rec.sha256 = null;
    }

    entries[rel] = rec;
  }

  // stable ordering for determinism
  const orderedPaths = Object.keys(entries).sort();
  const ordered = {};
  for (const p of orderedPaths) ordered[p] = entries[p];

  return { version: 1, createdAt: new Date().toISOString(), entries: ordered };
}

function loadJson(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");
}

function appendJsonl(p, obj) {
  fs.appendFileSync(p, JSON.stringify(obj) + "\n");
}

function diffSnapshots(prev, next) {
  const prevE = prev?.entries ?? {};
  const nextE = next.entries;

  const prevKeys = new Set(Object.keys(prevE));
  const nextKeys = new Set(Object.keys(nextE));

  const added = [];
  const removed = [];
  const modified = [];

  for (const k of nextKeys) {
    if (!prevKeys.has(k)) {
      added.push(nextE[k]);
    } else {
      const a = prevE[k];
      const b = nextE[k];
      // "modified" if hash differs (when present) or size differs
      const hashChanged = (a.sha256 && b.sha256 && a.sha256 !== b.sha256);
      const sizeChanged = a.size !== b.size;
      const mtimeChanged = Math.abs(a.mtimeMs - b.mtimeMs) > 1;

      if (hashChanged || sizeChanged) {
        modified.push({ before: a, after: b, reason: hashChanged ? "hash" : "size" });
      } else if (mtimeChanged && b.sha256 === null) {
        // binary asset drift tracked by mtime/size only
        modified.push({ before: a, after: b, reason: "mtime" });
      }
    }
  }

  for (const k of prevKeys) {
    if (!nextKeys.has(k)) {
      removed.push(prevE[k]);
    }
  }

  return { added, removed, modified };
}

function runValidator() {
  // optional: record validator result as a drift event
  const r = spawnSync("node", ["tools/validate_axes.mjs"], { stdio: "pipe" });
  return {
    ok: r.status === 0,
    code: r.status,
    stdout: String(r.stdout ?? ""),
    stderr: String(r.stderr ?? "")
  };
}

function main() {
  ensureDir(SNAP_DIR);
  ensureDir(EVT_DIR);
  ensureDir(RPT_DIR);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const snapshotPath = path.join(SNAP_DIR, `${timestamp}.json`);
  const reportPath = path.join(RPT_DIR, `${timestamp}.md`);

  const prev = loadJson(LATEST);
  const next = buildSnapshot();
  const d = diffSnapshots(prev, next);

  const validator = runValidator();

  // Write snapshot
  writeJson(snapshotPath, next);
  writeJson(LATEST, next);

  // Emit events
  appendJsonl(EVENTS, {
    t: new Date().toISOString(),
    k: "drift.scan",
    v: {
      added: d.added.length,
      removed: d.removed.length,
      modified: d.modified.length,
      validator_ok: validator.ok
    }
  });

  for (const a of d.added) appendJsonl(EVENTS, { t: new Date().toISOString(), k: "file.add", v: a });
  for (const r of d.removed) appendJsonl(EVENTS, { t: new Date().toISOString(), k: "file.remove", v: r });
  for (const m of d.modified) appendJsonl(EVENTS, { t: new Date().toISOString(), k: "file.modify", v: m });

  appendJsonl(EVENTS, {
    t: new Date().toISOString(),
    k: "validator.axes",
    v: {
      ok: validator.ok,
      code: validator.code
    }
  });

  // Write report (human)
  const lines = [];
  lines.push(`# Drift Report — ${timestamp}`);
  lines.push(``);
  lines.push(`Validator: **${validator.ok ? "PASS" : "FAIL"}**`);
  lines.push(``);
  lines.push(`## Summary`);
  lines.push(`- Added: ${d.added.length}`);
  lines.push(`- Removed: ${d.removed.length}`);
  lines.push(`- Modified: ${d.modified.length}`);
  lines.push(``);

  function listSection(title, items, fn) {
    lines.push(`## ${title}`);
    if (!items.length) {
      lines.push(`(none)`);
      lines.push(``);
      return;
    }
    for (const it of items) lines.push(`- ${fn(it)}`);
    lines.push(``);
  }

  listSection("Added", d.added, (x) => `${x.path}`);
  listSection("Removed", d.removed, (x) => `${x.path}`);
  listSection("Modified", d.modified, (x) => `${x.after.path} (${x.reason})`);

  if (!validator.ok) {
    lines.push(`## Validator Output (stderr)`);
    lines.push("```");
    lines.push(validator.stderr.trim() || "(none)");
    lines.push("```");
    lines.push("");
  }

  fs.writeFileSync(reportPath, lines.join("\n") + "\n");
  console.log("wrote", snapshotPath);
  console.log("wrote", reportPath);
  console.log("appended", EVENTS);

  process.exit(validator.ok ? 0 : 2);
}

main();
```

### Usage

```bash
node tools/drift_scan.mjs
```

## What You Get

- **Append-only drift log** (JSONL)
- **Snapshots** (for replay / colimit)
- **Markdown diffs** (human-readable)

This is your **directed system** in practice: each snapshot is a stage, and drift events are the morphisms.

## Obsidian Base Integration

Optional: Create `obsidian/bases/drift.base.md`:

```markdown
---
base:
  name: Drift Events
  source:
    folders:
      - .ulp/drift/events
  filters:
    - path.endsWith("drift.jsonl")
  columns:
    - name: Time
      value: t
    - name: Kind
      value: k
    - name: Value
      value: v
---

# Drift Events

This is an append-only log of structural changes.

Use it as:
- consensus timeline
- audit trail
- replay driver for the 3D renderer
```

## Principles

- **Non-invasive**: Only tracks filesystem structure, doesn't interpret meaning
- **Deterministic**: Stable ordering for reproducibility
- **Append-only**: Events are never modified, only appended
- **Replayable**: Snapshots allow reconstruction of state at any time

## Related Concepts

- [Validation Patterns](./validation-patterns.md)
- [Canonicalization](./canonicalization.md)
- [Architecture: File Structure](../architecture/file-structure.md)


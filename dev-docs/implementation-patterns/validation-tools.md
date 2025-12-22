# Validation Tools

## Overview

This document describes the validation tools that enforce structural integrity and track changes in the Tetragrammatron-OS project.

## validate_axes.mjs

### Purpose
Structural validator that enforces the Four-Axis Ontology across all branches.

### Location
`tools/validate_axes.mjs`

### What It Validates

1. **Required Axes** - Every branch must have all four axis folders:
   - `freedom/`
   - `autonomy/`
   - `sovereignty/`
   - `context/`

2. **Context Subfolders** - The `context/` folder must contain all six subfolders:
   - `networks/`
   - `views/`
   - `connections/`
   - `documents/`
   - `assets/`
   - `services/`

3. **Required Files** - Every branch must have:
   - `AGENTS.md`
   - `README.md`

4. **No Extra Axes** - Only the four canonical axes are allowed

### Usage

```bash
node tools/validate_axes.mjs
```

### Exit Codes

- `0` - All branches structurally valid
- `1` - Validation failed (missing axes, folders, or files)

### Implementation

```javascript
#!/usr/bin/env node
/**
 * validate_axes.mjs
 *
 * Structural validator for Tree-of-Life branches.
 * Enforces four-axis ontology.
 */

import fs from "node:fs";
import path from "node:path";

const REQUIRED_AXES = [
  "freedom",
  "autonomy",
  "sovereignty",
  "context"
];

const CONTEXT_SUBFOLDERS = [
  "networks",
  "views",
  "connections",
  "documents",
  "assets",
  "services"
];

function die(msg) {
  console.error("✖", msg);
  process.exit(1);
}

function assertDir(p) {
  if (!fs.existsSync(p) || !fs.statSync(p).isDirectory()) {
    die(`Missing directory: ${p}`);
  }
}

function main() {
  const treesDir = "trees";
  assertDir(treesDir);

  const trees = fs.readdirSync(treesDir);

  for (const tree of trees) {
    const branchesDir = path.join(treesDir, tree, "branches");
    if (!fs.existsSync(branchesDir)) continue;

    const branches = fs.readdirSync(branchesDir);
    for (const branch of branches) {
      const branchDir = path.join(branchesDir, branch);

      console.log(`✓ Checking ${tree}/${branch}`);

      // Required files
      ["AGENTS.md", "README.md"].forEach(f => {
        if (!fs.existsSync(path.join(branchDir, f))) {
          die(`Missing ${f} in ${branchDir}`);
        }
      });

      // Axes
      const presentAxes = fs.readdirSync(branchDir)
        .filter(n => fs.statSync(path.join(branchDir, n)).isDirectory());

      REQUIRED_AXES.forEach(axis => {
        if (!presentAxes.includes(axis)) {
          die(`Missing axis '${axis}' in ${branchDir}`);
        }
      });

      presentAxes.forEach(axis => {
        if (!REQUIRED_AXES.includes(axis)) {
          die(`Unknown axis '${axis}' in ${branchDir}`);
        }
      });

      // Context subfolders
      const contextDir = path.join(branchDir, "context");
      CONTEXT_SUBFOLDERS.forEach(sub => {
        assertDir(path.join(contextDir, sub));
      });
    }
  }

  console.log("✔ All branches structurally valid.");
}

main();
```

### Integration Points

- **CI/CD**: Run as pre-commit or build step
- **Drift Scanner**: Called automatically during drift scans
- **Development**: Run before pushing changes

## drift_scan.mjs

### Purpose
Non-invasive drift scanner that produces normalized, replayable JSONL and diff reports.

### Location
`tools/drift_scan.mjs`

### What It Tracks

1. **Added Files** - New files since last scan
2. **Removed Files** - Deleted files since last scan
3. **Modified Files** - Changed files (by hash or size)
4. **Validator Status** - Result of structural validation

### Usage

```bash
node tools/drift_scan.mjs
```

### Exit Codes

- `0` - Scan completed, validator passed
- `2` - Scan completed, validator failed

### Monitored Directories

```javascript
const ROOTS = [
  "trees",
  "descriptors",
  "tools",
  "ulp/viewer"
];
```

### Hashed Extensions

Text files are content-hashed for precise change detection:

```javascript
const HASH_EXTS = new Set([
  ".md", ".json", ".jsonl",
  ".yaml", ".yml",
  ".canvas", ".canvasl",
  ".ts", ".tsx", ".js", ".mjs"
]);
```

Binary files use size + mtime.

### Output Files

1. **Snapshot**: `.ulp/drift/snapshots/<timestamp>.json`
   - Complete state at scan time
   - Latest snapshot: `.ulp/drift/snapshots/latest.json`

2. **Events**: `.ulp/drift/events/drift.jsonl` (append-only)
   - `{"t": "...", "k": "drift.scan", "v": {...}}`
   - `{"t": "...", "k": "file.add", "v": {...}}`
   - `{"t": "...", "k": "file.remove", "v": {...}}`
   - `{"t": "...", "k": "file.modify", "v": {...}}`
   - `{"t": "...", "k": "validator.axes", "v": {...}}`

3. **Report**: `.ulp/drift/reports/<timestamp>.md`
   - Human-readable summary
   - Lists added, removed, modified files
   - Includes validator output

### Key Functions

```javascript
// Build snapshot of current state
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
  return { version: 1, createdAt: new Date().toISOString(), entries };
}

// Compare two snapshots
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
      const hashChanged = (a.sha256 && b.sha256 && a.sha256 !== b.sha256);
      const sizeChanged = a.size !== b.size;

      if (hashChanged || sizeChanged) {
        modified.push({ before: a, after: b, reason: hashChanged ? "hash" : "size" });
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
```

### Integration Points

- **Pre-commit**: Ensure clean state before commits
- **CI/CD**: Detect unexpected changes
- **Audit**: Regulatory compliance tracking
- **Replay**: Reconstruct historical state

## gen_tree_indexes.mjs

### Purpose
Generates index manifests for the tree structure.

### Location
`tools/gen_tree_indexes.mjs`

### What It Does

Walks the `trees/` directory and generates `index.json` files that describe:

- Trees
- Branches within trees
- Books within branches
- Entries within books

### Usage

```bash
node tools/gen_tree_indexes.mjs trees/
```

### Output Format

```json
{
  "trees": [
    {
      "name": "life",
      "branches": [
        {
          "name": "genesis",
          "books": [
            {
              "name": "creation",
              "entries": "./creation/entries.jsonl"
            }
          ]
        }
      ]
    }
  ]
}
```

## validate_jsonl.mjs

### Purpose
Validates JSONL files against JSON schemas.

### Location
`tools/validate_jsonl.mjs`

### Usage

```bash
node tools/validate_jsonl.mjs <jsonl-file> <schema-file>
```

Example:
```bash
node tools/validate_jsonl.mjs hardware/probe.jsonl schemas/hw_event.schema.json
```

### What It Validates

- Each line is valid JSON
- Each object conforms to the provided JSON schema
- Required fields are present
- Types match schema definitions

### Exit Codes

- `0` - All lines valid
- `1` - Validation errors found

## Common Patterns

### Pre-Commit Workflow

```bash
#!/bin/sh
# .git/hooks/pre-commit

# Validate structure
node tools/validate_axes.mjs || exit 1

# Track drift
node tools/drift_scan.mjs || exit 1

# Regenerate indices
node tools/gen_tree_indexes.mjs trees/

# Add drift artifacts
git add .ulp/drift/
```

### CI/CD Workflow

```yaml
# .github/workflows/validate.yml
name: Validate Structure

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate axes
        run: node tools/validate_axes.mjs
      - name: Scan drift
        run: node tools/drift_scan.mjs
      - name: Validate JSONL
        run: node tools/validate_jsonl.mjs hardware/probe.jsonl schemas/hw_event.schema.json
```

### Development Workflow

```bash
# After making changes
npm run validate      # runs validate_axes.mjs
npm run drift         # runs drift_scan.mjs
npm run index         # runs gen_tree_indexes.mjs
npm run test          # runs validate_jsonl.mjs on fixtures
```

## Best Practices

1. **Run validators frequently** - Catch structural issues early
2. **Review drift reports** - Understand what changed and why
3. **Commit drift artifacts** - Preserve change history
4. **Never edit JSONL manually** - Use append-only patterns
5. **Keep validators fast** - No external dependencies

## References

- See `four-axis-ontology.md` for what structure is being validated
- See `drift-tracking-system.md` for detailed drift scanner documentation
- See `axes-validator-soundness.md` for formal verification of validator properties

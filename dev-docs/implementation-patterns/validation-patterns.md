# Validation Patterns

**Extracted from:** CONVERSATION.md (lines 23820-23936)

## Overview

Validation in Tetragrammatron-OS enforces structure without interpreting meaning. It ensures branches maintain required axes and context subfolders, providing structural soundness without ideological enforcement.

## Validator Goals

The validator checks:

1. Every branch has **all four axes**
2. `context/` has the correct subfolders
3. `AGENTS.md` and `README.md` exist
4. No extra axes exist
5. Nothing is mutated

Fail fast. Report clearly.

## Axis Validator Implementation

### `tools/validate_axes.mjs`

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

## Usage

```bash
node tools/validate_axes.mjs
```

- Use in CI
- Use before commits
- Use before agent actions
- Use as a *gate* before visualization

## Validation Layers

### Layer 1: Structural Validation
- Enforces filesystem organization
- Checks required axes and subfolders
- Validates file presence (AGENTS.md, README.md)

### Layer 2: Content Validation
- JSONL schema validation
- Type checking
- Format validation

### Layer 3: Contract Validation
- Branch-local admissibility contracts
- Proof artifacts
- Adapter compliance

## Principles

- **Structure only**: Validator enforces structure, not meaning
- **Fail fast**: Report errors immediately
- **Clear messages**: Descriptive error messages
- **Non-invasive**: Only checks, never modifies
- **Deterministic**: Same structure always produces same result

## Integration with Drift Tracking

The validator can be integrated with drift tracking:

```javascript
function runValidator() {
  const r = spawnSync("node", ["tools/validate_axes.mjs"], { stdio: "pipe" });
  return {
    ok: r.status === 0,
    code: r.status,
    stdout: String(r.stdout ?? ""),
    stderr: String(r.stderr ?? "")
  };
}
```

Drift events record validator results:

```javascript
appendJsonl(EVENTS, {
  t: new Date().toISOString(),
  k: "validator.axes",
  v: {
    ok: validator.ok,
    code: validator.code
  }
});
```

## What Validation Provides

You now have:

| Layer | Function |
|-------|----------|
| Filesystem | Ground truth |
| AGENTS.md | Agent discipline |
| README.md | Human consensus |
| Axes folders | Ontological separation |
| Validator | Structural soundness |

This is exactly what you described as:

> "shared rubric without forcing belief"

It works because:
- structure is enforced
- meaning is free
- contradiction is preserved
- consensus is observable, not mandated

## Related Concepts

- [Drift Tracking](./drift-tracking.md)
- [File Structure](../architecture/file-structure.md)
- [AGENTS.md Standard](../conventions/agents-md.md)
- [Formal Verification: Contracts](../formal-verification/contracts.md)


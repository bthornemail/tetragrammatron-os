# Validation System

**Extracted from:** CONVERSATION.md (lines 23820-24346)

## Overview

The validation system enforces structural soundness without interpreting meaning. It operates at multiple layers to ensure consistency and correctness.

## Validation Layers

### Layer 1: Structural Validation
- Enforces filesystem organization
- Checks required axes and subfolders
- Validates file presence (AGENTS.md, README.md)
- Implemented by: `validate_axes.mjs`

### Layer 2: Content Validation
- JSONL schema validation
- Type checking
- Format validation
- Implemented by: `validate_jsonl.mjs`

### Layer 3: Contract Validation
- Branch-local admissibility contracts
- Proof artifacts
- Adapter compliance
- Implemented by: Formal verification (Lean)

### Layer 4: Drift Tracking
- Non-invasive change detection
- Structural and semantic drift
- Append-only event log
- Implemented by: `drift_scan.mjs`

## Axis Validator

The axis validator (`validate_axes.mjs`) checks:

1. Every branch has **all four axes**
2. `context/` has the correct subfolders
3. `AGENTS.md` and `README.md` exist
4. No extra axes exist
5. Nothing is mutated

### Integration with Drift Tracking

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

## Principles

- **Structure only**: Validator enforces structure, not meaning
- **Fail fast**: Report errors immediately
- **Clear messages**: Descriptive error messages
- **Non-invasive**: Only checks, never modifies
- **Deterministic**: Same structure always produces same result

## What Validation Provides

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

- [Validation Patterns](../implementation-patterns/validation-patterns.md)
- [Drift Tracking](../implementation-patterns/drift-tracking.md)
- [Formal Verification: Contracts](../formal-verification/contracts.md)
- [File Structure](./file-structure.md)


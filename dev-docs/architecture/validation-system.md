# Validation System

**Extracted from:** CONVERSATION.md (lines 23820-24346)

## Overview

The validation system enforces structural soundness without interpreting meaning. It operates at multiple layers to ensure consistency and correctness.

## Validation Layers

### Layer 0: Schema Prefix Validation (First Gate)
- **Address schema validation**: R0-R4 must be valid according to address schema
- **Schema registry lookup**: Schema must be present for mesh nodes
- **Signature verification**: Protected/public schemas require valid signatures
- **Schema hash validation**: Ensures schema integrity
- Implemented by: `tg_schema_prefix_valid()` (ESP32), schema validation (web viewer)

**Critical rule:** This is the **first gate**. Invalid schema prefixes cannot proceed to any other validation or execution.

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

## Schema Validation Pipeline

### 1. Schema Prefix Check
```c
if (!tg_schema_prefix_valid_global(&addr)) {
  return VALIDATION_ERROR_INVALID_SCHEMA;
}
```

### 2. Schema Registry Lookup (Mesh Nodes)
```c
SchemaKey k = { addr.r[0], schema_hash };
if (!registry_has(k)) {
  send_schema_need(k, sender);
  return VALIDATION_ERROR_SCHEMA_MISSING;
}
```

### 3. Signature Verification (Protected/Public)
```c
if (schema_class == PROTECTED || schema_class == PUBLIC) {
  if (!verify_schema_signature(schema_bin, sig_json)) {
    return VALIDATION_ERROR_INVALID_SIGNATURE;
  }
}
```

### 4. Class Admissibility Check
```c
if (!schema_class_ok(schema_class, trust_ctx)) {
  return VALIDATION_ERROR_CLASS_INADMISSIBLE;
}
```

## Principles

- **Schema first**: Schema prefix validation is the first gate
- **Structure only**: Validator enforces structure, not meaning
- **Fail fast**: Report errors immediately
- **Clear messages**: Descriptive error messages
- **Non-invasive**: Only checks, never modifies
- **Deterministic**: Same structure always produces same result
- **Trust-aware**: Signature verification for protected/public schemas

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

- [Address Schema](./address-schema.md) - Schema format and validation rules
- [Schema Negotiation](./schema-negotiation.md) - Schema acquisition protocol
- [Triadic Law](./triadic-law.md) - Private/Protected/Public validation rules
- [Validation Patterns](../implementation-patterns/validation-patterns.md)
- [Implementation Patterns: Signature Verification](../implementation-patterns/signature-verification.md)
- [Drift Tracking](../implementation-patterns/drift-tracking.md)
- [Formal Verification: Contracts](../formal-verification/contracts.md)
- [Formal Verification: Schema Gate Theorems](../formal-verification/schema-gate-theorems.md)
- [File Structure](./file-structure.md)


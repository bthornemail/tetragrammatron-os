# Determinism

**Extracted from:** CONVERSATION.md (multiple sections)

## Overview

All operations in Tetragrammatron-OS are deterministic and reproducible. Same inputs always produce same outputs, with no hidden state or randomness.

## Core Principle

> **Deterministic operations: Same inputs → Same outputs**

This ensures:
- Reproducibility
- Debuggability
- Testability
- Predictability

## Implementation Patterns

### Stable Ordering

```javascript
// ✅ CORRECT: Stable ordering for determinism
const orderedPaths = Object.keys(entries).sort();
const ordered = {};
for (const p of orderedPaths) ordered[p] = entries[p];

// ❌ WRONG: Non-deterministic iteration
for (const key in entries) { ... }
```

### No Hidden State

Operations should not depend on:
- Global variables
- System time (unless explicitly part of input)
- Random number generators
- External state

### Explicit Dependencies

All dependencies should be explicit:
- Function parameters
- Configuration files
- Environment variables (documented)

## Canonicalization

Canonicalization ensures deterministic output:

```scheme
;; Canonical record with stable ordering
(define (canonize ht)
  ;; Deterministic defaults
  ;; Stable field ordering
  ;; Explicit quadrant tags
  ...)
```

## Snapshot Generation

Drift tracking uses deterministic snapshots:

```javascript
function buildSnapshot() {
  // Stable ordering for determinism
  const orderedPaths = Object.keys(entries).sort();
  const ordered = {};
  for (const p of orderedPaths) ordered[p] = entries[p];
  
  return { version: 1, createdAt: new Date().toISOString(), entries: ordered };
}
```

## Schema Compilation Determinism

Schema compilation must be **completely deterministic**:

### YAML → Binary Compilation

```python
# Deterministic compilation process
def compile_schema(yaml_data):
  # 1. Canonicalize: sort allowed values
  canonical = canonicalize_rowspec(yaml_data["rowspec"])
  
  # 2. Compute hash from canonical form
  hash = sha256(canonical_json).digest()[:16]
  
  # 3. Generate binary with stable layout
  binary = pack_binary(canonical, hash)
  
  return binary
```

**Properties:**
- Same YAML → same binary (byte-for-byte)
- Hash is deterministic (canonicalized input)
- Binary layout is stable (fixed ABI)

### Address Assignment Determinism

Address assignment must be deterministic:

```c
// Deterministic instance assignment
bool addr_assign_instance(addr8_t *a, uint32_t realm_id, uint8_t salt) {
  // Deterministic inputs:
  // - MAC address (fixed per node)
  // - realm_id (fixed per mesh)
  // - salt (deterministic counter)
  // - schema prefix (already validated)
  
  uint8_t mac[6];
  esp_read_mac(mac, ESP_MAC_WIFI_STA);
  
  // Hash: realm_id || mac || salt || schema_prefix
  uint8_t h[32];
  sha256_bytes(buf, sizeof(buf), h);
  
  a->r[5] = h[0];
  a->r[6] = h[1];
  a->r[7] = h[2];
  return true;
}
```

**Properties:**
- Same inputs → same instance bytes
- Collision resolution is deterministic (tie-break by MAC + nonce)
- No randomness in assignment

### Signature Verification Determinism

Signature verification is deterministic:

- Same public key + message + signature → same result
- Ed25519 verification is deterministic
- No probabilistic checks

## Principles

- **Stable ordering**: Always sort keys/indices
- **Explicit inputs**: All dependencies are parameters
- **No randomness**: Deterministic algorithms only
- **Reproducible**: Same inputs always produce same outputs
- **Schema compilation**: Deterministic YAML → BIN
- **Address assignment**: Deterministic instance bytes

## Related Concepts

- [Immutability](./immutability.md) - Schema YAML is immutable source
- [Schema Before Instance](./schema-before-instance.md) - Schema validation is deterministic
- [Canonicalization](../implementation-patterns/canonicalization.md)
- [Implementation Patterns: Schema Compilation](../implementation-patterns/schema-compilation.md)
- [Drift Tracking](../implementation-patterns/drift-tracking.md)


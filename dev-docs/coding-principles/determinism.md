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

## Principles

- **Stable ordering**: Always sort keys/indices
- **Explicit inputs**: All dependencies are parameters
- **No randomness**: Deterministic algorithms only
- **Reproducible**: Same inputs always produce same outputs

## Related Concepts

- [Immutability](./immutability.md)
- [Canonicalization](../implementation-patterns/canonicalization.md)
- [Drift Tracking](../implementation-patterns/drift-tracking.md)


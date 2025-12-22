# Immutability

**Extracted from:** CONVERSATION.md (multiple sections)

## Overview

Immutability is a core principle of Tetragrammatron-OS. Source data is immutable; only projections, indices, and derived artifacts are generated.

## Core Principle

> **Source files are read-only. Only generated artifacts are written.**

This ensures:
- Ground truth remains stable
- No mutation of source files
- Deterministic regeneration of derived artifacts
- Clear separation between source and derived data

## Three-Layer Architecture

| Layer | Role | Writes |
|-------|------|--------|
| Filesystem | Truth | Content (source files) |
| Index generator | Projection | `index.json` only |
| Renderer | View | none |
| Plugin | Navigation | none |

This exactly mirrors the **Ball → Sphere → VM** separation:
- Files = Ball
- Indexes = Canon
- Renderer = Sphere view
- Plugin = Execution context

## Implementation Patterns

### No Mutation of Source

```javascript
// ✅ CORRECT: Read source, write only derived artifacts
const source = fs.readFileSync("trees/branch/entries.jsonl");
const index = generateIndex(source);
fs.writeFileSync("trees/branch/index.json", index);

// ❌ WRONG: Mutating source
fs.appendFileSync("trees/branch/entries.jsonl", newEntry);
```

### Deterministic Generation

All generated artifacts are deterministic:
- Same inputs → same outputs
- No hidden state
- Stable ordering

### Read-Only Observers

Renderers and viewers are read-only:
- Load data from filesystem
- Generate visualizations
- Never modify source

## Principles

- **No layer leaks**: Clear boundaries between layers
- **No guessing**: Explicit contracts and schemas
- **No mutation**: Source remains immutable

## Related Concepts

- [Determinism](./determinism.md)
- [Architecture: File Structure](../architecture/file-structure.md)
- [Implementation Patterns: Drift Tracking](../implementation-patterns/drift-tracking.md)


# Coding Principles

This directory contains core development principles for Tetragrammatron-OS.

## Contents

- **[Immutability](./immutability.md)** - Immutability patterns and requirements
- **[Determinism](./determinism.md)** - Deterministic operations and reproducibility
- **[Composition](./composition.md)** - Composable design patterns
- **[Boundary Preservation](./boundary-preservation.md)** - Boundary semantics and preservation

## Core Principles

### Immutability
Source data is immutable; only projections/indices are generated. This ensures:
- Ground truth remains stable
- No mutation of source files
- Deterministic regeneration of derived artifacts

### Determinism
All operations are deterministic and reproducible:
- Same inputs → same outputs
- No hidden state or randomness
- Stable ordering for reproducibility

### Composition
Systems compose through explicit interfaces:
- No layer leaks
- Clear boundaries between components
- Composable design patterns

### Boundary Preservation
Sphere projection preserves boundary semantics:
- Physical boundaries map to semantic boundaries
- Boundary conditions are preserved through projection
- Invalid states are rejected at boundaries

## Principles in Practice

### No Mutation
- Source files are read-only
- Only generated artifacts (indices, projections) are written
- Validation ensures structure without modifying content

### No Guessing
- Explicit contracts and schemas
- Quadrant system tracks knowledge provenance
- Unknowns are explicitly marked, not inferred

### Layer Separation
Clear boundaries between:
- Filesystem (ground truth)
- Validation (structure checking)
- Projection (semantic transformation)
- Visualization (observation)

## Related Documentation

- [Architecture](../architecture/) - How principles manifest in architecture
- [Implementation Patterns](../implementation-patterns/) - Concrete patterns implementing principles
- [Formal Verification](../formal-verification/) - Mathematical foundations


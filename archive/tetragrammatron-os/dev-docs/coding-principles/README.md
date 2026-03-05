# Coding Principles

This directory contains core development principles for Tetragrammatron-OS.

## Contents

### Core Principles
- **[Schema Before Instance](./schema-before-instance.md)** - Schema-first execution requirement
- **[Triadic Trust](./triadic-trust.md)** - Private/protected/public trust model
- **[Signature Required](./signature-required.md)** - Signature requirements for protected/public schemas
- **[Immutability](./immutability.md)** - Immutability patterns and requirements (includes address-schema.yaml)
- **[Determinism](./determinism.md)** - Deterministic operations and reproducibility (includes schema compilation)
- **[Composition](./composition.md)** - Composable design patterns
- **[Boundary Preservation](./boundary-preservation.md)** - Boundary semantics and preservation

## Core Principles

### Schema Before Instance
Schema rows (R0-R4) must be valid before instance assignment. Execution requires valid schema prefix. This ensures:
- Invalid schema prefixes cannot execute
- Schema is law, not opinion
- No interpretation of instance bytes

### Triadic Trust
Three schema visibility classes unify cryptographic, geometric, and algebraic perspectives:
- **Private**: Point / monomial / privateKey
- **Protected**: Line / binomial / sharedKey
- **Public**: Plane / trinomial / publicKey

### Signature Required
Protected/public schemas require valid Ed25519 signatures. Private schemas: signature optional.

### Immutability
Source data is immutable; `address-schema.yaml` is immutable source of truth. This ensures:
- Ground truth remains stable
- No mutation of source files
- Deterministic regeneration of derived artifacts

### Determinism
All operations are deterministic and reproducible, including schema compilation:
- Same YAML → same binary (byte-for-byte)
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


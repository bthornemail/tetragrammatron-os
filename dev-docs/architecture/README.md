# Architecture

This directory contains core architectural patterns and models for Tetragrammatron-OS.

## Contents

- **[Sphere-Ball Model](./sphere-ball-model.md)** - Hardware abstraction theory and duality
- **[Projection System](./projection-system.md)** - VM projection mechanisms and operators
- **[Validation System](./validation-system.md)** - Validation and drift tracking architecture
- **[File Structure](./file-structure.md)** - Directory conventions and organization

## Core Architectural Principles

### Sphere-Ball Duality

The fundamental abstraction separating:
- **Ball (B⁴)**: Space of physically admissible realizations
- **Sphere (S³ = ∂B⁴)**: Space of semantic invariants

This creates a boundary semantics model where:
- Hardware compatibility = Ball membership ∩ Sphere projection
- Ball = Physics (what can exist)
- Sphere = Semantics (what can mean)

### Projection Operators

The mod 8 operator serves as the projection map between Ball and Sphere:
- Hardware configurations project to semantic residues
- Admissibility is determined by the 7-point rule: `(p+2) % 8 ≠ 0` (equiv `p ≠ 6`)
- Projection ensures causal closure

### Validation Architecture

Multi-layer validation system:
1. **Structural validation**: Enforces filesystem organization (axes, context subfolders)
2. **Content validation**: JSONL schema validation
3. **Drift tracking**: Non-invasive change detection
4. **Contract validation**: Branch-local admissibility contracts

### File Structure Conventions

Four-axis ontology enforced at branch level:
- `freedom/` - What actions are possible
- `autonomy/` - Who decides
- `sovereignty/` - Who is accountable
- `context/` - Under what conditions (with subfolders: networks, views, connections, documents, assets, services)

## Key Architectural Decisions

1. **Immutability**: Source data is immutable; only projections/indices are generated
2. **Determinism**: All operations are deterministic and reproducible
3. **Composability**: Systems compose through explicit interfaces
4. **Boundary Preservation**: Sphere projection preserves boundary semantics
5. **Layer Separation**: Clear boundaries between filesystem, validation, projection, and visualization

## Related Documentation

- [Formal Verification](../formal-verification/) - Mathematical foundations
- [Coding Principles](../coding-principles/) - Development guidelines
- [Implementation Patterns](../implementation-patterns/) - Concrete patterns


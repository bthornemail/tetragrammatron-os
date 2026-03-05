# Architecture

This directory contains core architectural patterns and models for Tetragrammatron-OS.

## Contents

### Core Models
- **[Address Schema](./address-schema.md)** - 8-byte address schema system, binary ABI, and compilation pipeline
- **[ULP Addressing](./ulp-addressing.md)** - IPv6-inspired semantic addressing with 5+3 schema mapping
- **[Sphere-Ball Model](./sphere-ball-model.md)** - Hardware abstraction theory and duality
- **[Projection System](./projection-system.md)** - Schema-gated VM projection mechanisms and operators
- **[Four-Axis Ontology](./four-axis-ontology.md)** - Freedom/Autonomy/Sovereignty/Context structure
- **[Obsidian Bases](./obsidian-bases.md)** - Obsidian integration and lattice visualization

### Schema System
- **[Schema Negotiation](./schema-negotiation.md)** - Mesh node negotiation protocol and multi-schema coexistence
- **[Triadic Law](./triadic-law.md)** - Private/protected/public schema classes and geometric/algebraic mappings
- **[Validation System](./validation-system.md)** - Schema prefix validation and signature verification
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

### Address Schema Architecture

The 8-byte address system with 5+3 partition:
- **Schema rows (R0-R4)**: Fixed, predefined, validated against address schema
- **Instance rows (R5-R7)**: Free entropy, assigned after schema validation
- **Schema-gated execution**: Invalid schema prefixes cannot execute
- **Binary ABI**: Compact format for embedded nodes (ESP32)
- **Multi-schema coexistence**: Parallel realms with schema negotiation

### Validation Architecture

Multi-layer validation system:
0. **Schema prefix validation**: First gate - R0-R4 must be valid (NEW)
1. **Structural validation**: Enforces filesystem organization (axes, context subfolders)
2. **Content validation**: JSONL schema validation
3. **Drift tracking**: Non-invasive change detection
4. **Contract validation**: Branch-local admissibility contracts
5. **Signature verification**: Protected/public schemas require valid signatures (NEW)

### File Structure Conventions

Four-axis ontology enforced at branch level:
- `freedom/` - What actions are possible
- `autonomy/` - Who decides
- `sovereignty/` - Who is accountable
- `context/` - Under what conditions (with subfolders: networks, views, connections, documents, assets, services)

## Key Architectural Decisions

1. **Schema Before Instance**: Schema rows (R0-R4) must be valid before instance assignment (R5-R7)
2. **Schema-Gated Execution**: Invalid schema prefixes cannot execute, route, or project
3. **Triadic Trust**: Private/protected/public schema classes with geometric/algebraic mappings
4. **Immutability**: Source data is immutable; `address-schema.yaml` is immutable source of truth
5. **Determinism**: Schema compilation is deterministic; same YAML → same binary
6. **Composability**: Systems compose through explicit interfaces
7. **Boundary Preservation**: Sphere projection preserves boundary semantics
8. **Layer Separation**: Clear boundaries between filesystem, validation, projection, and visualization

## Related Documentation

- [Formal Verification](../formal-verification/) - Mathematical foundations
- [Coding Principles](../coding-principles/) - Development guidelines
- [Implementation Patterns](../implementation-patterns/) - Concrete patterns


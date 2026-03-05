# Implementation Patterns

This directory contains concrete implementation patterns used in Tetragrammatron-OS.

## Contents

### Schema Patterns
- **[Schema Compilation](./schema-compilation.md)** - YAML → BIN compilation pattern
- **[Schema Negotiation](./schema-negotiation.md)** - Mesh node negotiation pattern
- **[Schema Registry](./schema-registry.md)** - Runtime schema registry pattern
- **[Signature Verification](./signature-verification.md)** - Ed25519 signature verification pattern

### Core Patterns
- **[Validation Patterns](./validation-patterns.md)** - Validation strategies including schema prefix validation
- **[Drift Tracking](./drift-tracking.md)** - Time-based drift scanning and tracking system
- **[Canonicalization](./canonicalization.md)** - Hardware canonicalization pipeline
- **[Quadrant System](./quadrant-system.md)** - Rumsfeld quadrant model (KK/KU/UK/UU)
- **[Adapter Pattern](./adapter-pattern.md)** - Extension adapters for admissibility

## Key Patterns

### Schema Compilation
Deterministic compilation of YAML schema definitions to compact binary format (ABI v2/v3) for embedded nodes. Ensures same YAML → same binary.

### Schema Negotiation
Mesh node protocol for discovering, acquiring, and validating address schemas without central authority. Supports multi-schema coexistence.

### Schema Registry
Bounded cache of active schemas with LRU eviction. Enables efficient schema lookup and validation for mesh nodes.

### Signature Verification
Ed25519 signature verification over schema binary bytes. Protected/public schemas require valid signatures; private schemas: optional.

### Validation Patterns
Multi-layer validation including schema prefix validation (first gate) and signature verification. Structural validation enforces filesystem organization.

### Drift Tracking
Non-invasive filesystem scanning that produces normalized, replayable JSONL events and diff reports. Tracks structural and semantic changes without interpreting meaning.

### Canonicalization
Process of reducing hardware probe JSONL to a single canonical record with quadrant-tagged values, ensuring deterministic output even under partial knowledge.

### Quadrant System
Four-quadrant model for tracking knowledge provenance:
- **KK (Known Known)**: Observed fact, stable
- **KU (Known Unknown)**: Key relevant but value missing
- **UK (Unknown Known)**: Derived by adapter
- **UU (Unknown Unknown)**: Outside model

### Adapter Pattern
Extension mechanism where adapters supply proofs (α) for admissibility, allowing specialization to parity/prime/Fano facts.


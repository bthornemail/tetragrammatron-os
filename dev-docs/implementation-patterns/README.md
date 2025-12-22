# Implementation Patterns

This directory contains concrete implementation patterns used in Tetragrammatron-OS.

## Contents

- **[Drift Tracking](./drift-tracking.md)** - Time-based drift scanning and tracking system
- **[Canonicalization](./canonicalization.md)** - Hardware canonicalization pipeline
- **[Quadrant System](./quadrant-system.md)** - Rumsfeld quadrant model (KK/KU/UK/UU)
- **[Adapter Pattern](./adapter-pattern.md)** - Extension adapters for admissibility
- **[Validation Patterns](./validation-patterns.md)** - Validation strategies and tools

## Key Patterns

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

### Validation Patterns
Structural validation that enforces filesystem organization without interpreting meaning, ensuring branches maintain required axes and context subfolders.


# Lean 4 Theorems

**Extracted from:** CONVERSATION.md (multiple sections)

## Overview

This document catalogs the key Lean 4 theorems and proofs that establish the mathematical foundations of Tetragrammatron-OS.

## Key Theorem Files

### Tetragrammatron_AxesValidator_SphereSoundness.lean

Establishes the connection between structural validation and semantic admissibility.

**Key Theorems:**
- `validator_contract_implies_projection`: Validator + contract ⇒ projection exists
- `validator_boundary_preservation`: Validator + boundary contract + boundary ⇒ boundary preservation
- `alpha_induces_contract`: α-adapter proves admissibility ⇒ induces contract

See: [code-examples/lean/axes-validator-sphere-soundness.lean](../code-examples/lean/axes-validator-sphere-soundness.lean)

### Tetragrammatron_Completion.lean

Formalizes the two-layer semantic model (operational vs invariant).

**Key Definitions:**
- `BallSem`: Operational semantic space (odd parity)
- `SphereSem`: Invariant semantic space (primality)
- `Refines`: Refinement relation between ball and sphere

**Key Theorems:**
- `ballSem_card`: There are exactly 4 operationally admissible residues
- `refinement_unique`: Refinement is functional when it exists

See: [Completion Theory](./completion-theory.md)

### Tetragrammatron_SphereBall.lean

Formalizes the sphere-ball duality and projection.

**Key Definitions:**
- `HardwareBall`: Hardware configuration with specs
- `VMSphere`: VM semantic space (admissible pointers)
- `project`: Projection operator

**Key Theorems:**
- `project_idempotent`: Projection is idempotent
- `causal_closure`: Execution depends only on projection
- `exec_depends_only_on_projection`: Extensional property of causal closure
- `boundary_preservation`: Boundary hardware projects to sphere

## Theorem Categories

### Soundness Theorems
Prove that validators and contracts guarantee correct behavior:
- Validator + contract ⇒ projection exists
- Validator + boundary contract ⇒ boundary preservation

### Completeness Theorems
Prove that all valid states are reachable:
- Refinement relation is functional
- All admissible states project correctly

### Safety Theorems
Prove that invalid states are rejected:
- Inadmissible hardware fails to project
- Boundary violations are detected

## Principles

- **Mathematical honesty**: No claims beyond what's proven
- **Explicit contracts**: Admissibility is explicit, not inferred
- **Soundness**: Validators guarantee structure, not meaning
- **Completeness**: All valid paths are covered

## Related Concepts

- [Contracts](./contracts.md)
- [Completion Theory](./completion-theory.md)
- [Architecture: Sphere-Ball Model](../architecture/sphere-ball-model.md)
- [Architecture: Projection System](../architecture/projection-system.md)


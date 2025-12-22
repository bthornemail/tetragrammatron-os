# Formal Verification

This directory contains formal verification work using Lean 4, including theorems, proofs, and contracts that establish the mathematical foundations of Tetragrammatron-OS.

## Contents

- **[Lean Theorems](./lean-theorems.md)** - Core Lean 4 theorem files and proofs
- **[Contracts](./contracts.md)** - Admissibility contracts and validation theorems
- **[Completion Theory](./completion-theory.md)** - Operational/invariant semantics and completion structure

## Key Concepts

### Admissibility Contracts
Branch-local contracts that prove admissibility of VM projection. The validator guarantees structure, while adapters supply proofs for admissibility.

### Validator Soundness
Theorems proving that `ValidatorOK ∧ Contract` ⇒ projection exists and factors to the VM sphere.

### Completion Theory
Formalization of the two-layer semantic model:
- **Operational semantics (Ball)**: Constructible, local, decidable (based on parity/Odd)
- **Invariant semantics (Sphere)**: Global, irreducible, structural (based on primality)

Together these play a role analogous to ℚ (rationals) + ℝ \ ℚ (irrationals) → ℝ.

## Principles

- Structure alone cannot prove admissibility
- Contracts must be explicit and branch-local
- Validator enforces where proofs live
- Proofs remain mathematical, local, explicit


# Formal Verification

This directory contains formal verification work using Lean 4, including theorems, proofs, and contracts that establish the mathematical foundations of Tetragrammatron-OS.

## Contents

- **[Schema Gate Theorems](./schema-gate-theorems.md)** - Schema-gated execution theorems and proofs
- **[Triadic Law Proofs](./triadic-law-proofs.md)** - Private/protected/public class admissibility and information flow proofs
- **[Contracts](./contracts.md)** - Admissibility contracts, schema validation, and signature verification contracts
- **[Lean Theorems](./lean-theorems.md)** - Core Lean 4 theorem files and proofs
- **[Completion Theory](./completion-theory.md)** - Operational/invariant semantics and completion structure
- **[Axes Validator Soundness](./axes-validator-soundness.md)** - Validator soundness theorems

## Key Concepts

### Schema Gate Theorems
Core theorem: **Invalid schema prefixes cannot execute**. Proves that execution is schema-gated:
- `invalid_schema_no_execute`: Invalid prefix → immediate trap
- `valid_schema_exec`: Valid prefix → normal execution
- `exec_implies_schema_present`: Execution implies schema exists

### Triadic Law Proofs
Theorems establishing class-based execution admissibility:
- `protected_requires_shared_key`: Protected schemas require shared key
- `private_requires_self`: Private schemas require self context
- `public_always_admissible`: Public schemas always admissible
- `no_downflow_protected`: No information leakage from protected to public

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


# Adapter Pattern (Extension Adapters)

**Extracted from:** CONVERSATION.md (lines 24400-24594)

## Overview

The adapter pattern allows specialization of admissibility contracts to specific facts (parity/prime/Fano) through extension adapters that supply proofs for admissibility.

## Core Concept

To specialize "contract" to parity/prime/Fano facts, you define:

- a predicate `α : BranchFS → HardwareBall → Prop`
- and prove `α b h → admissibleGeodesic (pointer h)`

This is exactly your extension-adapter interface.

## Lean 4 Formalization

```lean
/-- Specialization hook (α-adapters) -/
def AlphaAdapter (α : BranchFS → HardwareBall → Prop) : Prop :=
  ∀ b h, α b h → admissibleGeodesic (pointer h)

/-- If α-adapter proves admissibility, it induces an admissibility contract. -/
theorem alpha_induces_contract
    (α : BranchFS → HardwareBall → Prop)
    (A : AlphaAdapter α)
    (b : BranchFS) (h : HardwareBall)
    (ha : α b h) :
    AdmissibilityContract b h := by
  exact A b h ha
```

## Implementation in Repository

Each branch can optionally include:

- `context/documents/admissibility.contract.md` (human readable)
- `context/documents/admissibility.contract.lean` (formal)
- `context/services/adapters/*.ts` (checker)

## Two Modes

- **Private / ball mode**: structure-only, permissive
- **Public / sphere mode**: structure + contract required

## Adapter Types

### Parity Adapter
Proves admissibility based on odd parity.

### Prime Adapter
Proves admissibility based on primality.

### Fano Adapter
Proves admissibility based on Fano plane structure.

## Composition

Adapters compose:

```
S_total = S_ball ⊓ S_parity ⊓ S_prime ⊓ S_fano ⊓ ...
```

Each adapter produces a sphere fragment (UK quadrant), and composition is through repeated meet operations.

## Principles

- **Explicit proofs**: Adapters supply proofs, not just checks
- **Composable**: Multiple adapters can combine
- **Branch-local**: Contracts are per-branch
- **Optional**: Adapters are optional extensions

## Related Concepts

- [Formal Verification: Contracts](../formal-verification/contracts.md)
- [Quadrant System](./quadrant-system.md)
- [Coding Principles: Composition](../coding-principles/composition.md)


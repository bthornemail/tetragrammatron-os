# Projection System

**Extracted from:** CONVERSATION.md (lines 7500-7758)

## Overview

The projection system implements the mod 8 operator as a semantic quotient projection, mapping hardware configurations (Ball) to VM semantic states (Sphere).

## Projection Operator

The projection map π: ℋ → 𝒱 is defined as:

\[
\pi(h) = \text{project}(h) \mod 8 \in \mathcal{V}
\]

Where:
- ℋ = Hardware configuration space (Ball)
- 𝒱 = VM semantic space (Sphere)
- mod 8 = Residue class selector

## Admissibility Rule

The canonical 7-point admissible predicate:

\[
\text{admissibleGeodesic}(p) := (p + 2) \mod 8 \neq 0
\]

Equivalently: `p ≠ 6`

This means 7 out of 8 possible residues are admissible.

## Projection Properties

### 1. Boundary Preservation

\[
\pi(\partial\mathcal{H}) \subset \mathcal{V}
\]

Physical extremals map to valid semantic extremals.

### 2. Idempotence

\[
\pi(\pi(h)) = \pi(h)
\]

Projection is a retraction onto a quotient, not an embedding.

### 3. Causal Closure

> Only π(h) affects execution

Hardware variation is observationally irrelevant; execution depends only on equivalence class.

## Implementation

```lean
/-- Projection: succeeds iff pointer admissible. -/
def project (h : HardwareBall) : Option VMSphere :=
  let p := pointer h
  if hp : admissibleGeodesic p then
    some ⟨p, hp⟩
  else
    none
```

## Why Mod 8?

The `% 8` operator is not arbitrary — it's a residue class selector:

- Collapses high-entropy physical parameters
- Into finite semantic residue classes
- Aligned with Fano / octonionic / 8-fold invariants

This is standard in:
- cache line alignment
- pointer tagging
- capability machines
- cryptographic normalization
- vector lane semantics

## Projection Soundness

```lean
theorem project_sound (h : HardwareBall) (hp : admissibleGeodesic (pointer h)) :
    ∃ v : VMSphere, project h = some v := by
  refine ⟨⟨pointer h, hp⟩, ?_⟩
  unfold project
  simp [hp]
```

## Related Concepts

- [Sphere-Ball Model](./sphere-ball-model.md)
- [Formal Verification: Contracts](../formal-verification/contracts.md)
- [Coding Principles: Boundary Preservation](../coding-principles/boundary-preservation.md)


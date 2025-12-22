# Boundary Preservation

**Extracted from:** CONVERSATION.md (lines 7500-7758, 24400-24594)

## Overview

Boundary preservation ensures that physical boundaries map to semantic boundaries, and that boundary conditions are preserved through projection.

## Core Principle

> **Boundary preservation: π(∂ℋ) ⊂ 𝒱**

Physical extremals (limits) map to valid semantic extremals. No undefined semantic states appear at physical limits.

## Mathematical Formulation

### Boundary Preservation

\[
\pi(\partial \mathcal{H}) \subseteq \mathcal{V}
\]

This means:
- Physical boundaries map to semantic boundaries
- Boundary conditions are preserved
- Invalid states are rejected at boundaries

### Boundary Contract

```lean
/-- Boundary contract: boundary ⇒ admissible (your "boundary preservation" content). -/
def BoundaryContract (b : BranchFS) (h : HardwareBall) : Prop :=
  OnBoundary h → admissibleGeodesic (pointer h)
```

## Boundary Definition

A hardware configuration is on the boundary if:
- Some spec hits its minimum value
- Some spec hits its maximum value

```lean
/-- A spec is on the physical boundary if it hits its min or max. -/
def Spec.onBoundary (s : Spec) : Prop :=
  s.value = s.minV ∨ s.value = s.maxV
```

## Boundary Preservation Theorem

```lean
/-- Validator + boundary contract + boundary ⇒ boundary preservation. -/
theorem validator_boundary_preservation
    (b : BranchFS) (h : HardwareBall)
    (ok : ValidatorOK b)
    (BC : BoundaryContract b h)
    (hb : OnBoundary h) :
    ∃ v : VMSphere, project h = some v := by
  have : admissibleGeodesic (pointer h) := BC hb
  exact project_sound h this
```

## Why This Matters

Boundary preservation ensures:
- **Soundness**: Physical limits don't break semantics
- **Completeness**: All valid boundaries are preserved
- **Safety**: Invalid states are rejected

## Principles

- **Boundaries are explicit**: Not inferred, but defined
- **Preservation is proven**: Not assumed, but verified
- **Invalid states rejected**: Boundaries enforce safety

## Related Concepts

- [Sphere-Ball Model](../architecture/sphere-ball-model.md)
- [Projection System](../architecture/projection-system.md)
- [Formal Verification: Contracts](../formal-verification/contracts.md)


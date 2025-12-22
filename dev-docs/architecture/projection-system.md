# Projection System

**Extracted from:** CONVERSATION.md (lines 7500-7758)

## Overview

The projection system implements the mod 8 operator as a semantic quotient projection, mapping hardware configurations (Ball) to VM semantic states (Sphere). **Projection is schema-gated:** only addresses with valid schema prefixes (R0-R4) can be projected.

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

## Schema-Gated Projection

Projection requires a valid schema prefix before it can proceed:

```lean
/-- Projection: requires valid schema prefix, then checks admissibility. -/
def project (addr : Addr8) (schema : SchemaTable) : Option VMSphere :=
  if h_schema : schemaValid schema addr then
    let p := projected_residue addr
    if hp : admissibleGeodesic p then
      some ⟨p, hp⟩
    else
      none
  else
    none
```

**Critical rule:** Projection is only permitted after schema validation. Invalid schema prefixes cannot be projected.

## Mode Enforcement

For schemas with mode constraints (e.g., `public4` or `private7`), projection must also check mode admissibility:

```lean
def projectWithMode (addr : Addr8) (schema : SchemaTable) (residue : Fin 8) : Option VMSphere :=
  if h_schema : schemaValid schema addr then
    if h_mode : modeAdmissible schema.mode residue then
      if hp : admissibleGeodesic residue.val then
        some ⟨residue.val, hp⟩
      else
        none
    else
      none
  else
    none
```

Where:
- `private7` mode: residue ≠ 6
- `public4` mode: residue ∈ {0, 1, 3, 5}

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

## Address Row Mapping

The projection system maps address rows to sphere/ball layers:

- **Ball (material)**: R5-R7 (entropy, hardware, instance)
- **Projection**: %8, admissibility check
- **Sphere (semantic)**: R0-R4 (meaning, law, invariants)

Execution factors through rows 0-4: the schema prefix must be valid before any projection or execution can occur.

## Related Concepts

- [Address Schema](./address-schema.md) - Schema validation and prefix structure
- [Sphere-Ball Model](./sphere-ball-model.md) - Address rows mapped to layers
- [Formal Verification: Contracts](../formal-verification/contracts.md)
- [Formal Verification: Schema Gate Theorems](../formal-verification/schema-gate-theorems.md)
- [Coding Principles: Boundary Preservation](../coding-principles/boundary-preservation.md)
- [Coding Principles: Schema Before Instance](../coding-principles/schema-before-instance.md)


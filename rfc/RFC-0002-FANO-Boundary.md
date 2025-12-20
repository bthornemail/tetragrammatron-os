# RFC 0002: FANO Boundary Module (PG(2,2))

**Status:** Proposed  
**Category:** Standards Track  
**Depends on:** RFC 0001 (BICF Core)  
**Author:** Brian Thorne

---

## 1. Abstract

This RFC specifies **FANO**, a Boundary module based on the finite projective plane **PG(2,2)**.  
FANO provides a minimal, deterministic **Pair-Cover Guarantee (PCG)**: in any triple of parameters, at least two determine a unique constraint while the third may vary freely.

This module is intended for use in **constraint systems, consensus mechanisms, error-detection layouts, and algebraic encodings** where non-canonical realization with invariant guarantees is required.

---

## 2. Conformance Language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are to be interpreted as described in RFC 2119.

---

## 3. Module Overview

### 3.1 What this module provides

FANO provides:

- A **Boundary** with fixed combinatorial invariants
- A **LineFamily** satisfying the Pair-Cover Guarantee
- A standard interface for realization and validation
- No privileged labeling, orientation, or representation

### 3.2 What this module does NOT provide

FANO does NOT provide:

- Randomness
- Probability
- Canonical coordinates
- Physical interpretation
- A required algebra (octonions are optional realizations)

---

## 4. Boundary Definition (Normative)

### 4.1 Universe

Let `U` be a finite set of **exactly seven elements**, called **Points**.

```
|U| = 7
```

---

### 4.2 LineFamily

Let `L ⊆ P(U)` be a set of **exactly seven subsets**, called **Lines**, such that:

```
∀ ℓ ∈ L, |ℓ| = 3
```

---

### 4.3 Incidence Axioms (Complete)

The pair `(U, L)` MUST satisfy all of the following:

1. **Uniqueness**
   ```
   ∀ p ≠ q ∈ U, ∃! ℓ ∈ L such that {p, q} ⊆ ℓ
   ```

2. **Non-degeneracy**
   ```
   ∀ ℓ ∈ L, ℓ contains exactly 3 distinct points
   ```

3. **Completeness**
   ```
   |L| = 7
   ```

These axioms are **necessary and sufficient**.  
No additional structure is assumed.

---

## 5. Pair-Cover Guarantee (PCG)

### 5.1 Formal Statement (Normative)

Given Boundary **FANO = (U, L)**:

> For every triple `T ⊆ U` with `|T| = 3`, there exists a line `ℓ ∈ L` such that:
>
> ```
> |T ∩ ℓ| ≥ 2
> ```

This property MUST hold for all valid realizations.

---

### 5.2 Interpretation (Non-normative)

- Any two points determine a unique constraint
- The third point is unconstrained
- Constraint consistency is invariant under relabeling

---

## 6. Boundary Interface

### 6.1 Abstract Interface

```coq
Parameter Point Line : Type.

Parameter Points : set Point.
Parameter Lines  : set Line.

Parameter Incident : Point -> Line -> Prop.
```

---

### 6.2 Required Properties

An implementation MUST provide proofs (or checks) of:

```coq
Axiom seven_points  : |Points| = 7.
Axiom seven_lines   : |Lines|  = 7.

Axiom line_size :
  ∀ ℓ ∈ Lines, |{ p ∈ Points | Incident p ℓ }| = 3.

Axiom unique_line :
  ∀ p q ∈ Points, p ≠ q ->
  ∃! ℓ ∈ Lines, Incident p ℓ ∧ Incident q ℓ.
```

---

## 7. Realization (Non-Canonical by Design)

### 7.1 RealizationChoice

A **RealizationChoice** MAY include:

- Point labels
- Line labels
- Bit-vector encodings
- Coordinate representations over 𝔽₂³
- Orientation data (if required by higher modules)

No RealizationChoice is privileged.

---

### 7.2 Realization Function

```coq
Realize_FANO : FANO_Boundary × RealizationChoice → Interior
```

Requirements:

- `Valid(i, FANO)` MUST hold for all realized Interiors
- Different choices MAY yield different Interiors
- All valid Interiors MUST satisfy the same PCG

---

## 8. Validation Rules

An Interior `i` is **Valid under FANO** iff:

1. It contains exactly 7 Points
2. It contains exactly 7 Lines
3. Each Line contains exactly 3 Points
4. Every pair of distinct Points lies on exactly one Line

No other checks are required.

---

## 9. Forbidden Practices (Normative)

Implementations of this module MUST NOT:

- Introduce probability or randomness into PCG
- Treat any labeling as canonical
- Encode semantic meaning into point identities
- Conflate realization with boundary definition

---

## 10. Reference Implementations (Informative)

Valid realizations include (but are not limited to):

- Nonzero vectors in 𝔽₂³ with linear subspaces as lines
- Bitmask representations of 3-element subsets
- Triple tables for incidence
- Graph-based encodings

All are equivalent **if and only if** they satisfy Section 4.

---

## 11. Conformance Tests (Normative)

An implementation is **FANO-compliant** iff:

- All axioms in Section 4 hold
- The PCG in Section 5 holds
- Validation rules in Section 8 pass
- No forbidden practices in Section 9 are present

Failure of any test is **non-conformance**.

---

## 12. Relationship to Other Modules (Informative)

- **RFC 0001** defines the Boundary–Interior framework
- Future RFCs MAY define:
  - Orientation modules (for octonions)
  - Automorphism-selection modules
  - Higher-order projective extensions

---

## 13. Conclusion

The FANO Boundary Module provides a **minimal, exact, non-probabilistic guarantee** for systems requiring pairwise constraint with free third variation. Its power lies not in geometry or algebra, but in the **combinatorial invariant** it enforces.

---

### End of RFC 0002

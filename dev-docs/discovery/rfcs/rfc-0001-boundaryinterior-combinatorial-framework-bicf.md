# RFC 0001: Boundary–Interior Combinatorial Framework (BICF)

**Status:** Proposed  
**Category:** Standards Track  
**Author:** Brian Thorne  
**Intended Audience:** Language designers, distributed-systems engineers, formal methods researchers

---

## 1. Abstract

This RFC defines the **Boundary–Interior Combinatorial Framework (BICF)**, a minimal axiomatic framework for describing systems in which **constraints (Boundaries)** are separated from **realizations (Interiors)**. The framework formalizes validity, realization, projection, and transformation in a way that eliminates ambiguity caused by metaphor, indexing conventions, or representation choices.

A canonical example using the **Fano plane PG(2,2)** is provided to illustrate **pairwise constraint with free third variation**, also known as the **Pair-Cover Guarantee**.

---

## 2. Conformance Language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** in this document are to be interpreted as described in RFC 2119.

---

## 3. Design Goals

BICF is designed to:

1. Separate **invariant constraints** from **chosen representations**
2. Eliminate synonym drift (“many ways to say the same thing”)
3. Support multiple realizations of the same structure without privileging one
4. Provide a common language across algebraic, geometric, and algorithmic systems
5. Remain independent of physics, probability, or metaphysical interpretation

---

## 4. Core Concepts (Normative)

### 4.1 Boundary

A **Boundary** is a constraint object.

A Boundary:

- MUST encode invariants, axioms, or admissibility conditions
- MUST NOT encode data, state, or execution
- MUST be independent of representation choices
- MAY be transformed only by Boundary-to-Boundary operations

Examples (informative):
- Type constraints
- Incidence axioms
- Schema definitions
- Algebraic laws

---

### 4.2 Interior

An **Interior** is a realized object that satisfies a Boundary.

An Interior:

- MUST be produced via an explicit Realization
- MUST NOT be considered canonical
- MAY differ from other Interiors while remaining valid

---

### 4.3 Validity

**Validity** is the sole satisfaction predicate.

```
Valid(i, b)
```

means that Interior `i` satisfies Boundary `b`.

All claims of “fit”, “match”, “compatibility”, or “alignment” MUST be expressed using `Valid`.

---

### 4.4 Realization

A **Realization** is an explicit function from a Boundary and a choice parameter to an Interior.

```
Realize : Boundary × RealizationChoice → Interior
```

Requirements:

- Every Interior MUST be traceable to a RealizationChoice
- Implicit or assumed realization is forbidden

---

### 4.5 Projection

A **Projection** maps an Interior to a View.

```
Project : Interior → View
```

Projection:

- MAY discard information
- MUST NOT introduce invalidity
- MUST NOT be used to define Validity

---

### 4.6 Transformation

A **Transformation** acts only on Boundaries.

```
Transform : Boundary → Boundary
```

Transformations:

- MUST preserve the meaning of Validity
- MUST NOT act directly on Interiors

---

## 5. Formal Core (Normative)

The minimal formal spine of BICF is:

```coq
Parameter Boundary Interior View RealizationChoice : Type.
Parameter Valid : Interior -> Boundary -> Prop.

Parameter Transform : Boundary -> Boundary.
Parameter Realize   : Boundary -> RealizationChoice -> Interior.
Parameter Project   : Interior -> View.
```

Any compliant system MUST be expressible in terms of these primitives.

---

## 6. The Pair-Cover Guarantee (Normative)

### 6.1 Definition

A **Pair-Cover Guarantee (PCG)** holds for a LineFamily `L` over a universe `U` if:

> For every triple `T ⊆ U` with `|T| = 3`, there exists a block `ℓ ∈ L` such that:
>
> ```
> |ℓ ∩ T| ≥ 2
> ```

### 6.2 Restrictions

- The term **“lottery” MUST NOT** be used in normative descriptions of PCG
- PCG is a **deterministic combinatorial guarantee**, not a probabilistic process

---

## 7. Canonical Example: Fano Plane PG(2,2)

### 7.1 Boundary Definition

The **Fano Plane Boundary (FANO)** is defined by the following axioms:

- Exactly 7 points
- Exactly 7 lines
- Each line contains exactly 3 points
- Any two distinct points lie on exactly one line

These axioms are complete.

---

### 7.2 Consequence

The LineFamily induced by FANO satisfies the Pair-Cover Guarantee.

This yields a system with:

- Three parameters per relation
- Any two parameters determining a unique constraint
- The third parameter varying freely without violating validity

---

## 8. Forbidden Practices (Normative)

The following are forbidden in normative BICF descriptions:

- Treating indexing conventions (0-based vs 1-based) as causal
- Identifying numeric zero with physical or logical vacuum
- Treating ψ, Δ, or similar operators as canonical or universal
- Claiming a single “true” or “preferred” Interior

Such language MAY appear only in Informative Appendices.

---

## 9. Informative Notes (Non-Normative)

- Geometry, algebra, and category theory may all be used as **representations** of BICF concepts
- The same Boundary may admit multiple equally valid realizations (e.g., different labelings, encodings, or orientations)
- FANO is used because it is the **minimal** structure exhibiting PCG, not because it is unique or metaphysically privileged

---

## 10. Security and Robustness Considerations

Systems designed using BICF gain robustness by:

- Making constraints explicit
- Preventing hidden assumptions
- Allowing verification of validity independent of representation

---

## 11. Conclusion

BICF provides a precise language for describing systems where **constraints are invariant** and **realizations are plural**. By enforcing explicit realization, separating transformation from data, and formalizing pairwise guarantees, BICF enables interoperable, analyzable, and extensible system design.

---

### End of RFC 0001

---

If you want next, I can:

- Generate **RFC 0002: Fano Boundary Module**
- Add a **conformance checklist** (“Is your system BICF-compliant?”)
- Rewrite this as a **conference paper abstract + intro**
- Produce a **one-page cheat sheet** for collaborators

Just say which one.

---

## You

Rfc 002

---

## ChatGPT

Below is **RFC 0002**, written to *layer cleanly on top of RFC 0001*.  
It defines **FANO as a Boundary module**, specifies **PCG formally**, and gives **conformance tests** you can actually run in code (R5RS / AAL / TS).

You can save this as `RFC-0002-FANO.md`.

---

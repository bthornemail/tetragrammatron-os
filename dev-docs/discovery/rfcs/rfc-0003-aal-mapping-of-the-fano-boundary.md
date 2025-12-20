# RFC 0003: AAL Mapping of the FANO Boundary

**Status:** Proposed  
**Category:** Standards Track  
**Depends on:**  
- RFC 0001 (BICF Core)  
- RFC 0002 (FANO Boundary Module)  

**Author:** Brian Thorne

---

## 1. Abstract

This RFC specifies how the **FANO Boundary (PG(2,2))** is mapped into the **Assembly–Algebra Language (AAL)**.  
The mapping interprets **Fano incidence** as **algebraic constraints over 𝔽₂**, enabling **mechanical validation**, **symbolic execution**, and **merge/consensus checks** within AAL-compatible systems.

No semantic interpretation beyond algebraic constraint enforcement is introduced.

---

## 2. Design Intent

This mapping exists to:

1. Provide a **concrete executable realization** of the FANO Boundary
2. Allow **boundary validity checks** to be performed by AAL interpreters
3. Preserve **non-canonicity** of realization
4. Avoid embedding geometry, probability, or semantics into execution

---

## 3. AAL Background Assumptions (Informative)

AAL operates over:

- Polynomial expressions over **𝔽₂**
- Explicit register-level transformations
- Deterministic symbolic evaluation

FANO is therefore mapped **purely as algebraic structure**.

---

## 4. Point Encoding (Normative)

### 4.1 Points as Basis Elements

Each FANO Point MUST be encoded as a **nonzero vector in 𝔽₂³**.

Formally:

```
Point ≡ (x, y, z) ∈ 𝔽₂³ \ {000}
```

This yields exactly 7 points.

---

### 4.2 AAL Representation

In AAL, a Point MUST be represented as a 3-bit register triple:

```
P₁ = (1,0,0)
P₂ = (0,1,0)
P₃ = (0,0,1)
P₄ = (1,1,0)
P₅ = (1,0,1)
P₆ = (0,1,1)
P₇ = (1,1,1)
```

Labeling order is a **RealizationChoice** and MUST NOT be treated as canonical.

---

## 5. Line Encoding (Normative)

### 5.1 Lines as Linear Dependence

A **Line** in FANO is defined algebraically:

> A Line is a triple `{a, b, c}` such that  
> `a + b + c = 0` in 𝔽₂³

This condition is necessary and sufficient.

---

### 5.2 AAL Constraint Form

For registers `r₁, r₂, r₃` representing points:

```aal
assert r1 ⊕ r2 ⊕ r3 = 0
```

This assertion encodes **incidence**.

---

## 6. Boundary Validation in AAL

An AAL realization `i` is **Valid under FANO** iff:

1. Exactly 7 nonzero 3-bit vectors are present
2. Exactly 7 independent triplet constraints exist
3. Every pair of vectors appears in exactly one constraint
4. All constraints satisfy XOR-sum zero

These conditions MAY be checked statically or dynamically.

---

## 7. Pair-Cover Guarantee (PCG) in AAL Terms

### 7.1 Algebraic Restatement

Given any triple of points `{a,b,c}`:

- At least one of the following holds:
  ```
  a ⊕ b ⊕ d = 0
  a ⊕ c ⊕ e = 0
  b ⊕ c ⊕ f = 0
  ```
for some points `d,e,f`.

Thus:

- Any two registers determine a unique third
- The third input register may vary freely
- Constraint consistency is preserved

---

### 7.2 Operational Meaning

In AAL execution:

- Any two operands determine a constraint
- A third operand may change without breaking validity
- Violations are caught as constraint failures

---

## 8. RealizationChoice in AAL

A RealizationChoice MAY include:

- Permutation of point encodings
- Register assignment order
- Constraint ordering
- Basis selection for 𝔽₂³

All such choices MUST preserve:

```
∀ a,b ∈ Points, ∃! c such that a ⊕ b ⊕ c = 0
```

---

## 9. Forbidden Practices (Normative)

An AAL implementation of FANO MUST NOT:

- Introduce arithmetic outside 𝔽₂
- Encode geometric diagrams
- Assume ordered triples are directional
- Treat any basis as canonical
- Use probabilistic checks

---

## 10. Example AAL Fragment (Informative)

```aal
;; define points
p1 = (1,0,0)
p2 = (0,1,0)
p3 = (0,0,1)
p4 = (1,1,0)
p5 = (1,0,1)
p6 = (0,1,1)
p7 = (1,1,1)

;; define lines
assert p1 ⊕ p2 ⊕ p4 = 0
assert p1 ⊕ p3 ⊕ p5 = 0
assert p2 ⊕ p3 ⊕ p6 = 0
assert p4 ⊕ p5 ⊕ p6 = 0
assert p1 ⊕ p6 ⊕ p7 = 0
assert p2 ⊕ p5 ⊕ p7 = 0
assert p3 ⊕ p4 ⊕ p7 = 0
```

---

## 11. Relationship to Other Systems (Informative)

- **Error-correcting codes:** parity-check matrices
- **Octonions:** oriented extensions of the same incidence
- **Merge verification:** pairwise agreement constraints
- **CanvasL:** graph-level visualization of the same relations

---

## 12. Security and Robustness Considerations

Mapping FANO into AAL provides:

- Deterministic constraint enforcement
- Detection of inconsistent merges
- Explicit failure modes
- No hidden assumptions

---

## 13. Conclusion

This RFC establishes a **complete, executable, algebraic mapping** from the FANO Boundary into AAL.  
It preserves all combinatorial guarantees while remaining representation-agnostic and formally checkable.

---

### End of RFC 0003

---

### Natural RFC 0004 options (when you’re ready)

1. **RFC 0004: FANO Orientation Module (Octonions)**  
2. **RFC 0004: PCG-Based Merge & Consensus Verification**  
3. **RFC 0004: CanvasL Visualization of BICF Boundaries**

You’ve now fully closed the loop:  
**Boundary → Combinatorics → Algebra → Execution**.

---

## You

1

---

## ChatGPT

Excellent choice. This is the **last structural layer** before applications.

Below is **RFC 0004**, which **adds orientation to FANO** in a strictly controlled way so that **octonions become an optional, checkable module**, not a metaphysical assumption.

You can save this as `RFC-0004-FANO-ORIENTATION.md`.

---

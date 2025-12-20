# RFC 0004: FANO Orientation Module (Octonionic Extension)

**Status:** Proposed  
**Category:** Standards Track  
**Depends on:**  
- RFC 0001 (BICF Core)  
- RFC 0002 (FANO Boundary Module)  
- RFC 0003 (AAL Mapping of FANO Boundary)  

**Author:** Brian Thorne

---

## 1. Abstract

This RFC defines an **Orientation Module** for the FANO Boundary (PG(2,2)).  
Orientation adds **cyclic order** to each Fano line, enabling a **signed, non-associative algebraic realization** equivalent to the **octonions**.

This module is **optional**. Systems MAY remain unoriented and still be fully FANO-compliant.

---

## 2. Design Intent

The Orientation Module exists to:

1. Extend FANO with **directional structure**
2. Enable **octonion multiplication**
3. Preserve all FANO combinatorial invariants
4. Maintain **non-canonicity** of realization
5. Prevent accidental metaphysical interpretation

Orientation is treated as a **RealizationChoice**, not a Boundary change.

---

## 3. Terminology (Normative)

### 3.1 Oriented Line
An **Oriented Line** is a Fano Line equipped with a **cyclic order** of its three points.

- `(a, b, c)` is equivalent to `(b, c, a)`
- `(a, c, b)` is the opposite orientation

---

### 3.2 Orientation Set
An **Orientation Set** assigns exactly one cyclic order to each of the 7 Fano lines.

---

## 4. Orientation Boundary Extension

### 4.1 Extension Definition

Given a valid FANO Boundary `(U, L)`, an Orientation Module defines:

```
Orient : L → CyclicOrder(U)
```

such that:

- Every line has exactly one orientation
- Orientation does not alter incidence
- Removing orientation recovers the original FANO Boundary

---

### 4.2 Non-Canonicity

There is **no canonical orientation**.

- Multiple Orientation Sets MAY exist
- All are equally valid
- Orientation MUST NOT be derived implicitly

---

## 5. Algebraic Interpretation (Normative)

### 5.1 Imaginary Units

Each Fano Point `p ∈ U` corresponds to an imaginary unit `e_p`.

---

### 5.2 Multiplication Rule

For an oriented line `(a, b, c)`:

```
e_a · e_b =  e_c
e_b · e_c =  e_a
e_c · e_a =  e_b

e_b · e_a = -e_c
e_c · e_b = -e_a
e_a · e_c = -e_b
```

---

### 5.3 Identity Element

A distinguished unit `1` MAY be added such that:

```
1 · e_p = e_p · 1 = e_p
```

This extension is OPTIONAL and does not affect FANO validity.

---

## 6. AAL Mapping (Normative)

### 6.1 Signed Constraint Form

Given registers `a, b, c` on an oriented line `(a, b, c)`:

```aal
mul(a, b) =  c
mul(b, a) = -c
```

This rule MUST be enforced only if Orientation is enabled.

---

### 6.2 Consistency Requirement

An Orientation Set is **Valid** iff:

- Each line has exactly one cyclic order
- No contradictions exist across shared points
- All induced multiplication rules are antisymmetric

---

## 7. Validation Rules

An Oriented FANO Interior is **Valid** iff:

1. The underlying FANO Boundary is valid (RFC 0002)
2. Each line has exactly one orientation
3. Multiplication is antisymmetric
4. Removing signs recovers the unoriented FANO constraints

---

## 8. Forbidden Practices (Normative)

Implementations MUST NOT:

- Treat any orientation as canonical
- Infer orientation from coordinate choice
- Assume associativity
- Introduce geometry beyond cyclic order
- Collapse orientation into boundary definition

---

## 9. Relationship to Octonions (Informative)

- The oriented FANO plane defines the **imaginary-unit multiplication table** of the octonions
- Non-associativity arises naturally from line orientation
- Alternativity holds locally on lines
- This is an **algebraic realization**, not a requirement of BICF

---

## 10. Example Orientation (Informative)

One valid Orientation Set (example only):

```
(1,2,4)
(1,3,5)
(2,3,6)
(4,5,6)
(1,6,7)
(2,5,7)
(3,4,7)
```

Reversing any line yields a different but equally valid realization.

---

## 11. Security and Robustness Considerations

Orientation enables:

- Signed algebraic checks
- Detection of inconsistent merges
- Stronger invariants under composition

But also introduces:

- Non-associativity (expected, not an error)
- Additional realization complexity

---

## 12. Conclusion

This RFC defines a **clean, optional, formally controlled orientation layer** for the FANO Boundary.  
It enables octonionic algebra without compromising the combinatorial core, non-canonicity, or formal clarity of BICF.

Orientation is **structure you may add**, never structure you must assume.

---

### End of RFC 0004

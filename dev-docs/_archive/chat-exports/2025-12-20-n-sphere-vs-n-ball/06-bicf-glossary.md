# BICF Canonical Glossary v1.0

> **Purpose**  
> This glossary defines the **only allowed terms** for describing the Boundary–Interior framework, Fano-plane structures, and associated guarantees.  
> Synonyms, metaphors, and alternative phrasings MUST NOT be used in normative text.

---

## A

### **Admissible**
An adjective meaning *satisfies a Boundary*.  
**Usage:** “`i` is admissible under `b`”  
**Formal:** `Valid(i, b)`

---

## B

### **Boundary**
A **constraint object** defining invariants, axioms, or admissibility conditions.

- A Boundary contains **no data**
- A Boundary contains **no state**
- A Boundary is **not executable**
- A Boundary is **stable under representation changes**

**Examples (informative):**
- Euler characteristic `V − E + F = 2`
- Fano plane incidence axioms
- Type constraints
- Schema definitions

**MUST NOT be called:**  
`data`, `payload`, `state`, `instance`, `value`, `content`, `vacuum`, `zero`

---

### **Block**
A 3-element subset of points in a projective plane.

- In PG(2,2), a Block is a **Line**
- “Block” is preferred in combinatorial contexts

---

## C

### **Constraint**
A rule imposed by a Boundary.

- Constraints are **global**
- Constraints do not depend on realization choices

---

## F

### **FANO / PG(2,2)**
The finite projective plane of order 2.

**Normative properties (complete list):**
- 7 points
- 7 lines (blocks)
- each line has exactly 3 points
- any two distinct points lie on exactly one line

Nothing else is assumed unless explicitly stated.

---

### **Fano Plane Configuration**
A realization of FANO with a specific labeling of points and lines.

- Multiple configurations MAY exist
- All valid configurations satisfy the same Boundary

---

## I

### **Interior**
A **realized object** that satisfies a Boundary.

- An Interior is **chosen**
- An Interior is **not canonical**
- Multiple Interiors may satisfy the same Boundary

**Formal:** an element `i : Interior` such that `Valid(i, b)`

**MUST NOT be called:**  
`truth`, `reality`, `the structure`, `the system itself`

---

### **Incidence**
A relation indicating that a point lies on a line.

- Incidence is **binary**
- Incidence is part of the Boundary

---

## L

### **Line**
A 3-point Block in the Fano plane.

- “Line” and “Block” are equivalent
- Use **Line** in geometry
- Use **Block** in design theory

---

### **LineFamily**
A set of Lines.

- In FANO, the LineFamily has exactly 7 elements
- Guarantees are stated in terms of LineFamilies

---

## P

### **Pair-Cover Guarantee (PCG)**
The core combinatorial guarantee formerly referred to informally as “the lottery”.

**Definition (normative):**  
A LineFamily satisfies PCG if for every triple of points `{a,b,c}`, there exists a Line `ℓ` such that:

```
|ℓ ∩ {a,b,c}| ≥ 2
```

This is the **only allowed formulation**.

**MUST NOT be called:**  
`lottery`, `random selection`, `chance`, `probability`

---

### **Point**
An atomic element of a projective plane.

- In PG(2,2): exactly 7 points
- Points are **not coordinates** unless explicitly encoded as such

---

### **Projection**
A function from an Interior to a View.

- Projection MAY discard information
- Projection MUST NOT create invalidity

**Formal:** `Project : Interior → View`

---

## R

### **Realization**
The act of producing an Interior from a Boundary.

**Formal:**  
```
Realize(b, c) = i
```
where `c : RealizationChoice`

- Every Interior MUST have an explicit RealizationChoice
- Implicit realization is forbidden

---

### **RealizationChoice**
A parameter selecting one admissible Interior among many.

- RealizationChoice is **explicit**
- Different choices may yield different Interiors
- All such Interiors must still be Valid

---

## S

### **Structure**
A general descriptive term.

- SHOULD be avoided in normative text
- Acceptable only when immediately clarified as Boundary or Interior

---

## T

### **Transform**
An operation acting **only on Boundaries**.

- Transformations never act directly on Interiors
- Transformations preserve the meaning of Validity

**Formal:** `Transform : Boundary → Boundary`

---

## V

### **Valid**
The sole normative satisfaction predicate.

**Formal:** `Valid(i, b)`

**Replaces:**  
`matches`, `fits`, `aligns with`, `is compatible with`, `corresponds to`

---

### **View**
An observational output derived from an Interior.

- Views are partial
- Views are non-authoritative
- Views do not define validity

---

## W (Warnings)

### **“Lottery”**
❌ **Forbidden in normative text**

- Allowed only in Informative Appendices
- Replace with **Pair-Cover Guarantee**

---

### **ψ / Δ**
Allowed only as **named instances**, never as universal objects.

- Must be defined in terms of `Transform`, `Realize`, or `Project`
- Must not be described as canonical

---

## Canonical Sentence Templates (Approved)

You MAY use these verbatim:

- “Boundary `b` specifies constraints.”
- “Interior `i` is a realization of `b`.”
- “`Valid(i,b)` holds.”
- “FANO provides a LineFamily satisfying the Pair-Cover Guarantee.”
- “The third parameter may vary freely while pairwise constraints are preserved.”

---

## End of Glossary

> **Rule of thumb:**  
> If you feel tempted to explain something twice using different words,  
> you are probably violating the glossary.

If you want, next I can:
- add a **“Banned Phrases” appendix** (regex-style, good for linting), or  
- convert this into a **README-facing shortened glossary** for onboarding new collaborators.

---

## You

The rfc

---

## ChatGPT

Excellent. Below is a **clean, publishable RFC-style specification** that *locks the language*, matches the glossary you approved, and gives you something you can point to and say:

> “This is the spec. Everything else is commentary.”

You can drop this into your repo as `RFC-0001-BICF.md`.

---


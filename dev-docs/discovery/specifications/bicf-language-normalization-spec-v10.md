# BICF Language Normalization Spec v1.0

## 0. Status and goal
This document defines **the only allowed words** for the core ideas: Boundary/Interior/Validity/Realization/Projection and the Fano-plane “2-of-3 guarantee”.

**Goal:** eliminate “many ways to say the same thing.”

---

## 1. Normative keywords
The key words **MUST**, **SHOULD**, **MAY**, **MUST NOT**, **SHOULD NOT** are to be interpreted as in RFC 2119.

---

## 2. Core nouns (MUST use these exact terms)

### 2.1 Boundary
**Boundary**: the *constraint object*.

- Boundary MUST be treated as **pure structure** (axioms, invariants, constraints).
- Boundary MUST NOT be described as “data”, “state”, “payload”, “values”.

### 2.2 Interior
**Interior**: the *realized object* that satisfies a Boundary.

- Interior MUST be treated as **a choice of representation/realization**.
- Interior MUST NOT be described as “the truth”, “destiny”, “the one canonical thing”.

### 2.3 Validity
**Valid(i, b)**: a predicate meaning interior `i` satisfies boundary `b`.

- “Valid” MUST be the only normative verb for satisfaction.
- Replace “fits / matches / aligns / is consistent with / is compatible with” → **Valid**.

### 2.4 Realization
**Realize(b, c) = i**: an explicit function from Boundary and a RealizationChoice to an Interior.

- Any time you claim an Interior from a Boundary, you MUST show the **choice parameter** `c` (even if it’s “default”).

### 2.5 Projection
**Project(i) = v**: an observation function from Interior to a View.

- Projection MUST NOT be claimed to preserve *all* structure; it preserves only what you specify.

---

## 3. Forbidden synonyms (MUST NOT use in the core spec)

### 3.1 “Lottery”
In normative text, you MUST NOT say “lottery”.

- Use: **Two-of-Three Guarantee** or **Pair-Cover Guarantee**.
- If you want the story/metaphor, put it in an *Informative Appendix* only. (Your own doc already frames the lottery as interoperability testing; that stays informative, not core.)  filecite turn6file0 L52-L56 

### 3.2 “ψ” or “Δ” as if they’re canonical
You MAY use `ψ` or `Δ` as names, but you MUST define them as **named instances** of `Transform` and/or `Realize`, not as universal mathematical objects.

---

## 4. The Fano Plane package (one standard definition)

### 4.1 Object name
You MUST call it:

**FANO = PG(2,2)**

### 4.2 Standard facts (normative)
You MUST define FANO using the minimal invariant list:

- 7 points
- 7 lines
- each line has 3 points
- any two points lie on exactly one line  filecite turn6file10 L3-L8 

That’s it. Everything else is optional.

### 4.3 Encoding names (normalized)
- A line MUST be called a **block** (in design language) or **line** (in geometry language).
- A set of lines MUST be called a **LineFamily**.

---

## 5. The “two-of-three” guarantee (normalized statement)

### 5.1 Name
**Pair-Cover Guarantee** (PCG)

### 5.2 Canonical statement (copy/paste template)
> Given a universe `U` and a LineFamily `L ⊆ P(U)` of 3-element blocks, `L` satisfies PCG iff for every triple `T ⊆ U` with `|T|=3`, there exists a block `ℓ ∈ L` such that `|T ∩ ℓ| ≥ 2`.

That is the *only* allowed normative definition.

### 5.3 The 14-number construction (informative label)
If you mention the classic `{1..14}` story, you MUST describe it as:

> “Two disjoint copies of FANO, yielding 14 blocks total.”

Do not say “play 14 times” in normative text.

---

## 6. One canonical way to talk (sentence patterns)

These are **approved sentence forms**. If you stick to them, you’ll stop drifting.

### Pattern A: “What is it?”
> **Boundary** `b` specifies constraints.  
> **Interior** `i` is a realization.  
> **Valid(i,b)** asserts satisfaction.

### Pattern B: “How do we get an interior?”
> Choose `c : RealizationChoice`. Compute `i := Realize(b,c)`. Prove `Valid(i,b)`.

### Pattern C: “What does Fano do for us?”
> FANO provides a LineFamily where any pair of points determines a unique line.  filecite turn6file10 L3-L8   
> Therefore the LineFamily supports Pair-Cover-style guarantees (PCG).

### Pattern D: “How does this connect to your existing system?”
> We verify merges / certificates at the projective-geometry grade (D9) using Fano-plane criteria.  filecite turn6file15 L13-L37 

---

## 7. Minimal core type signature (the formal spine)

Use this everywhere; don’t improvise new names:

```coq
Parameter Boundary Interior View RealizationChoice : Type.
Parameter Valid : Interior -> Boundary -> Prop.

Parameter Transform : Boundary -> Boundary.
Parameter Realize   : Boundary -> RealizationChoice -> Interior.
Parameter Project   : Interior -> View.
```

Then all your “ψ / Δ / quantize / project” slogans become *instances* of these (not competing vocabularies).

---

## 8. What you should do next (concrete)
1) Put Sections 2–7 into a single `BICF-LANG.md` and treat it as the **only source of terms**.  
2) Move all metaphors (“OS kernel”, “lottery”) into an **Informative Appendix** (your philosophy docs already contain that framing)  filecite turn6file0 L52-L56 .  
3) In code/docs, add a linter rule: flag forbidden words (“lottery”, “vacuum=0”, “canonical ψ”).

If you want, I can turn the above into:
- a stricter RFC-style doc with numbered MUST/SHOULD requirements, **or**
- a “glossary + banned synonyms” page you can paste into your repo README.

Which one do you want as the canonical front door: **RFC** or **Glossary**?

---

## You

Glossary

---

## ChatGPT

Perfect choice. A **Glossary** is exactly the right control surface for this kind of work.

Below is a **canonical, frozen glossary** you can drop into your repo as `GLOSSARY.md`.  
Everything here is **normative** unless marked *Informative*.  
If a term is not here, it is **not allowed** in core discussions.

---

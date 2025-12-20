# Tetragrammatron-OS Formal Invariants

**Status:** Normative  
**Scope:** Applies to all CanvasL specs, CAN-ISA bytecode, Origami Fold VM execution, projections, and repository merges (RFC-0011).

## 0. Notation

- Let `State` be the canonical machine state.
- Let `Step : State → Instr → State` be execution.
- Let `Norm : State → State` be canonical normalization.
- Let `Proj_Fano : State → Fano` be the canonical projection to the Fano plane representation.
- Let `Encode : State → Bytes` and `Decode : Bytes → State` be the binary codec pair.
- Let `Meet` and `Join` be the lattice operators (intended: `Meet ≈ GCD`, `Join ≈ LCM`) defined over the canonical algebraic representation of state.

Where needed, we also use:
- `hash : Bytes → Digest` (e.g., SHA-256) as an observation operator
- `≈` meaning observational equivalence after normalization

---

## 1. Canonical Representation Invariants

### INV-1: Normalization Idempotence
Normalization MUST be idempotent.

**Law:**  
`Norm(Norm(s)) = Norm(s)`

**Operational check:** calling CANON twice yields identical bytes.

---

### INV-2: Normalization is Semantics-Preserving
Normalization MUST not change projected semantics.

**Law:**  
`Proj_Fano(Norm(s)) = Proj_Fano(s)`

---

### INV-3: Encode/Decode Roundtrip (Soundness)
The codec MUST roundtrip to the same normalized state.

**Law:**  
`Norm(Decode(Encode(Norm(s)))) = Norm(s)`

---

### INV-4: Canonical Encoding Uniqueness
Two states that normalize to the same canonical state MUST encode identically.

**Law:**  
If `Norm(a) = Norm(b)` then `Encode(Norm(a)) = Encode(Norm(b))`

This is the “no ambiguous serialization” guarantee.

---

## 2. Determinism Invariants

### INV-5: Step Determinism
Execution MUST be deterministic given identical inputs.

**Law:**  
If `Encode(Norm(s1)) = Encode(Norm(s2))` and `i1 = i2` then  
`Encode(Norm(Step(s1,i1))) = Encode(Norm(Step(s2,i2)))`

---

### INV-6: Replay Determinism
A record of instructions MUST replay to the same final state.

**Law:**  
Let `Run(s, prog)` fold `Step` over a program list. Then:  
`Encode(Norm(Run(s, prog)))` is a pure function of `(Encode(Norm(s)), Encode(prog))`.

---

## 3. Lattice / Fold Invariants

These are the “origami fold semantics” invariants.

### INV-7: Meet/Join Idempotence
**Law:**  
`Meet(x,x) = x`  
`Join(x,x) = x`

---

### INV-8: Meet/Join Commutativity
**Law:**  
`Meet(x,y) = Meet(y,x)`  
`Join(x,y) = Join(y,x)`

---

### INV-9: Meet/Join Associativity
**Law:**  
`Meet(x, Meet(y,z)) = Meet(Meet(x,y), z)`  
`Join(x, Join(y,z)) = Join(Join(x,y), z)`

---

### INV-10: Absorption (Key Lattice Law)
**Law:**  
`Meet(x, Join(x,y)) = x`  
`Join(x, Meet(x,y)) = x`

This is the mathematical form of “fold closure.”

---

### INV-11: Projection-Homomorphism (Fold Commutes with Projection)
Fano projection MUST respect meet/join.

**Law:**  
`Proj_Fano(Meet(x,y)) = Meet_Fano(Proj_Fano(x), Proj_Fano(y))`  
`Proj_Fano(Join(x,y)) = Join_Fano(Proj_Fano(x), Proj_Fano(y))`

(Where `Meet_Fano/Join_Fano` are the induced operations on the Fano representation.)

---

## 4. Fano Consistency Invariants

### INV-12: Fano Structural Validity
Every projected state MUST be a valid Fano incidence structure.

**Law:**  
For `F = Proj_Fano(s)`:
- `|Points(F)| = 7`
- `|Lines(F)| = 7`
- Each line contains exactly 3 points
- Each point lies on exactly 3 lines
- Any two distinct points share exactly one line
- Any two distinct lines intersect in exactly one point

**Runtime check:** `PROJ_FANO` MUST fail closed if invalid.

---

### INV-13: Fano-Triad Closure (3-way Consistency)
For triads `(a,b,c)` declared “compatible”, the pairwise meets must be non-trivial and consistent.

**Law (one checkable form):**
- `Meet(a,b) ≠ ⊥`, `Meet(b,c) ≠ ⊥`, `Meet(c,a) ≠ ⊥`
- and `Meet(a, Join(b,c)) = Meet(a,b) ∨ Meet(a,c)` (implementation chooses exact rule)

This is your “triad is a line” enforcement.

---

## 5. Time & Physical Constraint Invariants

### INV-14: Time Must Be Explicit When Used
If any instruction reads or depends on time, that time must be sourced from a declared clock.

**Law:**  
No instruction may reference time unless `Clock` is present in state and initialized.

---

### INV-15: Barrier Monotonicity
Barriers must be monotone and cannot be “un-barriered” without an explicit state transition.

**Law:**  
If `Barrier(s)` holds, and `Step(s,i)=s'`, then either:
- `Barrier(s')` holds, or
- `i` is an explicit barrier-release instruction permitted by policy

---

## 6. Self-Modification Safety Invariants

### INV-16: Patch Must Be Sealed Before Apply
Self-modifying writes MUST not execute until sealed.

**Law:**  
If `PatchOpen(s)` then `EXEC`/`JUMP` into patched region MUST be rejected.

---

### INV-17: Patch Apply is Atomic
A patch apply must be all-or-nothing.

**Law:**  
There exists no intermediate state where partially applied patched bytes are visible to execution.

---

### INV-18: Patch Proof-Carrying Requirement (Optional Strict Mode)
In strict mode, applying a patch requires a proof artifact whose hash matches the patch.

**Law:**  
`PATCH_APPLY` requires `hash(patch_bytes)=declared_hash` AND `proof_ref` verifies.

---

## 7. Repository / Merge Invariants

These are the invariants that let “git merges behave like folds”.

### INV-19: Merge is a Join with Canonical Normalization
Merging branches MUST be representable as `Join` at the semantic layer.

**Law:**  
`Merge(a,b) = Norm(Join(a,b))`

---

### INV-20: Merge Must Preserve Fano Consistency
A merge that violates Fano validity MUST be rejected.

**Law:**  
If `¬ValidFano(Proj_Fano(Merge(a,b)))` then merge is invalid.

---

## 8. Observational Invariants (Hashes / Logs)

### INV-21: Observations Derive from Canonical Bytes Only
Hashes MUST be computed from canonical bytes, not runtime artifacts.

**Law:**  
`Obs(s) = hash(Encode(Norm(s)))`

No timestamps, no platform fields, no device IDs unless explicitly modeled.

---

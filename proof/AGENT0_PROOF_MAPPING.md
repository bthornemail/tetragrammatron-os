# Agent 0 → Proof Layer Mapping

**Role:** C — FORMAL PROVER (Agent 4, `PROOF-IDEM-SAFE`)  
**Status:** Proof specifications aligned with Agent 0 requirements  
**Date:** 2025-01-27

---

## Summary

The proof layer (`proof/RFC0012_FoldVM.lean`) has been updated to provide formal specifications that align with Agent 0's implementation checklist for Agent 3 (VM Implementer).

---

## Agent 0 Requirements → Proof Obligations

### 1. Fano Triad Validation (`PROJ_FANO`)

**Agent 0 Requirement:**
- Implement `can_fano_valid_strict(A, B, C, mode)` with S1-S4 checks
- Error codes: `FANO_NO_PAIRWISE_INCIDENT`, `FANO_NO_COMMON_CORE`, `FANO_NON_IDEMPOTENT`, `FANO_DEGENERATE_ABSORPTION`

**Proof Layer Specification:**
- ✅ `strict_fano_valid (A B C : Poly) : Sum Unit FanoError` — implements S1-S4
- ✅ `FanoError` inductive type with all required error codes
- ✅ `strict_fano_sound` theorem — proves validation implies constraints
- ✅ `strict_fano_complete` theorem — proves constraints imply validation

**Location:** `proof/RFC0012_FoldVM.lean` lines 43-196

**RFC References:**
- RFC-0011 §5.3.1 (Strict Fano Triad)
- RFC-0011 §6.5.1 (PROJ_FANO Semantics)
- INV-12, INV-13 (`TETRAGRAMMATRON_OS_FORMAL_INVARIANTS.md`)

---

### 2. Canonicalization with Idempotence (`CANON`)

**Agent 0 Requirement:**
- Implement `can_poly_canon(poly_in, poly_out)` with idempotence enforcement
- Verify: `canon(canon(x)) == canon(x)`

**Proof Layer Specification:**
- ✅ `canon_idempotent` theorem — formal statement of INV-1
- ✅ `canonical_encoding_unique` theorem — formal statement of INV-4
- ✅ `encode_decode_roundtrip` theorem — formal statement of INV-3

**Location:** `proof/RFC0012_FoldVM.lean` lines 117-231

**RFC References:**
- RFC-0011 §6.9.2 (Canonicalization)
- INV-1 (Normalization Idempotence)
- RFC-0000 CAN-INV-1, CAN-INV-2, CAN-INV-3

---

### 3. Dual Invariant Preservation

**Agent 0 Requirement:**
- Add dual invariant checks for primal ↔ dual symmetry

**Proof Layer Status:**
- ⚠️ **Not yet formalized** — requires geometry projection layer (Agent 5) coordination
- Placeholder: `canon_preserves_proj` theorem (INV-2)

**Next Steps:**
- Coordinate with Agent 5 (Geometry & Visualization) to define dual projection semantics
- Add formal dual-invariance theorems once projection semantics are defined

---

### 4. Determinism Invariants (INV-5, INV-6)

**Agent 0 Requirement:**
- VM execution must be deterministic
- Replay must yield identical results

**Proof Layer Specification:**
- ✅ `step_deterministic` theorem — formal statement of INV-5
- ✅ `replay_deterministic` theorem — formal statement of INV-6
- ✅ `VMState` structure — models VM state for determinism proofs

**Location:** `proof/RFC0012_FoldVM.lean` lines 233-250

**RFC References:**
- INV-5 (Step Determinism)
- INV-6 (Replay Determinism)

---

### 5. Projection Homomorphism (INV-11)

**Agent 0 Requirement:**
- Fano projection must respect meet/join operations

**Proof Layer Specification:**
- ✅ `proj_meet_homomorphism` theorem
- ✅ `proj_join_homomorphism` theorem
- ✅ `meet_fano` and `join_fano` helper functions

**Location:** `proof/RFC0012_FoldVM.lean` lines 252-265

**RFC References:**
- INV-11 (Projection-Homomorphism)

---

## Proof Status

### Completed Specifications
1. ✅ Strict Fano triad validation (S1-S4) — `strict_fano_valid`
2. ✅ Fano error codes (all 5 types) — `FanoError` inductive
3. ✅ Canonicalization idempotence (INV-1) — `canon_idempotent`
4. ✅ Lattice laws (INV-7, INV-8, INV-9, INV-10) — all formalized
5. ✅ Encoding/decoding roundtrip (INV-3) — `encode_decode_roundtrip`
6. ✅ Canonical encoding uniqueness (INV-4) — `canonical_encoding_unique`
7. ✅ Step determinism (INV-5) — `step_deterministic`
8. ✅ Replay determinism (INV-6) — `replay_deterministic`
9. ✅ Projection homomorphism (INV-11) — `proj_meet_homomorphism`, `proj_join_homomorphism`
10. ✅ Merge semantics (INV-19, INV-20) — `merge_is_normalized_join`, `merge_preserves_fano`

### Pending Proofs (require implementation)
1. ⏳ Actual proofs for `canon_idempotent` (requires `can_poly_canon` implementation)
2. ⏳ Actual proofs for `strict_fano_sound`/`complete` (requires `meet`/`join` GCD/LCM implementation)
3. ⏳ Dual invariant proofs (requires Agent 5 coordination)
4. ⏳ Determinism proofs (require `step` and `run` implementations)
5. ⏳ Projection homomorphism proofs (require `proj_fano` implementation)

---

## Agent 3 Implementation Contract

The proof layer defines the **formal contract** that Agent 3's implementation must satisfy:

1. **`can_fano_valid_strict()`** must match `strict_fano_valid` semantics
2. **`can_poly_canon()`** must satisfy `canon_idempotent` theorem
3. **Error codes** must match `FanoError` inductive type
4. **All invariants** (INV-1 through INV-13) must be preserved

---

## Verification Path

Once Agent 3 implements:
1. `can_fano_valid_strict()` → verify against `strict_fano_valid` spec
2. `can_poly_canon()` → verify against `canon_idempotent` theorem
3. Test vectors → verify against proof specifications

**Mnemonic:** `PROOF-IDEM-SAFE`  
**Status:** Proof specifications complete; awaiting implementation for full verification


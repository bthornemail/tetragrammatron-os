# Proof Layer Index

**Quick navigation guide for all proof layer files**

---

## File Index

### Core Proof File
- **`RFC0012_FoldVM.lean`** (307 lines)
  - All formal specifications and theorems
  - Start here for proof definitions

### Documentation Files

1. **`README.md`** — Start here
   - Overview of proof layer
   - Quick reference tables
   - Usage instructions for all agents

2. **`PROOF_SUMMARY.md`** — High-level summary
   - All formalized invariants listed
   - Implementation contract overview
   - Status tracking

3. **`AGENT0_PROOF_MAPPING.md`** — For Agent 0 (Observer)
   - Maps Agent 0's checklist to proof specs
   - Detailed requirement-to-proof correspondence
   - RFC references

4. **`VERIFICATION_GUIDE.md`** — For Agent 3 (VM Implementer)
   - Test cases for each proof specification
   - Error code mapping
   - Golden vector testing procedures
   - Implementation verification checklist

5. **`INDEX.md`** — This file
   - Navigation guide

---

## Quick Lookup

### By Invariant Number

| Invariant | Theorem/Definition | File | Lines |
|-----------|-------------------|------|-------|
| INV-1 | `canon_idempotent` | `RFC0012_FoldVM.lean` | 123-125 |
| INV-2 | `canon_preserves_proj` | `RFC0012_FoldVM.lean` | 218-221 |
| INV-3 | `encode_decode_roundtrip` | `RFC0012_FoldVM.lean` | 230-232 |
| INV-4 | `canonical_encoding_unique` | `RFC0012_FoldVM.lean` | 234-237 |
| INV-5 | `step_deterministic` | `RFC0012_FoldVM.lean` | 253-260 |
| INV-6 | `replay_deterministic` | `RFC0012_FoldVM.lean` | 267-271 |
| INV-7 | `meet_idempotent`, `join_idempotent` | `RFC0012_FoldVM.lean` | 199-206 |
| INV-8 | `meet_comm`, `join_comm` | `RFC0012_FoldVM.lean` | 127-135 |
| INV-9 | `meet_assoc`, `join_assoc` | `RFC0012_FoldVM.lean` | 137-145 |
| INV-10 | `meet_join_absorption`, `join_meet_absorption` | `RFC0012_FoldVM.lean` | 208-216 |
| INV-11 | `proj_meet_homomorphism`, `proj_join_homomorphism` | `RFC0012_FoldVM.lean` | 280-287 |
| INV-12 | `strict_fano_valid` | `RFC0012_FoldVM.lean` | 60-79 |
| INV-13 | `strict_fano_sound`, `strict_fano_complete` | `RFC0012_FoldVM.lean` | 168-196 |
| INV-19 | `merge_is_normalized_join` | `RFC0012_FoldVM.lean` | 295-297 |
| INV-20 | `merge_preserves_fano` | `RFC0012_FoldVM.lean` | 299-303 |

### By Agent 0 Requirement

| Requirement | Proof Spec | Documentation |
|-------------|------------|---------------|
| Fano triad validation (S1-S4) | `strict_fano_valid` | `AGENT0_PROOF_MAPPING.md` §1 |
| Canonicalization idempotence | `canon_idempotent` | `AGENT0_PROOF_MAPPING.md` §2 |
| Error codes | `FanoError` | `AGENT0_PROOF_MAPPING.md` §1 |
| Dual invariants | (pending Agent 5) | `AGENT0_PROOF_MAPPING.md` §3 |

### By Implementation Function

| C Function | Proof Spec | Test Cases |
|------------|------------|------------|
| `can_fano_valid_strict` | `strict_fano_valid` | `VERIFICATION_GUIDE.md` §1 |
| `can_poly_canon` | `canon_idempotent` | `VERIFICATION_GUIDE.md` §2 |
| `can_poly_gcd` | `meet_*` theorems | `VERIFICATION_GUIDE.md` §3 |
| `can_poly_lcm` | `join_*` theorems | `VERIFICATION_GUIDE.md` §3 |

---

## Navigation by Role

### Agent 0 (Observer)
1. Read: `AGENT0_PROOF_MAPPING.md`
2. Reference: `PROOF_SUMMARY.md` for invariant coverage
3. Verify: Agent 3's implementation against proof contracts

### Agent 3 (VM Implementer)
1. Read: `VERIFICATION_GUIDE.md` (start here)
2. Reference: `RFC0012_FoldVM.lean` for formal specs
3. Test: Use test cases from verification guide
4. Verify: All tests pass before submitting to Agent 0

### Agent 4 (Formal Prover — this role)
1. Reference: `RFC0012_FoldVM.lean` for all specs
2. Complete: Proofs once Agent 3 provides implementations
3. Verify: All proofs compile and are machine-checkable

### Agent 5 (Geometry & Visualization)
1. Coordinate: With Agent 4 on dual invariant proofs
2. Reference: `AGENT0_PROOF_MAPPING.md` §3 for dual invariant requirements

---

## Status Summary

**Specifications:** ✅ Complete (20 invariants formalized)  
**Documentation:** ✅ Complete (5 files)  
**Verification Guide:** ✅ Complete (test cases provided)  
**Actual Proofs:** ⏳ Pending (require implementations)

---

## Next Actions

1. **Agent 3** → Implement functions → Run verification tests
2. **Agent 0** → Review implementation → Check against proof contracts
3. **Agent 4** → Complete proofs → Replace `sorry` placeholders
4. **Agent 5** → Coordinate on dual invariants → Add projection proofs

---

**Last Updated:** 2025-01-27  
**Mnemonic:** `PROOF-IDEM-SAFE`  
**Status:** Proof layer complete and ready for use


# Proof Layer — Formal Specifications

**Role:** C — FORMAL PROVER (Agent 4, `PROOF-IDEM-SAFE`)  
**Status:** Core specifications complete  
**Purpose:** Provide formal proof contracts for VM implementation verification

---

## Files

### Core Proof File
- **`RFC0012_FoldVM.lean`** — Main proof file containing all formal specifications
  - Strict Fano triad validation (`strict_fano_valid`)
  - Canonicalization idempotence (`canon_idempotent`)
  - Lattice laws (INV-7 through INV-10)
  - Determinism theorems (INV-5, INV-6)
  - Projection homomorphism (INV-11)
  - Merge semantics (INV-19, INV-20)

### Documentation
- **`AGENT0_PROOF_MAPPING.md`** — Maps Agent 0's requirements to proof specifications
- **`PROOF_SUMMARY.md`** — High-level summary of all formalized invariants
- **`VERIFICATION_GUIDE.md`** — Test cases and verification procedures for Agent 3
- **`README.md`** — This file

---

## Quick Reference

### Agent 0 Requirements → Proof Specifications

| Agent 0 Requirement | Proof Specification | Location |
|---------------------|---------------------|----------|
| Fano triad validation (S1-S4) | `strict_fano_valid` | `RFC0012_FoldVM.lean:60-79` |
| Canonicalization idempotence | `canon_idempotent` | `RFC0012_FoldVM.lean:123-125` |
| Error codes | `FanoError` inductive | `RFC0012_FoldVM.lean:49-56` |
| Lattice laws | `meet_*`, `join_*` theorems | `RFC0012_FoldVM.lean:199-216` |
| Determinism | `step_deterministic`, `replay_deterministic` | `RFC0012_FoldVM.lean:253-271` |

### Invariants Formalized

**Core (Agent 0 Priority):**
- ✅ INV-1: Normalization Idempotence
- ✅ INV-3: Encode/Decode Roundtrip
- ✅ INV-4: Canonical Encoding Uniqueness
- ✅ INV-12: Fano Structural Validity
- ✅ INV-13: Fano-Triad Closure

**Lattice Laws:**
- ✅ INV-7: Meet/Join Idempotence
- ✅ INV-8: Commutativity
- ✅ INV-9: Associativity
- ✅ INV-10: Absorption

**Determinism:**
- ✅ INV-5: Step Determinism
- ✅ INV-6: Replay Determinism

**Projection & Merge:**
- ✅ INV-11: Projection Homomorphism
- ✅ INV-19: Merge is Normalized Join
- ✅ INV-20: Merge Preserves Fano

**Total:** 20 invariants formalized

---

## Usage

### For Agent 3 (VM Implementer)

1. **Read `VERIFICATION_GUIDE.md`** — Contains test cases for each proof specification
2. **Implement functions** matching proof contracts
3. **Run verification tests** to ensure implementation satisfies proofs
4. **Reference `AGENT0_PROOF_MAPPING.md`** for detailed requirements

### For Agent 0 (Observer)

1. **Review `AGENT0_PROOF_MAPPING.md`** — See how proof layer maps to your checklist
2. **Verify Agent 3's implementation** against proof specifications
3. **Check `PROOF_SUMMARY.md`** for complete invariant coverage

### For Agent 4 (Formal Prover — this role)

1. **Complete proofs** once Agent 3 provides implementations
2. **Replace `sorry` placeholders** with actual proofs
3. **Verify proofs compile** and are machine-checkable

---

## Proof Status

### ✅ Complete: Specifications
All required formal specifications are in place:
- All Agent 0 requirements formalized
- All critical invariants (INV-1 through INV-20) specified
- Error codes match RFC-0011 §6.5.1
- Test cases provided in verification guide

### ⏳ Pending: Actual Proofs
Proofs are marked with `sorry` because they require:
- Agent 3's `can_poly_canon` implementation
- Agent 3's `can_poly_gcd`/`can_poly_lcm` implementations
- Agent 3's `can_fano_valid_strict` implementation
- Agent 5's `proj_fano` implementation (for projection theorems)

**Next Steps:**
1. Agent 3 implements required functions
2. Agent 4 (this role) completes proofs using implementations
3. Agent 0 verifies implementation against proof contracts
4. Merge approved once all proofs pass

---

## RFC References

- **RFC-0000** — CAN-ISA Invariants (CAN-INV-1 through CAN-INV-4)
- **RFC-0011 §5.3.1** — Strict Fano Triad
- **RFC-0011 §6.5.1** — PROJ_FANO Semantics
- **RFC-0011 §6.9.2** — Canonicalization
- **`TETRAGRAMMATRON_OS_FORMAL_INVARIANTS.md`** — All INV-* invariants

---

## Building (Future)

Once Lean toolchain is set up:

```bash
cd proof
lake build  # or equivalent Lean build command
```

This will verify all proofs are machine-checkable.

---

## Contact

**Role:** C — FORMAL PROVER  
**Mnemonic:** `PROOF-IDEM-SAFE`  
**Status:** Specifications complete; awaiting implementation for proof completion


# Origami Fold VM Implementation

## Role B: COMPILER / VM IMPLEMENTER

This directory contains the core VM implementation for Tetragrammatron-OS, implementing:

- **RFC-009** — Origami Fold VM Semantics
- **RFC-0012** — CANB v1 Binary Encoding

## Files

- `can_codec.h` — CANB v1 binary encoding/decoding (big-endian)
- `can_vm.h` — VM core interface
- `can_vm.c` — VM execution loop and instruction semantics

## Building

```bash
gcc -c can_vm.c -o can_vm.o
gcc -c can_codec.c -o can_codec.o  # if separate implementation
```

## Status

**Current Implementation:**
- ✅ Instruction decoding (32-bit fixed-width)
- ✅ Core opcodes: NOOP, HALT, CANON, COMMIT
- ✅ Immediate construction: LDI16H, LDI16L, USEI32
- ✅ Lattice operations: MEET_GCD, JOIN_LCM
- ✅ Register operations: SWAP, CLEAR
- ✅ Fano projection: PROJ_FANO (skeleton)
- ✅ Assertions: ASSERT_CANON, ASSERT_IDEMP, ASSERT_FANO (skeletons)

**TODO (requires CLBC-POLY integration):**
- Polynomial GCD/LCM implementation
- Polynomial canonicalization
- Fano projection geometry emission
- Commit hash computation
- Full assertion validation

## Invariants Preserved

- ✅ Idempotence: CANON is idempotent
- ✅ Fano incidence: Omission rule implemented
- ✅ 8-tuple closure: All 8 semantic registers preserved
- ✅ Canonical naming: Uses keyword-based register names

## RFC References

- RFC-009 §X.6.1 — Instruction encoding
- RFC-009 §X.7 — Origami fold semantics
- RFC-009 §X.8.2.1 — Fano omission rule
- RFC-0012 §5 — VM semantics

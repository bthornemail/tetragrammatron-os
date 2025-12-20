# RFC Index — Tetragrammatron-OS

**Status:** Normative  
**Mnemonic:** `RFC-CANON-LAW`

This directory contains the normative Request for Comments (RFC) documents that define the Tetragrammatron-OS specification.

---

## RFC List

### RFC-0000 — CAN-ISA Invariants
**File:** `RFC-0000-can-isa-invariants.md`  
**Status:** Normative  
**Scope:** Core invariants that MUST be preserved by all CAN-ISA operations

Defines the fundamental invariants for:
- Canonical idempotence
- Encoding uniqueness
- Decode/encode soundness
- Deterministic execution
- Lattice (fold) invariants
- Fano projection invariants
- Time and physical constraint invariants
- Self-modifying code invariants

**Foundation:** All other RFCs implement and preserve RFC-0000 invariants.

---

### RFC-0009 — Origami Fold VM Semantics
**File:** `RFC-0009-origami-fold-vm.md`  
**Status:** Normative  
**Scope:** VM instruction semantics, opcodes, and execution model

Defines:
- 8-tuple semantic register model
- Instruction encoding format (32-bit fixed-width)
- Core opcodes (CANON, MEET, JOIN, PROJ_FANO, etc.)
- Barrier semantics
- Fano projection details
- Execution determinism requirements

**Implements:** RFC-0000 (CAN-ISA Invariants)  
**Referenced by:** RFC-0012, RFC-0013

---

### RFC-0011 — Repository Kernel Lattice
**File:** `RFC-0011-repo-lattice.md`  
**Status:** Normative  
**Scope:** Repository structure, branch topology, and Fano-safe merge semantics

Defines:
- 8 semantic axes (state, symbol, boundary, relation, transition, source, terminal, rejection)
- Repository layers (main, current, feature/<axis>)
- Lattice structure (8³ nodes)
- Propagation semantics (monotone transforms)
- Fano-triad validation for merges
- State encoding (canonical JSON, bytecode)

**Implements:** RFC-0000 (CAN-ISA Invariants)  
**Referenced by:** RFC-0000, RFC-0009, RFC-0012

---

### RFC-0012 — CANB v1 Binary Encoding
**File:** `RFC-0012-binary-encoding.md`  
**Status:** Normative  
**Scope:** Binary encoding format for CAN-ISA bytecode

Defines:
- CANB v1 container format
- 32-bit fixed-width instruction encoding
- Big-endian byte ordering
- Object pool encoding (CLBC-POLY compatible)
- Determinism requirements
- Round-trip encoding/decoding

**Implements:** RFC-0000 (CAN-ISA Invariants)  
**Implements encoding for:** RFC-0009 (Origami Fold VM)  
**Defines format for:** RFC-0011 (Repository Kernel)

---

### RFC-0013 — Time, Barriers, and Physical Constraints
**File:** `RFC-0013-time-and-barriers.md`  
**Status:** Normative  
**Scope:** Time-dependent operations, barriers, and physical constraint enforcement

Defines:
- Time source semantics (TIME_RD, TIME_DIV, WAIT)
- Barrier operations (BARRIER_T)
- Physical constraint enforcement
- Barrier-gated state transitions
- Self-modification and barriers
- Platform-specific time sources

**Implements:** RFC-0000 CAN-INV-13 (Explicit Time Source), CAN-INV-14 (Barrier Monotonicity)  
**Extends:** RFC-0009 (Origami Fold VM)

---

## RFC Dependencies

```
RFC-0000 (CAN-ISA Invariants)
    │
    ├── RFC-0009 (Origami Fold VM)
    │       │
    │       ├── RFC-0012 (Binary Encoding)
    │       └── RFC-0013 (Time and Barriers)
    │
    └── RFC-0011 (Repository Kernel)
            │
            └── RFC-0012 (Binary Encoding)
```

---

## RFC Status Legend

- **Normative:** Specification is complete and binding
- **Draft:** Specification is under development
- **Informational:** Provides guidance but is not binding
- **Obsolete:** Superseded by a later RFC

---

## Agent Responsibilities

Per the Agent Constellation (RFC-0000 Appendix):

- **Agent 1 (RFC ARCHITECT):** Creates and maintains RFCs
- **Agent 2 (CAN-ISA/BINARY ENCODING):** Implements RFC-0012
- **Agent 3 (VM IMPLEMENTER):** Implements RFC-0009
- **Agent 4 (FORMAL METHODS):** Proves RFC invariants
- **Agent 6 (REPO KERNEL):** Implements RFC-0011
- **Agent 7 (HARDWARE):** Implements RFC-0013 time sources

---

## Cross-Reference Guide

When referencing RFCs in code or documentation:

- Use format: `RFC-0009` (with leading zeros)
- Section references: `RFC-0009 §4.2` (section 4.2)
- Appendix references: `RFC-0009 Appendix A`
- Invariant references: `RFC-0000 CAN-INV-1`

---

**Last Updated:** 2025-01-XX  
**Maintained by:** Agent 1 — RFC ARCHITECT (`RFC-CANON-LAW`)


# RFC-0009 — Origami Fold VM Semantics

**Title:** Origami Fold VM — Instruction Semantics and Execution Model  
**Status:** Normative  
**Applies to:**
- Origami Fold VM execution
- CAN-ISA bytecode
- VM implementations (Scheme, C, ESP32, Pico)
- Assembler output

**Updates:** RFC-0000 (CAN-ISA Invariants)  
**Mnemonic:** `RFC-CANON-LAW`

---

## 1. Scope and Purpose

This RFC defines the **Origami Fold VM**, a deterministic execution engine that enforces:

- Idempotent canonicalization
- Lattice operations (MEET/JOIN)
- Fano plane projection
- 8-tuple semantic closure
- Barrier-gated state transitions

The VM SHALL preserve all invariants defined in RFC-0000.

---

## 2. Execution Model

### 2.1 State Components

The VM SHALL maintain:

- **8 semantic registers** (RFC-0000 §3, CAN-INV-1 through CAN-INV-4)
- **32-bit immediate latch** (I32) for constructing immediate values
- **Object pool** for canonical polynomial objects (CLBC-POLY compatible)
- **Barrier state** for gating state transitions
- **Program counter** (PC) for instruction sequencing

### 2.2 Register Model

The 8 semantic registers SHALL be identified by keywords:

| Register | Keyword | Semantic Role |
|----------|---------|---------------|
| 0 | `state` | What exists |
| 1 | `symbol` | What is referenced |
| 2 | `boundary` | Structural/static projection |
| 3 | `relation` | Experiential/dynamic projection |
| 4 | `transition` | Change |
| 5 | `source` | Origin |
| 6 | `terminal` | Destination |
| 7 | `rejection` | Outcome |

Registers MAY also be referenced by numeric indices 0-7.

Each register SHALL hold a reference to a canonical object in the object pool.

---

## 3. Instruction Encoding

### 3.1 Fixed-Width Format

All instructions SHALL be **32 bits** (4 bytes), big-endian.

### 3.2 Instruction Word Layout

```
31          24 23        20 19   16 15        0
+--------------+------------+-------+----------+
|   OPCODE     |    FLAGS   |  RDST  |   IMM16  |
+--------------+------------+-------+----------+
```

- **OPCODE** (8 bits): Instruction operation code
- **FLAGS** (4 bits): Instruction flags (CANON_IN, CANON_OUT, PROOF_REQUIRED, EMIT)
- **RDST** (4 bits): Destination register (0-15, registers 0-7 are semantic)
- **IMM16** (16 bits): Immediate value (opcode-specific interpretation)

### 3.3 Immediate Construction

32-bit immediate values SHALL be constructed via:

- `LDI16H` — load high 16 bits into I32 latch
- `LDI16L` — load low 16 bits into I32 latch, completing 32-bit value
- `USEI32` — use complete I32 value as operand

---

## 4. Core Opcodes (Normative)

### 4.1 Control Flow

#### NOOP (0x00)
- **Semantics:** No operation
- **Invariants:** Preserves CAN-INV-1 through CAN-INV-4

#### HALT (0x01)
- **Semantics:** Stop execution
- **Invariants:** Preserves CAN-INV-1 through CAN-INV-4

### 4.2 Canonicalization

#### CANON (0x10)
- **Semantics:** Normalize object in `Ra` → `Rdst`
- **Invariants:** MUST preserve CAN-INV-1 (idempotence)
- **Behavior:** `Rdst := Norm(Ra)`
- **Requirement:** `Norm(Norm(S)) = Norm(S)` MUST hold
- **Detailed specification:** See RFC-0011 §6.9.2 for canonicalization algorithm, idempotence enforcement (INV-1), and CLBC-POLY frame requirements
- **Dual invariants:** See RFC-0011 §6.10.4 for dual-normalization equivalence requirements

### 4.3 Lattice Operations

#### MEET_GCD (0x20)
- **Semantics:** `Rdst := gcd(Ra, Rb)` (greatest common divisor / meet)
- **Invariants:** MUST preserve CAN-INV-5, CAN-INV-7, CAN-INV-8, CAN-INV-9
- **Behavior:** Computes meet in polynomial lattice

#### JOIN_LCM (0x21)
- **Semantics:** `Rdst := lcm(Ra, Rb)` (least common multiple / join)
- **Invariants:** MUST preserve CAN-INV-6, CAN-INV-7, CAN-INV-8, CAN-INV-9
- **Behavior:** Computes join in polynomial lattice

### 4.4 Fano Projection

#### PROJ_FANO (0x30)
- **Semantics:** Project state to Fano plane and validate triads
- **Invariants:** MUST preserve CAN-INV-10, CAN-INV-11, CAN-INV-12 (INV-12, INV-13 from formal invariants)
- **Behavior:**
  - Projects 8-tuple to 7-point Fano structure (omission rule applies)
  - Validates triad consistency
  - Rejects if Fano structure is invalid
- **Omission Rule:** One register is omitted in projection (implementation-defined which)
- **Detailed specification:** See RFC-0011 §6.5 for STRICT_FANO validation (S1-S4 checks), error codes, and WEAK_FANO mode
- **Mathematical definition:** See RFC-0011 §5.3 for Fano Triad Predicate formalization
- **Dual invariants:** See RFC-0011 §6.10.3 for primal-dual symmetry and vertex-edge duality requirements

### 4.5 Immediate Construction

#### LDI16H (0x40)
- **Semantics:** Load high 16 bits of IMM16 into I32 latch high half
- **Invariants:** Preserves CAN-INV-1 through CAN-INV-4

#### LDI16L (0x41)
- **Semantics:** Load low 16 bits of IMM16 into I32 latch low half, completing 32-bit value
- **Invariants:** Preserves CAN-INV-1 through CAN-INV-4

#### USEI32 (0x42)
- **Semantics:** Use complete I32 latch value as operand
- **Invariants:** Preserves CAN-INV-1 through CAN-INV-4

### 4.6 Register Operations

#### SWAP (0x50)
- **Semantics:** Swap contents of `Ra` and `Rb`
- **Invariants:** Preserves CAN-INV-1 through CAN-INV-4

#### CLEAR (0x51)
- **Semantics:** Clear register `Rdst` (set to null/zero reference)
- **Invariants:** Preserves CAN-INV-1 through CAN-INV-4

### 4.7 State Commit

#### COMMIT (0x60)
- **Semantics:** Commit current state with implicit canonicalization
- **Invariants:** MUST preserve CAN-INV-1, CAN-INV-2, CAN-INV-3
- **Behavior:**
  - Applies CANON to all registers
  - Computes state hash
  - Emits commit event
- **Requirement:** MUST be preceded by PROJ_FANO in same execution block (barrier rule)

### 4.8 Geometry Emission

#### EMIT_NODE (0x70)
- **Semantics:** Emit geometry node event for register `Ra`
- **Invariants:** Preserves CAN-INV-1 through CAN-INV-4
- **Behavior:** Emits canonical geometry event (SVG/OBJ/GLB target)

#### EMIT_EDGE (0x71)
- **Semantics:** Emit geometry edge event between `Ra` and `Rb`
- **Invariants:** Preserves CAN-INV-1 through CAN-INV-4
- **Behavior:** Emits canonical edge event

#### LIFT_3D (0x72)
- **Semantics:** Lift 2D projection to 3D/4D geometry
- **Invariants:** Preserves CAN-INV-1 through CAN-INV-4
- **Behavior:** Emits 3D/4D geometry events

### 4.9 Assertions

#### ASSERT_CANON (0x80)
- **Semantics:** Assert that state is canonical
- **Invariants:** Verifies CAN-INV-1
- **Behavior:** Fails execution if state is not canonical

#### ASSERT_IDEMP (0x81)
- **Semantics:** Assert idempotence of operation indicated by IMM16
- **Invariants:** Verifies CAN-INV-1
- **Behavior:** Fails execution if operation is not idempotent

#### ASSERT_FANO (0x82)
- **Semantics:** Assert Fano triad consistency
- **Invariants:** Verifies CAN-INV-10, CAN-INV-12
- **Behavior:** Fails execution if Fano structure is invalid

---

## 5. Barrier Semantics

### 5.1 Barrier Rule

State-modifying operations SHALL be gated by barriers:

- `COMMIT` MUST be preceded by `PROJ_FANO` in the same execution block
- `EMIT_*` operations SHOULD be preceded by `PROJ_FANO`
- Barriers enforce atomic state transitions

### 5.2 Barrier Validation

An implementation SHALL reject programs that violate barrier rules.

---

## 6. Execution Semantics

### 6.1 Determinism Requirement

Execution SHALL be deterministic:

- Given identical initial state and instruction sequence, execution MUST produce identical final state
- No hidden entropy sources are permitted
- Time-dependent operations MUST read from explicit clock registers (CAN-INV-13)

### 6.2 Normalization Requirement

All state transitions SHALL preserve canonical form:

- After each instruction, state MUST be in canonical form or explicitly rejected
- Canonicalization SHALL be idempotent (CAN-INV-1)

### 6.3 Error Handling

Invalid operations SHALL result in:

- State set to `⊥` (invalid/rejected)
- Execution halted
- Error event emitted

---

## 7. Object Pool Semantics

### 7.1 Canonical Objects

The object pool SHALL store canonical polynomial objects encoded per CLBC-POLY codec.

### 7.2 Reference Semantics

Registers SHALL hold references (poly_id) into the object pool, not direct values.

### 7.3 Pool Invariants

Object pool operations SHALL preserve:

- Canonical encoding uniqueness (CAN-INV-2)
- Decode/encode soundness (CAN-INV-3)

---

## 8. Fano Projection Details

### 8.1 Omission Rule

The Fano plane has 7 points; the 8-tuple has 8 registers.

One register SHALL be omitted in projection. The choice of omitted register SHALL be:

- Deterministic
- Documented per implementation
- Consistent across executions

### 8.2 Triad Validation

Projection SHALL validate that:

- All triads form valid Fano lines
- Each point lies on exactly 3 lines
- Each line contains exactly 3 points
- Any two points share exactly one line

Violation SHALL result in state rejection (`⊥`).

---

## 9. Conformance

### 9.1 Minimum Implementation

A conforming implementation SHALL support:

- All opcodes defined in §4
- 8 semantic registers
- 32-bit immediate construction
- Canonicalization (CANON)
- Fano projection (PROJ_FANO)
- Barrier enforcement

### 9.2 Determinism Verification

An implementation SHALL provide:

- Byte-identical output for identical input
- Idempotence verification
- Fano consistency checking

---

## 10. Relationship to Other RFCs

This RFC:

- **Implements** RFC-0000 (CAN-ISA Invariants)
- **Defines semantics** for RFC-0012 (Binary Encoding)
- **Provides execution model** for RFC-0011 (Repository Kernel)
- **Preserves invariants** across all operations
- **References detailed specifications** in RFC-0011:
  - RFC-0011 §6.5 — PROJ_FANO exact predicate and validation requirements
  - RFC-0011 §6.9.2 — CANON canonicalization algorithm and idempotence enforcement
  - RFC-0011 §6.10 — Dual invariant requirements for all projection operations

---

## Appendix A: Opcode Table (Normative)

| Opcode | Mnemonic | Invariants | Section |
|--------|----------|------------|---------|
| 0x00 | NOOP | CAN-INV-1..4 | §4.1 |
| 0x01 | HALT | CAN-INV-1..4 | §4.1 |
| 0x10 | CANON | CAN-INV-1 | §4.2 |
| 0x20 | MEET_GCD | CAN-INV-5,7,8,9 | §4.3 |
| 0x21 | JOIN_LCM | CAN-INV-6,7,8,9 | §4.3 |
| 0x30 | PROJ_FANO | CAN-INV-10,11,12 | §4.4 |
| 0x40 | LDI16H | CAN-INV-1..4 | §4.5 |
| 0x41 | LDI16L | CAN-INV-1..4 | §4.5 |
| 0x42 | USEI32 | CAN-INV-1..4 | §4.5 |
| 0x50 | SWAP | CAN-INV-1..4 | §4.6 |
| 0x51 | CLEAR | CAN-INV-1..4 | §4.6 |
| 0x60 | COMMIT | CAN-INV-1,2,3 | §4.7 |
| 0x70 | EMIT_NODE | CAN-INV-1..4 | §4.8 |
| 0x71 | EMIT_EDGE | CAN-INV-1..4 | §4.8 |
| 0x72 | LIFT_3D | CAN-INV-1..4 | §4.8 |
| 0x80 | ASSERT_CANON | CAN-INV-1 | §4.9 |
| 0x81 | ASSERT_IDEMP | CAN-INV-1 | §4.9 |
| 0x82 | ASSERT_FANO | CAN-INV-10,12 | §4.9 |

---

**End of RFC-0009**


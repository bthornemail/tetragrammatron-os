# RFC-0013 — Time, Barriers, and Physical Constraints

**Title:** Time Constraints, Barriers, and Physical Constraint Semantics  
**Status:** Normative  
**Applies to:**
- Origami Fold VM execution
- Time-dependent operations
- Barrier-gated state transitions
- Physical constraint enforcement

**Updates:** RFC-0000 (CAN-ISA Invariants), RFC-0009 (Origami Fold VM)  
**Mnemonic:** `RFC-CANON-LAW`

---

## 1. Scope and Purpose

This RFC defines:

- Time source semantics
- Barrier operations
- Physical constraint enforcement
- Deterministic time-dependent execution

All time operations SHALL preserve invariants defined in RFC-0000, particularly CAN-INV-13 (Explicit Time Source) and CAN-INV-14 (Barrier Monotonicity).

---

## 2. Time Source Model

### 2.1 Explicit Time Requirement

Any instruction that depends on time SHALL read from a declared clock register.

No implicit CPU cycle leakage is permitted (RFC-0000 CAN-INV-13).

### 2.2 Time Source Abstraction

Time SHALL be represented as:

- **Monotonic tick counter** (TICKS)
- **Platform-independent** (ESP32, Pico, host)
- **Deterministic** when replayed with same time inputs

### 2.3 Time Register

The VM SHALL maintain a **time register** (or time source) that provides:

- Current tick count
- Monotonic progression
- Bounded drift (implementation-defined)

---

## 3. Time Opcodes

### 3.1 TIME_RD (0x64)

**Semantics:** Read monotonic tick counter into destination register

**Encoding:**
```
OPCODE = 0x64
RDST = destination register
IMM16 = reserved (MUST be 0)
```

**Behavior:**
- `R[RDST] ← TICKS()`
- TICKS() SHALL be monotonic
- TICKS() SHALL be platform-provided (ESP32, Pico, host)

**Invariants:** Preserves CAN-INV-1 through CAN-INV-4, CAN-INV-13

### 3.2 TIME_DIV (0x65)

**Semantics:** Quantize time into phase buckets

**Encoding:**
```
OPCODE = 0x61
RDST = destination register
RSRC = source register (time value)
IMM16 = divisor (MUST be > 0)
```

**Behavior:**
- `R[RDST] ← floor(R[RSRC] / IMM16)`
- Maps raw ticks → phase index
- Enables clocked "circulation ring" semantics

**Invariants:** Preserves CAN-INV-1 through CAN-INV-4, CAN-INV-13

### 3.3 WAIT (0x66)

**Semantics:** Wait until time deadline is reached

**Encoding:**
```
OPCODE = 0x62
RSRC = source register (deadline time)
IMM16 = offset (added to R[RSRC])
```

**Behavior:**
- Wait until: `TICKS() >= (R[RSRC] + IMM16)`
- If IMM16 is 0: cooperative yield (scheduling hook)
- Execution SHALL block until condition is met

**Invariants:** Preserves CAN-INV-1 through CAN-INV-4, CAN-INV-13

**Note:** WAIT with IMM16=0 provides cooperative scheduling without time dependency.

---

## 4. Barrier Operations

### 4.1 Barrier Concept

Barriers enforce **atomic state transitions** and **physical constraints**.

Barriers SHALL:

- Gate state modifications
- Enforce timing constraints
- Preserve determinism
- Enable proof-carrying execution

### 4.2 BARRIER_T (0x67)

**Semantics:** Time barrier — asserts max jitter / min spacing for fold block

**Encoding:**
```
OPCODE = 0x63
RSRC = source register (block start tick)
IMM16 = max allowed duration (in ticks)
```

**Behavior:**
- Asserts: `(TICKS() - R[RSRC]) <= IMM16`
- RSRC SHALL hold "block start tick"
- IMM16 is max allowed duration
- On fail: sets VM fault flag or triggers TRAP

**Invariants:** Preserves CAN-INV-1 through CAN-INV-4, CAN-INV-13, CAN-INV-14

**Barrier Monotonicity (CAN-INV-14):**
Once a barrier is set:
```
BARRIER(S) ⇒ BARRIER(S′)
```
unless explicitly released by a barrier opcode.

### 4.3 Barrier Validation

A barrier SHALL be valid if:

- Time source is available
- Barrier time is in valid range
- Barrier duration is non-negative
- Barrier does not violate monotonicity

---

## 5. Physical Constraint Semantics

### 5.1 Constraint Model

Physical constraints SHALL be:

- **Explicit** (declared via opcodes)
- **Deterministic** (replayable with same inputs)
- **Bounded** (finite duration/window)
- **Verifiable** (proof-carrying)

### 5.2 Time Window Constraints

A time window constraint SHALL specify:

- Start time (from TIME_RD or register)
- End time or duration
- Validation rule (BARRIER_T)

### 5.3 Constraint Enforcement

Constraints SHALL be enforced by:

- Barrier operations (BARRIER_T)
- Wait operations (WAIT)
- Execution gating

Violation SHALL result in:

- State rejection (⊥)
- Execution halt
- Error event emission

---

## 6. Time-Dependent Execution

### 6.1 Determinism Requirement

Time-dependent execution SHALL be deterministic when:

- Time inputs are identical
- Barrier conditions are identical
- Execution order is preserved

### 6.2 Time Replay

Execution SHALL be replayable by:

- Recording time values at TIME_RD points
- Replaying with recorded time values
- Producing identical state transitions

### 6.3 Time Branching

Programs SHALL NOT branch on TIME_RD except via BARRIER_T.

Direct branching on time values SHALL be prohibited to preserve determinism.

---

## 7. Barrier-Gated State Transitions

### 7.1 Barrier Rule

State-modifying operations SHALL be gated by barriers:

- COMMIT (RFC-0009 §4.7) MUST be preceded by PROJ_FANO in same execution block
- EMIT_* operations SHOULD be preceded by PROJ_FANO
- PATCH_* operations (self-modification) MUST occur only at barriers

### 7.2 Barrier Placement

Barriers SHALL be placed:

- Before state commits
- After fold block completion
- At self-modification points
- At geometry emission points

### 7.3 Barrier Validation

An implementation SHALL reject programs that:

- Violate barrier rules
- Attempt state modification without barrier
- Bypass barrier enforcement

---

## 8. Self-Modification and Barriers

### 8.1 Patch Operations

Self-modification SHALL be allowed only through:

- PATCH_BEGIN, PATCH_WRITE, PATCH_SEAL, PATCH_APPLY sequence
- Barrier-gated application (PATCH_APPLY only at barriers)
- Sealed patch validation

### 8.2 Barrier Requirement for Patches

PATCH_APPLY SHALL be legal only when:

- Not inside an open fold block
- Last instruction was a barrier (COMMIT, BARRIER_T, etc.)
- Barrier conditions are satisfied

This preserves RFC-0000 CAN-INV-15 (Patch Isolation) and CAN-INV-16 (Patch Atomicity).

---

## 9. Platform-Specific Time Sources

### 9.1 ESP32

Time source SHALL be:

- `esp_timer_get_time()` (microseconds), or
- CPU cycle counter (if enabled)

### 9.2 Raspberry Pi Pico

Time source SHALL be:

- `time_us_64()` (microseconds), or
- Systick/cycle counter

### 9.3 Host (Linux/Windows/macOS)

Time source SHALL be:

- Monotonic clock (CLOCK_MONOTONIC on Linux)
- High-resolution timer

### 9.4 Time Source Abstraction

Time source abstraction SHALL:

- Provide monotonic ticks
- Support bounded drift
- Enable deterministic replay
- Not require exact physics (proofs need monotonic + bounded drift)

---

## 10. Relationship to Other RFCs

This RFC:

- **Implements** RFC-0000 CAN-INV-13 (Explicit Time Source) and CAN-INV-14 (Barrier Monotonicity)
- **Extends** RFC-0009 (Origami Fold VM) with time and barrier operations
- **Preserves invariants** across all time-dependent operations
- **Enables** physical constraint enforcement

---

## 11. Conformance

### 11.1 Minimum Implementation

A conforming implementation SHALL:

- Support TIME_RD, WAIT, BARRIER_T opcodes
- Provide monotonic time source
- Enforce barrier rules
- Preserve determinism with time replay

### 11.2 Determinism Verification

An implementation SHALL provide:

- Time value recording
- Deterministic replay
- Barrier validation
- Constraint enforcement

---

## Appendix A: Time Opcode Table

| Opcode | Mnemonic | Invariants | Section |
|--------|----------|------------|---------|
| 0x64 | TIME_RD | CAN-INV-1..4,13 | §3.1 |
| 0x65 | TIME_DIV | CAN-INV-1..4,13 | §3.2 |
| 0x66 | WAIT | CAN-INV-1..4,13 | §3.3 |
| 0x67 | BARRIER_T | CAN-INV-1..4,13,14 | §4.2 |

---

**End of RFC-0013**


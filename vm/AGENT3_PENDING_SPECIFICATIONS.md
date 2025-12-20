# Agent 3 — Pending Implementation Specifications

**Role:** B — COMPILER / VM IMPLEMENTER (Agent 3, `VM-EXEC-FOLD`)  
**Workflow:** Write specifications → wait for implementation → complete proofs  
**Date:** 2025-01-27

---

## Overview

This document specifies the remaining implementations required to complete the VM. Each specification includes:
1. **Functional Requirements** — What the implementation must do
2. **Invariant Constraints** — Which invariants must be preserved
3. **Interface Definition** — Function signatures and data structures
4. **Proof Obligations** — Formal properties that must be proven

---

## 1. OP_COMMIT — Commit Hash Computation

### Status
**Current:** Stub (no-op)  
**Location:** `vm/can_vm.c:134-142`  
**Priority:** High (required for repository merge semantics)

### Functional Requirements

**RFC Reference:** RFC-0009 §4.7, RFC-0012 Appendix B

**Semantics:**
```
COMMIT A B imm16
```

**Operation:**
1. Compute commit hash of current VM state
2. Validate barrier constraints (must be preceded by `PROJ_FANO`)
3. Emit commit frame with optional metadata

**imm16 Format (RFC-0012 Appendix B):**
- `imm16[15:8]` = profile (commit profile selector)
- `imm16[7:0]` = flags:
  - `bit0` = include renderer frame digest
  - `bit1` = include poly-weight summary
  - `bit2-7` = reserved (must be 0)

**Barrier Rule:**
- `COMMIT` MUST be preceded by `PROJ_FANO` in the same execution block
- If `PROJ_FANO` not executed, `COMMIT` must fail with `VM_ERR_INVALID_STATE`

### Interface Specification

```c
// Commit hash computation
// Returns: 0 on success, non-zero on error
// Output: commit_hash (32-byte SHA-256 digest)
int can_vm_commit_hash(const can_vm_t* vm, uint8_t* commit_hash);

// Commit frame structure (RFC-0012 Appendix B)
typedef struct {
  uint8_t profile;           // Commit profile (imm16[15:8])
  uint8_t flags;            // Commit flags (imm16[7:0])
  uint8_t state_hash[32];   // SHA-256 of canonical VM state
  uint8_t renderer_digest[32];  // Optional: renderer frame digest (if flags.bit0)
  uint32_t poly_weight_sum;     // Optional: sum of polynomial weights (if flags.bit1)
} can_commit_frame_t;

// Emit commit frame
// Returns: 0 on success, non-zero on error
int can_vm_emit_commit(const can_vm_t* vm, const can_commit_frame_t* frame);
```

### State Hash Computation

**Algorithm:**
1. Normalize all 8 semantic registers (canonical form)
2. Encode normalized state to bytes (CLBC-POLY format)
3. Compute SHA-256 hash of encoded state
4. Store hash in `commit_hash` output buffer

**Canonical State Encoding:**
- Register 0-7: Encode each `poly_id` → polynomial → CLBC-POLY bytes
- Concatenate: `reg0_bytes || reg1_bytes || ... || reg7_bytes`
- Hash: `SHA256(concatenated_bytes)`

### Invariant Constraints

**INV-21:** Observations derive from canonical bytes only
- Commit hash MUST be computed from canonical state
- No timestamps, platform fields, or device IDs in hash

**INV-19:** Merge is a Join with canonical normalization
- Commit hash represents normalized state
- Merge operations must preserve commit hash determinism

**INV-20:** Merge must preserve Fano consistency
- Barrier rule ensures `PROJ_FANO` validates state before commit
- Invalid Fano state cannot be committed

### Proof Obligations

**Theorem:** `commit_hash_deterministic`
- Same canonical state → same commit hash
- `can_vm_commit_hash(s1) = can_vm_commit_hash(s2)` if `Norm(s1) = Norm(s2)`

**Theorem:** `commit_barrier_rule`
- `COMMIT` fails if not preceded by `PROJ_FANO` in same execution block
- Barrier validation must be enforced

**Theorem:** `commit_preserves_fano`
- If `PROJ_FANO` passes, then `COMMIT` preserves Fano consistency
- Committed state satisfies Fano validity

---

## 2. Fano Projection Geometry Emission

### Status
**Current:** Stub (validation only, no geometry)  
**Location:** `vm/can_vm.c:274-321`  
**Priority:** Medium (Agent 5 collaboration)

### Functional Requirements

**RFC Reference:** RFC-0009 §4.4, RFC-0011 §6.5.1

**Semantics:**
After `OP_PROJ_FANO` validates a Fano triad, geometry must be emitted for visualization.

**Geometry Output:**
- 7-point Fano plane coordinates (2D projection)
- 7-line incidence relations
- Optional: 3D lift coordinates

### Interface Specification

```c
// Fano point structure (7 points in Fano plane)
typedef struct {
  double x, y;  // 2D coordinates (normalized to [0,1])
  uint32_t poly_id;  // Associated polynomial ID
} can_fano_point_t;

// Fano line structure (7 lines in Fano plane)
typedef struct {
  uint8_t point_indices[3];  // Indices into fano_point array (3 points per line)
} can_fano_line_t;

// Fano projection result
typedef struct {
  can_fano_point_t points[7];  // 7 points
  can_fano_line_t lines[7];   // 7 lines
  bool valid;                  // True if projection is valid
} can_fano_projection_t;

// Compute Fano projection from triad
// Returns: 0 on success, non-zero on error
int can_fano_project(const poly_t* A, const poly_t* B, const poly_t* C,
                     can_fano_projection_t* proj);

// Emit geometry to renderer
// Returns: 0 on success, non-zero on error
int can_vm_emit_fano_geometry(const can_vm_t* vm, 
                               const can_fano_projection_t* proj);
```

### Coordinate System

**Fano Plane Coordinates (RFC-0009 §8.2):**
- Standard Fano plane embedding (7 points, 7 lines)
- Coordinates normalized to [0,1] × [0,1]
- Incidence matrix: 7×7 binary matrix (points × lines)

**Coordinate Mapping:**
- Point 0: (0.0, 0.0) — origin
- Point 1: (1.0, 0.0) — x-axis
- Point 2: (0.0, 1.0) — y-axis
- Point 3: (1.0, 1.0) — diagonal
- Point 4: (0.5, 0.0) — mid-x
- Point 5: (0.0, 0.5) — mid-y
- Point 6: (0.5, 0.5) — center

**Line-Point Incidence:**
- Each line contains exactly 3 points
- Each point lies on exactly 3 lines
- Standard Fano plane incidence structure

### Invariant Constraints

**INV-2:** Normalization is semantics-preserving
- Fano projection must be invariant under canonicalization
- `Proj_Fano(Norm(s)) = Proj_Fano(s)`

**INV-12, INV-13:** Fano structural validity
- Projection only valid if `strict_fano_valid(A, B, C)` passes
- Geometry emission requires valid triad

### Proof Obligations

**Theorem:** `fano_projection_idempotent`
- `can_fano_project(canon(A), canon(B), canon(C)) = can_fano_project(A, B, C)`
- Projection is invariant under canonicalization

**Theorem:** `fano_projection_valid_iff_triad_valid`
- `proj.valid = true` if and only if `strict_fano_valid(A, B, C) = true`
- Projection validity matches triad validation

---

## 3. Time Operations — Platform-Specific Implementation

### Status
**Current:** Stub (uses `can_time_ticks()` which exists but needs platform ports)  
**Location:** `vm/can_vm.c:495-547`  
**Priority:** Medium (required for RFC-0013 compliance)

### Functional Requirements

**RFC Reference:** RFC-0013 §3, §4, §9

**Time Source Abstraction:**
- Platform-specific monotonic tick counter
- Microsecond precision (or platform-native precision)
- Deterministic in replay mode (use recorded ticks)

### Interface Specification

```c
// Platform time source (already exists in can_time.h)
// Returns: Monotonic tick count (microseconds since epoch or platform start)
uint64_t can_time_ticks(void);

// Platform-specific implementations required for:
// - ESP32-S3: Use esp_timer_get_time()
// - Raspberry Pi Pico 2 W: Use time_us_64()
// - Termux Android: Use clock_gettime(CLOCK_MONOTONIC)
// - Host reference: Use platform-specific monotonic clock
```

### OP_TIME_RD Implementation

**Current:** ✅ Implemented (uses `can_time_ticks()`)  
**Enhancement Needed:**
- Consider 64-bit time storage in register structure
- Current: truncates to 32-bit in `poly_id` field

**Specification:**
```c
// Enhanced: Store full 64-bit time
// Option: Use two registers (A = low 32 bits, A+1 = high 32 bits)
// Or: Extend can_reg_t to include time_64 field
```

### OP_TIME_DIV Implementation

**Current:** ✅ Implemented (basic division)  
**Status:** Complete (no changes needed)

### OP_WAIT Implementation

**Current:** Stub (no-op)  
**Required:** Time-based waiting

**Specification:**
```c
// Wait until: TICKS() >= (R[A] + imm16)
// If imm16 = 0: cooperative yield (return immediately)
// Otherwise: busy-wait or platform-specific sleep until deadline
void can_vm_wait_until(uint64_t deadline);
```

**Determinism Constraint:**
- In replay mode: use recorded time, don't actually wait
- In live mode: wait until deadline or timeout

### OP_BARRIER_T Implementation

**Current:** ✅ Implemented (basic barrier check)  
**Status:** Complete (no changes needed)

### Invariant Constraints

**INV-5, INV-6:** Determinism
- Time operations must be deterministic in replay mode
- Recorded time values must produce identical execution

**RFC-0013 §4.2:** Barrier monotonicity
- Time barriers must enforce maximum duration
- Barrier violations must halt execution

### Proof Obligations

**Theorem:** `time_operations_deterministic`
- Same recorded time values → same execution
- Time operations don't break replay determinism

**Theorem:** `barrier_enforces_duration`
- `BARRIER_T` fails if elapsed time > imm16
- Barrier violations are detected and reported

---

## 4. Geometry Emission Operations

### Status
**Current:** Stub (no-op)  
**Location:** `vm/can_vm.c:323-345`  
**Priority:** Low (Agent 5 collaboration)

### Functional Requirements

**RFC Reference:** RFC-0009 §4.6

**Operations:**
- `OP_EMIT_NODE` — Emit geometry node
- `OP_EMIT_EDGE` — Emit geometry edge
- `OP_LIFT_3D` — Lift 2D projection to 3D

### Interface Specification

```c
// Geometry node structure
typedef struct {
  uint32_t node_id;
  double x, y, z;  // 3D coordinates
  uint8_t style;   // Style selector (imm16[15:12])
  uint8_t layer;   // Layer index (imm16[11:8])
  uint8_t flags;   // Flags (imm16[7:0])
} can_geometry_node_t;

// Geometry edge structure
typedef struct {
  uint32_t from_node_id;
  uint32_t to_node_id;
  uint8_t flags;   // Edge flags
} can_geometry_edge_t;

// Emit node
int can_vm_emit_node(const can_vm_t* vm, const can_geometry_node_t* node);

// Emit edge
int can_vm_emit_edge(const can_vm_t* vm, const can_geometry_edge_t* edge);

// Lift 2D to 3D
int can_vm_lift_3d(const can_vm_t* vm, uint8_t space, uint8_t scale, uint8_t flags);
```

### Invariant Constraints

**INV-2:** Normalization is semantics-preserving
- Geometry emission must be invariant under canonicalization
- Same canonical state → same geometry output

### Proof Obligations

**Theorem:** `geometry_emission_deterministic`
- Same canonical state → same geometry output
- Geometry operations preserve determinism

---

## 5. Weak Mode Fano Validation

### Status
**Current:** Stub (returns `FANO_MODE_MISMATCH`)  
**Location:** `vm/can_poly.c:100-104`  
**Priority:** Low (strict mode is sufficient for MVP)

### Functional Requirements

**RFC Reference:** RFC-0011 §6.5.1

**Weak Mode (W1-W3):**
- W1: At least one pairwise GCD ≠ 1
- W2: Triple core may be trivial (gcd(A,B,C) = 1 allowed)
- W3: No idempotence requirement

**Implementation:**
```c
// Weak mode validation (RFC-0011 §6.5.1)
// Returns: 0 on success, sets err to specific error code on failure
int can_fano_valid_weak(const poly_t* A, const poly_t* B, const poly_t* C,
                        fano_error_t* err);
```

### Invariant Constraints

**INV-12, INV-13:** Fano structural validity
- Weak mode is a relaxation of strict mode
- Weak mode must still satisfy basic incidence properties

### Proof Obligations

**Theorem:** `weak_mode_relaxation`
- If `strict_fano_valid(A, B, C)` then `weak_fano_valid(A, B, C)`
- Weak mode accepts all strict mode triads

---

## Implementation Priority

1. **High Priority:**
   - OP_COMMIT — Required for repository merge semantics (INV-19, INV-20, INV-21)

2. **Medium Priority:**
   - Time operations — Required for RFC-0013 compliance
   - Fano projection geometry — Required for visualization

3. **Low Priority:**
   - Geometry emission operations — Agent 5 collaboration
   - Weak mode Fano validation — Strict mode is sufficient for MVP

---

## Next Steps

1. **Implement OP_COMMIT** — Commit hash computation and barrier validation
2. **Port time operations** — Platform-specific implementations for ESP32, Pico, Termux
3. **Implement Fano geometry** — Coordinate computation and emission
4. **Complete proofs** — Write formal proofs for all specifications above

---

**Mnemonic:** `VM-EXEC-FOLD`  
**Status:** Specifications complete; awaiting implementation


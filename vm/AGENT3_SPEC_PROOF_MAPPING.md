# Agent 3 — Specification to Proof Mapping

**Role:** B — COMPILER / VM IMPLEMENTER (Agent 3, `VM-EXEC-FOLD`)  
**Workflow:** Write specifications → wait for implementation → complete proofs  
**Date:** 2025-01-27

---

## Overview

This document maps the pending implementation specifications to their corresponding proof obligations in `proof/RFC0012_FoldVM.lean`.

---

## Mapping Table

| Specification | Proof Obligation | Location | Status |
|--------------|------------------|----------|--------|
| **OP_COMMIT** | | | |
| Commit hash computation | `commit_hash_deterministic` | `RFC0012_FoldVM.lean:310-316` | ✅ Specified |
| Barrier rule validation | `commit_barrier_rule` | `RFC0012_FoldVM.lean:318-330` | ✅ Specified |
| Fano preservation | `commit_preserves_fano` | `RFC0012_FoldVM.lean:332-340` | ✅ Specified |
| **Fano Projection Geometry** | | | |
| Projection idempotence | `fano_projection_idempotent` | `RFC0012_FoldVM.lean:342-348` | ✅ Specified |
| Validity equivalence | `fano_projection_valid_iff_triad_valid` | `RFC0012_FoldVM.lean:350-355` | ✅ Specified |
| **Time Operations** | | | |
| Time determinism | `time_operations_deterministic` | `RFC0012_FoldVM.lean:357-368` | ✅ Specified |
| Barrier duration | `barrier_enforces_duration` | `RFC0012_FoldVM.lean:370-376` | ✅ Specified |
| **Geometry Emission** | | | |
| Emission determinism | `geometry_emission_deterministic` | `RFC0012_FoldVM.lean:378-390` | ✅ Specified |
| **Weak Mode Fano** | | | |
| Weak mode relaxation | `weak_mode_relaxation` | `RFC0012_FoldVM.lean:392-400` | ✅ Specified |

---

## Proof Obligation Details

### 1. Commit Hash (INV-21)

**Specification:** `vm/AGENT3_PENDING_SPECIFICATIONS.md` §1  
**Proof:** `proof/RFC0012_FoldVM.lean:310-340`

**Theorems:**
- `commit_hash_deterministic` — Same canonical state → same commit hash
- `commit_barrier_rule` — COMMIT must be preceded by PROJ_FANO
- `commit_preserves_fano` — Committed state preserves Fano validity

**Implementation Contract:**
```c
int can_vm_commit_hash(const can_vm_t* vm, uint8_t* commit_hash);
```

**Verification:** Once implemented, verify:
1. Same canonical state produces identical hash
2. Barrier rule is enforced
3. Fano validity is preserved

---

### 2. Fano Projection Geometry (INV-2)

**Specification:** `vm/AGENT3_PENDING_SPECIFICATIONS.md` §2  
**Proof:** `proof/RFC0012_FoldVM.lean:342-355`

**Theorems:**
- `fano_projection_idempotent` — Projection invariant under canonicalization
- `fano_projection_valid_iff_triad_valid` — Validity matches triad validation

**Implementation Contract:**
```c
int can_fano_project(const poly_t* A, const poly_t* B, const poly_t* C,
                     can_fano_projection_t* proj);
```

**Verification:** Once implemented, verify:
1. `can_fano_project(canon(A), canon(B), canon(C)) = can_fano_project(A, B, C)`
2. `proj.valid = true` iff `strict_fano_valid(A, B, C) = true`

---

### 3. Time Operations (INV-5, INV-6)

**Specification:** `vm/AGENT3_PENDING_SPECIFICATIONS.md` §3  
**Proof:** `proof/RFC0012_FoldVM.lean:357-376`

**Theorems:**
- `time_operations_deterministic` — Time operations preserve determinism
- `barrier_enforces_duration` — Barrier violations are detected

**Implementation Contract:**
```c
uint64_t can_time_ticks(void);
void can_vm_wait_until(uint64_t deadline);
```

**Verification:** Once implemented, verify:
1. Same recorded time values → same execution
2. Barrier violations halt execution

---

### 4. Geometry Emission (INV-2)

**Specification:** `vm/AGENT3_PENDING_SPECIFICATIONS.md` §4  
**Proof:** `proof/RFC0012_FoldVM.lean:378-390`

**Theorems:**
- `geometry_emission_deterministic` — Same canonical state → same geometry

**Implementation Contract:**
```c
int can_vm_emit_node(const can_vm_t* vm, const can_geometry_node_t* node);
int can_vm_emit_edge(const can_vm_t* vm, const can_geometry_edge_t* edge);
```

**Verification:** Once implemented, verify:
1. Same canonical state produces identical geometry output

---

### 5. Weak Mode Fano (INV-12, INV-13)

**Specification:** `vm/AGENT3_PENDING_SPECIFICATIONS.md` §5  
**Proof:** `proof/RFC0012_FoldVM.lean:392-400`

**Theorems:**
- `weak_mode_relaxation` — Weak mode accepts all strict mode triads

**Implementation Contract:**
```c
int can_fano_valid_weak(const poly_t* A, const poly_t* B, const poly_t* C,
                        fano_error_t* err);
```

**Verification:** Once implemented, verify:
1. If `strict_fano_valid(A, B, C)` then `weak_fano_valid(A, B, C)`

---

## Implementation Checklist

### High Priority
- [ ] **OP_COMMIT implementation**
  - [ ] `can_vm_commit_hash` function
  - [ ] Barrier rule validation
  - [ ] Commit frame emission
  - [ ] Proof: `commit_hash_deterministic`
  - [ ] Proof: `commit_barrier_rule`
  - [ ] Proof: `commit_preserves_fano`

### Medium Priority
- [ ] **Time operations platform ports**
  - [ ] ESP32-S3 implementation
  - [ ] Raspberry Pi Pico 2 W implementation
  - [ ] Termux Android implementation
  - [ ] Host reference implementation
  - [ ] Proof: `time_operations_deterministic`
  - [ ] Proof: `barrier_enforces_duration`

- [ ] **Fano projection geometry**
  - [ ] `can_fano_project` function
  - [ ] Coordinate computation
  - [ ] Geometry emission
  - [ ] Proof: `fano_projection_idempotent`
  - [ ] Proof: `fano_projection_valid_iff_triad_valid`

### Low Priority
- [ ] **Geometry emission operations**
  - [ ] `can_vm_emit_node` function
  - [ ] `can_vm_emit_edge` function
  - [ ] `can_vm_lift_3d` function
  - [ ] Proof: `geometry_emission_deterministic`

- [ ] **Weak mode Fano validation**
  - [ ] `can_fano_valid_weak` function
  - [ ] W1-W3 checks
  - [ ] Proof: `weak_mode_relaxation`

---

## Next Steps

1. **Implement specifications** — Follow `vm/AGENT3_PENDING_SPECIFICATIONS.md`
2. **Complete proofs** — Prove all theorems in `proof/RFC0012_FoldVM.lean`
3. **Verify implementations** — Use `proof/VERIFICATION_GUIDE.md` test cases
4. **Submit to Agent 0** — For review and approval

---

**Mnemonic:** `VM-EXEC-FOLD`  
**Status:** Specifications and proof obligations complete; awaiting implementation


# Implementation Verification Guide

**Role:** C — FORMAL PROVER (Agent 4, `PROOF-IDEM-SAFE`)  
**Target:** Agent 3 — VM Implementer  
**Purpose:** Bridge between formal proof specifications and implementation verification

---

## Overview

This guide provides **testable properties** that Agent 3's implementation must satisfy, derived from the formal proof specifications in `proof/RFC0012_FoldVM.lean`.

---

## Verification Checklist

### 1. Strict Fano Triad Validation (`can_fano_valid_strict`)

**Proof Specification:** `strict_fano_valid` (lines 60-79)

**Implementation Contract:**
```c
// Must match: strict_fano_valid (A B C : Poly) : Sum Unit FanoError
int can_fano_valid_strict(poly_t* A, poly_t* B, poly_t* C, uint8_t mode, fano_error_t* err);
```

**Test Cases:**

#### Test 1.1: S1 - Pairwise Non-trivial Incidence
```c
// Setup: A, B, C where gcd(A,B) = 1 (trivial)
// Expected: FANO_NO_PAIRWISE_INCIDENT
poly_t A = poly_from_bytes(...);  // e.g., x^2 + 1
poly_t B = poly_from_bytes(...);  // e.g., x^3 + 1 (coprime)
poly_t C = poly_from_bytes(...);  // e.g., x^5 + 1
fano_error_t err;
int result = can_fano_valid_strict(&A, &B, &C, MODE_STRICT, &err);
assert(result == FANO_INVALID);
assert(err == FANO_NO_PAIRWISE_INCIDENT);
```

#### Test 1.2: S2 - Triple Core Exists
```c
// Setup: A, B, C where pairwise GCDs exist but gcd(A,B,C) = 1
// Expected: FANO_NO_COMMON_CORE
// (Requires polynomials where gcd(A,B) ≠ 1, gcd(B,C) ≠ 1, gcd(A,C) ≠ 1
//  but gcd(gcd(A,B), C) = 1)
```

#### Test 1.3: S3 - Idempotent Closure
```c
// Setup: A, B, C where join(A,B,C) is not idempotent
// Expected: FANO_NON_IDEMPOTENT
// Verify: meet(join(A,B,C), join(A,B,C)) ≠ join(A,B,C)
```

#### Test 1.4: S4 - No Absorption Collapse
```c
// Setup: A, B, C where gcd(A,B) = A (absorption)
// Expected: FANO_DEGENERATE_ABSORPTION
poly_t A = poly_from_bytes(...);  // e.g., x^2
poly_t B = poly_from_bytes(...);  // e.g., x^2 + x (A divides B)
poly_t C = poly_from_bytes(...);
fano_error_t err;
int result = can_fano_valid_strict(&A, &B, &C, MODE_STRICT, &err);
assert(result == FANO_INVALID);
assert(err == FANO_DEGENERATE_ABSORPTION);
```

#### Test 1.5: Valid Triad
```c
// Setup: A, B, C satisfying all S1-S4
// Expected: FANO_OK
// (Requires carefully constructed polynomials)
```

**Verification:** Compare error codes with `FanoError` inductive type in `proof/RFC0012_FoldVM.lean` lines 49-56.

---

### 2. Canonicalization Idempotence (`can_poly_canon`)

**Proof Specification:** `canon_idempotent` (lines 123-125)

**Implementation Contract:**
```c
// Must satisfy: canon(canon(x)) = canon(x)
int can_poly_canon(const poly_t* in, poly_t* out);
```

**Test Case:**
```c
poly_t input = poly_from_bytes(...);
poly_t result1, result2, result3;

// First canonicalization
can_poly_canon(&input, &result1);

// Second canonicalization (should be idempotent)
can_poly_canon(&result1, &result2);

// Verify: result1 == result2 (byte-identical)
assert(poly_eq(&result1, &result2));

// Triple application (should still be identical)
can_poly_canon(&result2, &result3);
assert(poly_eq(&result1, &result3));
```

**Verification:** 
- Byte-level comparison must be identical
- Matches `canon_idempotent` theorem (INV-1)

---

### 3. Lattice Laws (Meet/Join)

**Proof Specifications:** 
- `meet_idempotent`, `join_idempotent` (INV-7)
- `meet_comm`, `join_comm` (INV-8)
- `meet_assoc`, `join_assoc` (INV-9)
- `meet_join_absorption`, `join_meet_absorption` (INV-10)

**Implementation Contracts:**
```c
int can_poly_gcd(const poly_t* a, const poly_t* b, poly_t* result);  // MEET
int can_poly_lcm(const poly_t* a, const poly_t* b, poly_t* result); // JOIN
```

**Test Cases:**

#### Test 3.1: Idempotence (INV-7)
```c
poly_t a = poly_from_bytes(...);
poly_t result1, result2;

can_poly_gcd(&a, &a, &result1);
assert(poly_eq(&a, &result1));  // meet(a,a) = a

can_poly_lcm(&a, &a, &result2);
assert(poly_eq(&a, &result2));  // join(a,a) = a
```

#### Test 3.2: Commutativity (INV-8)
```c
poly_t a = poly_from_bytes(...);
poly_t b = poly_from_bytes(...);
poly_t ab, ba;

can_poly_gcd(&a, &b, &ab);
can_poly_gcd(&b, &a, &ba);
assert(poly_eq(&ab, &ba));  // meet(a,b) = meet(b,a)

can_poly_lcm(&a, &b, &ab);
can_poly_lcm(&b, &a, &ba);
assert(poly_eq(&ab, &ba));  // join(a,b) = join(b,a)
```

#### Test 3.3: Associativity (INV-9)
```c
poly_t a = poly_from_bytes(...);
poly_t b = poly_from_bytes(...);
poly_t c = poly_from_bytes(...);
poly_t ab_c, a_bc, ab, bc;

can_poly_gcd(&a, &b, &ab);
can_poly_gcd(&ab, &c, &ab_c);

can_poly_gcd(&b, &c, &bc);
can_poly_gcd(&a, &bc, &a_bc);

assert(poly_eq(&ab_c, &a_bc));  // meet(meet(a,b),c) = meet(a,meet(b,c))
```

#### Test 3.4: Absorption (INV-10)
```c
poly_t x = poly_from_bytes(...);
poly_t y = poly_from_bytes(...);
poly_t xy, x_xy, x_xy_result;

can_poly_lcm(&x, &y, &xy);
can_poly_gcd(&x, &xy, &x_xy);
assert(poly_eq(&x, &x_xy));  // meet(x, join(x,y)) = x

can_poly_gcd(&x, &y, &xy);
can_poly_lcm(&x, &xy, &x_xy);
assert(poly_eq(&x, &x_xy));  // join(x, meet(x,y)) = x
```

**Verification:** All tests must pass to satisfy lattice laws.

---

### 4. Determinism (INV-5, INV-6)

**Proof Specifications:** `step_deterministic`, `replay_deterministic`

**Test Cases:**

#### Test 4.1: Step Determinism
```c
// Same canonical state + same instruction → same result
can_vm_t vm1, vm2;
can_vm_init(&vm1);
can_vm_init(&vm2);

// Set registers to canonical equivalent states
set_canonical_state(&vm1, ...);
set_canonical_state(&vm2, ...);  // byte-identical after normalization

can_inst_t inst = {.opcode = OP_CANON, .ra = 0, .rb = 0, .imm16 = 0};

can_vm_step(&vm1, &inst);
can_vm_step(&vm2, &inst);

// Verify: canonical states are identical
assert(canonical_states_equal(&vm1, &vm2));
```

#### Test 4.2: Replay Determinism
```c
// Same program + same initial state → same final state
uint8_t prog[] = {...};
can_vm_t vm1, vm2;

can_vm_init(&vm1);
can_vm_init(&vm2);
set_canonical_state(&vm1, ...);
set_canonical_state(&vm2, ...);  // identical

can_vm_run(&vm1, prog, sizeof(prog));
can_vm_run(&vm2, prog, sizeof(prog));

assert(canonical_states_equal(&vm1, &vm2));
```

**Verification:** Matches `step_deterministic` and `replay_deterministic` theorems.

---

### 5. Encoding/Decoding Roundtrip (INV-3)

**Proof Specification:** `encode_decode_roundtrip`

**Test Case:**
```c
poly_t original = poly_from_bytes(...);
poly_t canonical, encoded_bytes, decoded, recanonical;

// Canonicalize
can_poly_canon(&original, &canonical);

// Encode
uint8_t* encoded = poly_encode(&canonical, &encoded_len);

// Decode
poly_decode(encoded, encoded_len, &decoded);

// Re-canonicalize
can_poly_canon(&decoded, &recanonical);

// Verify: recanonical == canonical (byte-identical)
assert(poly_eq(&canonical, &recanonical));
```

**Verification:** Matches `encode_decode_roundtrip` theorem (INV-3).

---

## Error Code Mapping

**Proof Layer:** `FanoError` inductive (lines 49-56)
```lean
inductive FanoError
| NO_PAIRWISE_INCIDENT
| NO_COMMON_CORE
| NON_IDEMPOTENT
| DEGENERATE_ABSORPTION
| MODE_MISMATCH
```

**Implementation Must Match:**
```c
typedef enum {
  FANO_NO_PAIRWISE_INCIDENT,   // S1 failed
  FANO_NO_COMMON_CORE,          // S2 failed
  FANO_NON_IDEMPOTENT,          // S3 failed
  FANO_DEGENERATE_ABSORPTION,   // S4 failed
  FANO_MODE_MISMATCH            // Invalid mode
} fano_error_t;
```

**Verification:** Enum values must correspond exactly to `FanoError` constructors.

---

## Golden Vector Testing

Once implementations exist, create golden vectors:

1. **Canonicalization golden vectors:**
   - Input polynomial → canonical output (byte hash)
   - Verify idempotence: hash(canon(canon(x))) == hash(canon(x))

2. **Fano validation golden vectors:**
   - Valid triads → FANO_OK
   - Invalid triads → specific error codes
   - Verify error codes match proof specifications

3. **Lattice operation golden vectors:**
   - Test all lattice laws with known polynomial pairs
   - Verify commutativity, associativity, absorption

4. **Determinism golden vectors:**
   - Same program + same state → same output hash
   - Verify replay determinism across multiple runs

---

## Integration with CI

Reference: `.github/workflows/ci.yml` (lines 117-138)

The CI pipeline expects:
- `make golden` — generates/verifies golden vectors
- `git diff --exit-code golden/` — ensures golden vectors are stable

**Agent 3 must ensure:**
- All golden vectors pass
- Golden vector hashes match proof specifications
- No non-deterministic behavior

---

## Proof-to-Implementation Bridge

**For each theorem in `proof/RFC0012_FoldVM.lean`:**

1. **Identify the implementation function** (e.g., `can_poly_canon` → `canon_idempotent`)
2. **Write test case** that verifies the theorem property
3. **Run test** and verify it passes
4. **Document** the mapping in implementation comments

**Example:**
```c
// Implements: canon_idempotent theorem (INV-1, proof/RFC0012_FoldVM.lean:123)
// Property: canon(canon(x)) = canon(x)
int can_poly_canon(const poly_t* in, poly_t* out) {
  // ... implementation ...
  // Test: test_canon_idempotence() must pass
}
```

---

## Status Tracking

**Agent 3 Implementation Status:**

- [ ] `can_fano_valid_strict` — matches `strict_fano_valid` spec
- [ ] `can_poly_canon` — satisfies `canon_idempotent` theorem
- [ ] `can_poly_gcd` — satisfies lattice laws (INV-7, INV-8, INV-9, INV-10)
- [ ] `can_poly_lcm` — satisfies lattice laws (INV-7, INV-8, INV-9, INV-10)
- [ ] Error codes — match `FanoError` inductive exactly
- [ ] Determinism — verified via `step_deterministic` and `replay_deterministic` tests
- [ ] Encoding/decoding — verified via `encode_decode_roundtrip` test

**Once all checked, Agent 0 can approve for merge.**

---

**Mnemonic:** `PROOF-IDEM-SAFE`  
**Status:** Verification guide complete; ready for Agent 3 implementation testing


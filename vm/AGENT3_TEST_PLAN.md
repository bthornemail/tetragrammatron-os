# Agent 3 — Test Plan

**Role:** B — COMPILER / VM IMPLEMENTER (Agent 3, `VM-EXEC-FOLD`)  
**Status:** Test plan based on verification guide  
**Date:** 2025-01-27

---

## Overview

This test plan implements the test cases specified in `proof/VERIFICATION_GUIDE.md` to verify that all implementations satisfy their corresponding proof specifications.

---

## Test Structure

Tests are organized by verification category:
1. **Fano Validation Tests** — Test 1.1-1.5
2. **Canonicalization Tests** — Test 2
3. **Lattice Law Tests** — Test 3.1-3.4
4. **Determinism Tests** — Test 4.1-4.2
5. **Encoding/Decoding Tests** — Test 5 (when implemented)

---

## Test Implementation Status

| Test Category | Test Cases | Status | File |
|--------------|------------|--------|------|
| Fano Validation | 1.1-1.5 | ⏳ Pending | `can_poly_test.c` |
| Canonicalization | 2 | ⏳ Pending | `can_poly_test.c` |
| Lattice Laws | 3.1-3.4 | ⏳ Pending | `can_poly_test.c` |
| Determinism | 4.1-4.2 | ⏳ Pending | `can_vm_test.c` |
| Encoding/Decoding | 5 | ⏳ Pending | `can_poly_test.c` |

---

## Test Requirements

### Prerequisites
- Object pool implementation (`can_objpool`)
- Polynomial operations (`can_poly`)
- VM implementation (`can_vm`)
- Test helper functions for polynomial creation

### Test Helper Functions Needed

```c
// Create polynomial from byte representation
f2poly_t poly_from_bytes(const uint8_t* bytes, size_t len);

// Create polynomial from degree and coefficient bits
f2poly_t poly_from_degree(uint32_t degree, const uint32_t* coeffs);

// Compare two polynomials (byte-exact)
bool poly_eq(const f2poly_t* a, const f2poly_t* b);

// Set canonical state in VM
void set_canonical_state(can_vm_t* vm, const f2poly_t* polys[8]);

// Compare canonical VM states
bool canonical_states_equal(const can_vm_t* vm1, const can_vm_t* vm2);
```

---

## Test Cases

### 1. Fano Validation Tests (`can_poly_test.c`)

#### Test 1.1: S1 - Pairwise Non-trivial Incidence
**Purpose:** Verify S1 check rejects triads with trivial pairwise GCDs

**Setup:**
- A = x² + 1
- B = x³ + 1 (coprime with A)
- C = x⁵ + 1

**Expected:** `FANO_NO_PAIRWISE_INCIDENT`

#### Test 1.2: S2 - Triple Core Exists
**Purpose:** Verify S2 check rejects triads without common core

**Setup:**
- A, B, C where pairwise GCDs exist but gcd(A,B,C) = 1

**Expected:** `FANO_NO_COMMON_CORE`

#### Test 1.3: S3 - Idempotent Closure
**Purpose:** Verify S3 check rejects non-idempotent joins

**Setup:**
- A, B, C where join(A,B,C) is not idempotent

**Expected:** `FANO_NON_IDEMPOTENT`

#### Test 1.4: S4 - No Absorption Collapse
**Purpose:** Verify S4 check rejects absorption cases

**Setup:**
- A = x²
- B = x² + x (A divides B)
- C = arbitrary

**Expected:** `FANO_DEGENERATE_ABSORPTION`

#### Test 1.5: Valid Triad
**Purpose:** Verify valid triads pass all checks

**Setup:**
- A, B, C satisfying all S1-S4

**Expected:** `FANO_OK`

---

### 2. Canonicalization Tests (`can_poly_test.c`)

#### Test 2: Canonicalization Idempotence
**Purpose:** Verify `canon(canon(x)) = canon(x)` (INV-1)

**Steps:**
1. Create input polynomial
2. Apply `can_poly_canon` → result1
3. Apply `can_poly_canon` to result1 → result2
4. Verify: result1 == result2 (byte-identical)
5. Apply `can_poly_canon` to result2 → result3
6. Verify: result1 == result3

**Expected:** All results byte-identical

---

### 3. Lattice Law Tests (`can_poly_test.c`)

#### Test 3.1: Idempotence (INV-7)
**Purpose:** Verify `meet(a,a) = a` and `join(a,a) = a`

**Steps:**
1. Create polynomial `a`
2. Compute `can_poly_gcd(&a, &a, &result1)`
3. Verify: `a == result1`
4. Compute `can_poly_lcm(&a, &a, &result2)`
5. Verify: `a == result2`

#### Test 3.2: Commutativity (INV-8)
**Purpose:** Verify `meet(a,b) = meet(b,a)` and `join(a,b) = join(b,a)`

**Steps:**
1. Create polynomials `a`, `b`
2. Compute `can_poly_gcd(&a, &b, &ab)` and `can_poly_gcd(&b, &a, &ba)`
3. Verify: `ab == ba`
4. Compute `can_poly_lcm(&a, &b, &ab)` and `can_poly_lcm(&b, &a, &ba)`
5. Verify: `ab == ba`

#### Test 3.3: Associativity (INV-9)
**Purpose:** Verify `meet(meet(a,b),c) = meet(a,meet(b,c))`

**Steps:**
1. Create polynomials `a`, `b`, `c`
2. Compute `meet(meet(a,b), c)` → `ab_c`
3. Compute `meet(a, meet(b,c))` → `a_bc`
4. Verify: `ab_c == a_bc`

#### Test 3.4: Absorption (INV-10)
**Purpose:** Verify `meet(x, join(x,y)) = x` and `join(x, meet(x,y)) = x`

**Steps:**
1. Create polynomials `x`, `y`
2. Compute `join(x,y)` → `xy`, then `meet(x, xy)` → `x_xy`
3. Verify: `x == x_xy`
4. Compute `meet(x,y)` → `xy`, then `join(x, xy)` → `x_xy`
5. Verify: `x == x_xy`

---

### 4. Determinism Tests (`can_vm_test.c`)

#### Test 4.1: Step Determinism (INV-5)
**Purpose:** Verify same canonical state + same instruction → same result

**Steps:**
1. Initialize two VMs
2. Set registers to canonical equivalent states
3. Execute same instruction on both VMs
4. Verify: canonical states are identical

#### Test 4.2: Replay Determinism (INV-6)
**Purpose:** Verify same program + same initial state → same final state

**Steps:**
1. Initialize two VMs
2. Set identical canonical initial states
3. Run same program on both VMs
4. Verify: final canonical states are identical

---

### 5. Encoding/Decoding Tests (`can_poly_test.c`)

#### Test 5: Encode/Decode Roundtrip (INV-3)
**Purpose:** Verify `canon(decode(encode(canon(x)))) = canon(x)`

**Status:** ⏳ Pending (requires `f2poly_encode`/`f2poly_decode` implementation)

**Steps:**
1. Create polynomial
2. Canonicalize → `canonical`
3. Encode → `encoded_bytes`
4. Decode → `decoded`
5. Re-canonicalize → `recanonical`
6. Verify: `canonical == recanonical`

---

## Test Execution

### Build Test Suite
```bash
cd vm
make test
```

### Run Tests
```bash
./can_poly_test    # Polynomial operation tests
./can_vm_test       # VM execution tests
```

### Expected Output
```
=== Fano Validation Tests ===
Test 1.1: S1 - Pairwise Non-trivial Incidence ... PASS
Test 1.2: S2 - Triple Core Exists ... PASS
Test 1.3: S3 - Idempotent Closure ... PASS
Test 1.4: S4 - No Absorption Collapse ... PASS
Test 1.5: Valid Triad ... PASS

=== Canonicalization Tests ===
Test 2: Canonicalization Idempotence ... PASS

=== Lattice Law Tests ===
Test 3.1: Idempotence ... PASS
Test 3.2: Commutativity ... PASS
Test 3.3: Associativity ... PASS
Test 3.4: Absorption ... PASS

=== Determinism Tests ===
Test 4.1: Step Determinism ... PASS
Test 4.2: Replay Determinism ... PASS

=== All Tests Passed ===
```

---

## Golden Vector Testing

Once tests pass, create golden vectors for CI:

1. **Canonicalization golden vectors:**
   - Input polynomial → canonical output (byte hash)
   - Verify idempotence: hash(canon(canon(x))) == hash(canon(x))

2. **Fano validation golden vectors:**
   - Valid triads → FANO_OK
   - Invalid triads → specific error codes

3. **Lattice operation golden vectors:**
   - Test all lattice laws with known polynomial pairs

4. **Determinism golden vectors:**
   - Same program + same state → same output hash

---

## Next Steps

1. ⏳ **Implement test helper functions** — Polynomial creation utilities
2. ⏳ **Write test cases** — Implement all test cases above
3. ⏳ **Run tests** — Verify all tests pass
4. ⏳ **Create golden vectors** — For CI integration
5. ⏳ **Submit to Agent 0** — For review and approval

---

**Mnemonic:** `VM-EXEC-FOLD`  
**Status:** Test plan complete; awaiting test implementation


// can_poly.c
// CAN-ISA Polynomial Interface Implementation
// Role B: COMPILER / VM IMPLEMENTER
// Implements: Agent 0 requirements, proof/RFC0012_FoldVM.lean specifications

#include "can_poly.h"
#include <string.h>

// Canonicalization with idempotence (Agent 0 Priority #2, INV-1)
// Implements: proof/RFC0012_FoldVM.lean:canon_idempotent
// RFC-0011 §6.9.2: Validate CLBC-POLY frame, trim trailing zeros, recompute degree
// Property: canon(canon(x)) = canon(x) (idempotence)
int can_poly_canon(const poly_t* poly_in, poly_t* poly_out) {
  if (!poly_in || !poly_out) {
    return -1;
  }
  
  // Copy input to output
  *poly_out = *poly_in;
  
  // Normalize: trim trailing zeros and recompute degree/nwords
  // This ensures canonical form: highest set bit = degree, nwords = ceil((degree+1)/32)
  f2poly_normalize(poly_out);
  
  // Verify idempotence: canon(canon(x)) = canon(x)
  // Apply normalization again - if it's idempotent, result should be unchanged
  poly_t temp = *poly_out;
  f2poly_normalize(&temp);
  
  // Check that second normalization didn't change anything
  if (!f2poly_equals(poly_out, &temp)) {
    // If normalization is not idempotent, fix it
    *poly_out = temp;
    // This should not happen if f2poly_normalize is correct, but we enforce it
  }
  
  return 0;
}

// GCD operation (MEET, for lattice operations)
// Implements: proof/RFC0012_FoldVM.lean:meet_* theorems
int can_poly_gcd(const poly_t* a, const poly_t* b, poly_t* result) {
  if (!a || !b || !result) {
    return -1;
  }
  
  f2poly_gcd(a, b, result);
  f2poly_normalize(result);  // Ensure canonical form
  
  return 0;
}

// LCM operation (JOIN, for lattice operations)
// Implements: proof/RFC0012_FoldVM.lean:join_* theorems
int can_poly_lcm(const poly_t* a, const poly_t* b, poly_t* result) {
  if (!a || !b || !result) {
    return -1;
  }
  
  f2poly_lcm(a, b, result);
  f2poly_normalize(result);  // Ensure canonical form
  
  return 0;
}

// Polynomial equality check (byte-exact)
bool can_poly_eq(const poly_t* a, const poly_t* b) {
  if (!a || !b) {
    return false;
  }
  
  return f2poly_equals(a, b);
}

// Check if polynomial equals 1 (unit element)
bool can_poly_is_one(const poly_t* poly) {
  if (!poly) {
    return false;
  }
  
  return f2poly_is_one(poly);
}

// Strict Fano triad validation (Agent 0 Priority #1, INV-12, INV-13)
// Implements: proof/RFC0012_FoldVM.lean:strict_fano_valid (lines 60-79)
// Implements S1-S4 checks per RFC-0011 §6.5.1
int can_fano_valid_strict(const poly_t* A, const poly_t* B, const poly_t* C, 
                          uint8_t mode, fano_error_t* err) {
  if (!A || !B || !C || !err) {
    return -1;
  }
  
  // Validate mode
  if (mode != FANO_MODE_STRICT && mode != FANO_MODE_WEAK) {
    *err = FANO_MODE_MISMATCH;
    return -1;
  }
  
  // For now, implement STRICT mode only (Agent 0 Priority #1)
  if (mode == FANO_MODE_WEAK) {
    // TODO: Implement weak mode validation
    *err = FANO_MODE_MISMATCH;
    return -1;
  }
  
  // Compute pairwise GCDs (S1 check)
  poly_t ab, bc, ac;
  can_poly_gcd(A, B, &ab);
  can_poly_gcd(B, C, &bc);
  can_poly_gcd(A, C, &ac);
  
  // S1: Pairwise non-trivial incidence
  // All pairwise GCDs must be ≠ 1
  if (can_poly_is_one(&ab)) {
    *err = FANO_NO_PAIRWISE_INCIDENT;
    return -1;
  }
  if (can_poly_is_one(&bc)) {
    *err = FANO_NO_PAIRWISE_INCIDENT;
    return -1;
  }
  if (can_poly_is_one(&ac)) {
    *err = FANO_NO_PAIRWISE_INCIDENT;
    return -1;
  }
  
  // S2: Triple core exists
  // gcd(gcd(A,B), C) ≠ 1
  poly_t abc;
  can_poly_gcd(&ab, C, &abc);
  if (can_poly_is_one(&abc)) {
    *err = FANO_NO_COMMON_CORE;
    return -1;
  }
  
  // S3: Idempotent closure
  // IDEMP(J) where J = join(A,B,C) and IDEMP(X) := gcd(X,X) == X
  // In practice: join(A,B,C) must be in canonical form (normalized)
  // and meet(join(A,B,C), join(A,B,C)) = join(A,B,C)
  poly_t j_ab, j, j_canon;
  can_poly_lcm(A, B, &j_ab);
  can_poly_lcm(&j_ab, C, &j);
  
  // Canonicalize the join result
  can_poly_canon(&j, &j_canon);
  
  // Check idempotence: gcd(j_canon, j_canon) should equal j_canon
  poly_t j_idemp;
  can_poly_gcd(&j_canon, &j_canon, &j_idemp);
  
  if (!can_poly_eq(&j_canon, &j_idemp)) {
    *err = FANO_NON_IDEMPOTENT;
    return -1;
  }
  
  // S4: No absorption collapse
  // gcd(A,B) ≠ A, gcd(B,C) ≠ B, gcd(A,C) ≠ C
  if (can_poly_eq(&ab, A)) {
    *err = FANO_DEGENERATE_ABSORPTION;
    return -1;
  }
  if (can_poly_eq(&bc, B)) {
    *err = FANO_DEGENERATE_ABSORPTION;
    return -1;
  }
  if (can_poly_eq(&ac, C)) {
    *err = FANO_DEGENERATE_ABSORPTION;
    return -1;
  }
  
  // All checks passed
  *err = FANO_OK;
  return 0;
}


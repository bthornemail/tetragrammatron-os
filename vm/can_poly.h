// can_poly.h
// CAN-ISA Polynomial Interface (RFC-0011 §6.9.2, RFC-0011 §6.5.1)
// Role B: COMPILER / VM IMPLEMENTER
// Implements: Agent 0 requirements, proof/RFC0012_FoldVM.lean specifications

#pragma once

#include <stdint.h>
#include <stdbool.h>
#include "f2poly.h"

#ifdef __cplusplus
extern "C" {
#endif

// Fano validation error codes (RFC-0011 §6.5.1, proof/RFC0012_FoldVM.lean:49-56)
typedef enum {
  FANO_OK = 0,
  FANO_NO_PAIRWISE_INCIDENT,  // S1 failed: pairwise GCDs are trivial
  FANO_NO_COMMON_CORE,        // S2 failed: triple core gcd(A,B,C) = 1
  FANO_NON_IDEMPOTENT,        // S3 failed: join(A,B,C) not idempotent
  FANO_DEGENERATE_ABSORPTION, // S4 failed: absorption collapse detected
  FANO_MODE_MISMATCH          // Invalid mode
} fano_error_t;

// Fano validation mode (RFC-0011 §6.5.1)
#define FANO_MODE_STRICT 0x00
#define FANO_MODE_WEAK   0x01

// Polynomial type alias for CAN-ISA interface
typedef f2poly_t poly_t;

// Canonicalization with idempotence (Agent 0 Priority #2, INV-1)
// Implements: proof/RFC0012_FoldVM.lean:canon_idempotent
// Property: canon(canon(x)) = canon(x)
// Returns: 0 on success, non-zero on error
int can_poly_canon(const poly_t* poly_in, poly_t* poly_out);

// GCD operation (MEET, for lattice operations)
// Implements: proof/RFC0012_FoldVM.lean:meet_* theorems
// Returns: 0 on success, non-zero on error
int can_poly_gcd(const poly_t* a, const poly_t* b, poly_t* result);

// LCM operation (JOIN, for lattice operations)
// Implements: proof/RFC0012_FoldVM.lean:join_* theorems
// Returns: 0 on success, non-zero on error
int can_poly_lcm(const poly_t* a, const poly_t* b, poly_t* result);

// Polynomial equality check (byte-exact)
// Returns: true if polynomials are byte-identical
bool can_poly_eq(const poly_t* a, const poly_t* b);

// Check if polynomial equals 1 (unit element)
// Returns: true if polynomial == 1
bool can_poly_is_one(const poly_t* poly);

// Strict Fano triad validation (Agent 0 Priority #1, INV-12, INV-13)
// Implements: proof/RFC0012_FoldVM.lean:strict_fano_valid (lines 60-79)
// Implements S1-S4 checks per RFC-0011 §6.5.1
// Returns: 0 (FANO_OK) on success, sets err to specific error code on failure
int can_fano_valid_strict(const poly_t* A, const poly_t* B, const poly_t* C, 
                          uint8_t mode, fano_error_t* err);

#ifdef __cplusplus
}
#endif


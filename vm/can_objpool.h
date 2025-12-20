// can_objpool.h
// Object Pool Interface for POLYTAB (RFC-0011 §6.2.1)
// Role B: COMPILER / VM IMPLEMENTER
// Implements: RFC-0011 §6.2.1 (CLBC-POLY v1 Frame Layout)

#pragma once

#include <stdint.h>
#include <stdbool.h>
#include "f2poly.h"

#ifdef __cplusplus
extern "C" {
#endif

// Maximum polynomials in pool (configurable)
#define OBJPOOL_MAX_POLYS 256

// Object pool structure
typedef struct {
  f2poly_t polys[OBJPOOL_MAX_POLYS];
  bool used[OBJPOOL_MAX_POLYS];  // Track which slots are used
  uint32_t next_id;  // Next available poly_id (1-based, 0 = invalid)
} can_objpool_t;

// Initialize object pool
void can_objpool_init(can_objpool_t* pool);

// Load polynomial from pool by poly_id
// Returns: true on success, false if poly_id invalid or not found
bool can_objpool_load_poly(const can_objpool_t* pool, uint32_t poly_id, f2poly_t* out);

// Store polynomial to pool, returns poly_id
// Returns: poly_id (> 0) on success, 0 on error (pool full)
uint32_t can_objpool_store_poly(can_objpool_t* pool, const f2poly_t* poly);

// Check if poly_id is valid and in use
bool can_objpool_has_poly(const can_objpool_t* pool, uint32_t poly_id);

#ifdef __cplusplus
}
#endif


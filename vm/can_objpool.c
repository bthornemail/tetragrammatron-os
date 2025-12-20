// can_objpool.c
// Object Pool Implementation for POLYTAB
// Role B: COMPILER / VM IMPLEMENTER

#include "can_objpool.h"
#include <string.h>

void can_objpool_init(can_objpool_t* pool) {
  if (!pool) return;
  memset(pool, 0, sizeof(can_objpool_t));
  pool->next_id = 1;  // Start IDs at 1 (0 = invalid)
}

bool can_objpool_load_poly(const can_objpool_t* pool, uint32_t poly_id, f2poly_t* out) {
  if (!pool || !out || poly_id == 0) {
    return false;
  }
  
  // poly_id is 1-based, convert to 0-based index
  uint32_t idx = poly_id - 1;
  
  if (idx >= OBJPOOL_MAX_POLYS || !pool->used[idx]) {
    return false;
  }
  
  *out = pool->polys[idx];
  return true;
}

uint32_t can_objpool_store_poly(can_objpool_t* pool, const f2poly_t* poly) {
  if (!pool || !poly) {
    return 0;
  }
  
  // Find first unused slot
  for (uint32_t i = 0; i < OBJPOOL_MAX_POLYS; i++) {
    if (!pool->used[i]) {
      pool->polys[i] = *poly;
      pool->used[i] = true;
      uint32_t poly_id = i + 1;  // 1-based ID
      if (poly_id >= pool->next_id) {
        pool->next_id = poly_id + 1;
      }
      return poly_id;
    }
  }
  
  // Pool full
  return 0;
}

bool can_objpool_has_poly(const can_objpool_t* pool, uint32_t poly_id) {
  if (!pool || poly_id == 0) {
    return false;
  }
  
  uint32_t idx = poly_id - 1;
  return (idx < OBJPOOL_MAX_POLYS && pool->used[idx]);
}


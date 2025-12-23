// addr_schema_validate.c
// DEPRECATED: Use components/tetragrammatron_schema/tetragrammatron_schema.c instead
// This file is kept for reference only.

// Fixed version using canonical header:
#include "../../components/tetragrammatron_schema/include/tetragrammatron_schema.h"

// Use the canonical function instead:
// bool tg_schema_prefix_valid_global(const tg_addr8_t *a);

// Legacy function (deprecated, use tg_schema_prefix_valid_global):
bool schema_prefix_valid(const uint8_t addr[8]) {
  tg_addr8_t a;
  for (int i = 0; i < 8; i++) {
    a.r[i] = addr[i];
  }
  return tg_schema_prefix_valid_global(&a);
}
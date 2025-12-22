// addr_schema_validate.c
#include "addr_schema_runtime.h"

bool schema_prefix_valid(const uint8_t addr[8]) {
  for (int i = 0; i < g_schema.schema_rows; i++) {
    row_spec_t *r = &g_schema.row[i];
    if (!r->fixed) continue;

    bool ok = false;
    for (int j = 0; j < r->allowed_count; j++) {
      if (addr[i] == r->allowed[j]) {
        ok = true;
        break;
      }
    }
    if (!ok) return false;
  }
  return true;
}
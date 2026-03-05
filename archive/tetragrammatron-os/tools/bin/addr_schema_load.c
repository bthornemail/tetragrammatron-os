// DEPRECATED: This file loads ABI v1 format.
// Use components/tetragrammatron_schema/tetragrammatron_schema.c instead (ABI v2).
// This file is kept for reference only and will be removed in a future release.

// addr_schema_load.c (ABI v1 - DEPRECATED)
#include "addr_schema_runtime.h"
#include "esp_log.h"

extern const uint8_t _binary_address_schema_bin_start[];
extern const uint8_t _binary_address_schema_bin_end[];

static address_schema_t g_schema;

bool schema_load(void) {
  size_t size = _binary_address_schema_bin_end -
                _binary_address_schema_bin_start;

  if (size < sizeof(address_schema_t)) return false;

  memcpy(&g_schema, _binary_address_schema_bin_start,
         sizeof(address_schema_t));

  if (g_schema.magic != 0x54414452) return false;
  if (g_schema.version != 1) return false;  // ABI v1 only (DEPRECATED)
  if (g_schema.rows != 8) return false;

  return true;
}
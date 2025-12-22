/* [[file:../../AGENT.org::*ESP32 runtime: schema load + prefix validation][ESP32 runtime: schema load + prefix validation:2]] */
#include "tetragrammatron_schema.h"
#include <string.h>

// If you embed build/address-schema.bin via ESP-IDF component embedding,
// you can provide these symbols. Otherwise load from SPIFFS/NVS.
extern const uint8_t _binary_address_schema_bin_start[];
extern const uint8_t _binary_address_schema_bin_end[];

tg_schema_t g_tg_schema;

static bool one_of(uint8_t x, const uint8_t *xs, uint8_t n) {
  for (uint8_t i = 0; i < n; i++) if (xs[i] == x) return true;
  return false;
}

bool tg_schema_load_from_bytes(const uint8_t *data, size_t len, tg_schema_t *out) {
  if (!data || !out) return false;
  if (len < sizeof(tg_schema_t)) return false;
  memcpy(out, data, sizeof(tg_schema_t));
  if (out->magic != TG_SCHEMA_MAGIC) return false;
  if (out->version != 1) return false;
  if (out->rows != 8) return false;
  if (out->schema_rows != 5) return false;
  return true;
}

bool tg_schema_prefix_valid(const tg_schema_t *s, const tg_addr8_t *a) {
  if (!s || !a) return false;
  // Validate R0..R4
  for (int i = 0; i < (int)s->schema_rows; i++) {
    const tg_row_spec_t *r = &s->row[i];
    if (!r->fixed) continue;
    if (!one_of(a->r[i], r->allowed, r->allowed_count)) return false;
  }
  return true;
}

bool tg_schema_prefix_valid_global(const tg_addr8_t *a) {
  return tg_schema_prefix_valid(&g_tg_schema, a);
}

// Optional helper: load the embedded binary blob at boot
bool tg_schema_load_embedded(void) {
  const uint8_t *start = _binary_address_schema_bin_start;
  const uint8_t *end   = _binary_address_schema_bin_end;
  size_t len = (size_t)(end - start);
  return tg_schema_load_from_bytes(start, len, &g_tg_schema);
}
/* ESP32 runtime: schema load + prefix validation:2 ends here */

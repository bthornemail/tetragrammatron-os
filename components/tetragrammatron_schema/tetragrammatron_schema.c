/* [[file:../../AGENT.org::*ESP32 runtime: schema load + prefix validation][ESP32 runtime: schema load + prefix validation:2]] */
#include "tetragrammatron_schema.h"
#include <string.h>
#include <stdlib.h>

// If you embed build/address-schema.bin via ESP-IDF component embedding,
// you can provide these symbols. Otherwise load from SPIFFS/NVS.
extern const uint8_t _binary_address_schema_bin_start[];
extern const uint8_t _binary_address_schema_bin_end[];

tg_schema_t *g_tg_schema = NULL;

// Helper: check if prefix matches
static bool prefix_matches(const tg_prefix40_t *prefix, const uint8_t addr[8]) {
  for (int i = 0; i < 5; i++) {
    if (prefix->bytes[i] != addr[i]) return false;
  }
  return true;
}

bool tg_schema_load_from_bytes(const uint8_t *data, size_t len, tg_schema_t **out) {
  if (!data || !out || len < 13) return false;  // Minimum header size
  
  // Check magic
  if (data[0] != 'T' || data[1] != 'A' || data[2] != 'D' || data[3] != 'R') {
    return false;
  }
  
  // Check version (little-endian)
  uint16_t version = (uint16_t)data[4] | ((uint16_t)data[5] << 8);
  if (version != 2) return false;  // ABI v2 only
  
  // Check rows
  if (data[6] != 8 || data[7] != 5) return false;
  
      // Read header fields
      uint8_t prefix_count = data[12];
      if (prefix_count == 0) return false;
      // Note: prefix_count is uint8_t (0-255), and TG_SCHEMA_MAX_PREFIXES is 255,
      // so prefix_count > 255 is always false. The check is removed to avoid compiler warning.
  
  // Calculate required size
  size_t required_size = 13 + (prefix_count * 5);
  if (len < required_size) return false;
  
  // Allocate schema structure
  tg_schema_t *s = (tg_schema_t *)malloc(required_size);
  if (!s) return false;
  
  // Copy header
  s->magic = TG_SCHEMA_MAGIC;
  s->version = version;
  s->rows = data[6];
  s->schema_rows = data[7];
  s->schema_class = data[8];
  s->realm = data[9];
  s->epoch = (uint16_t)data[10] | ((uint16_t)data[11] << 8);
  s->prefix_count = prefix_count;
  
  // Copy prefixes
  const uint8_t *prefix_data = data + 13;
  for (uint8_t i = 0; i < prefix_count; i++) {
    memcpy(s->prefixes[i].bytes, prefix_data + (i * 5), 5);
  }
  
  *out = s;
  return true;
}

void tg_schema_free(tg_schema_t *s) {
  if (s) free(s);
}

bool tg_schema_prefix_valid(const tg_schema_t *s, const tg_addr8_t *a) {
  if (!s || !a) return false;
  
  // Check realm matches
  if (a->r[0] != s->realm) return false;
  
  // Check prefix against list
  for (uint8_t i = 0; i < s->prefix_count; i++) {
    if (prefix_matches(&s->prefixes[i], a->r)) {
      return true;
    }
  }
  
  return false;
}

bool tg_schema_prefix_valid_global(const tg_addr8_t *a) {
  if (!g_tg_schema) return false;
  return tg_schema_prefix_valid(g_tg_schema, a);
}

tg_schema_class_t tg_schema_get_class(const tg_schema_t *s) {
  if (!s) return TG_SCHEMA_CLASS_PUBLIC;
  return (tg_schema_class_t)s->schema_class;
}

uint8_t tg_schema_get_realm(const tg_schema_t *s) {
  if (!s) return 0;
  return s->realm;
}

uint16_t tg_schema_get_epoch(const tg_schema_t *s) {
  if (!s) return 0;
  return s->epoch;
}

// Optional helper: load the embedded binary blob at boot
bool tg_schema_load_embedded(void) {
  const uint8_t *start = _binary_address_schema_bin_start;
  const uint8_t *end   = _binary_address_schema_bin_end;
  size_t len = (size_t)(end - start);
  
  // Free existing schema if any
  if (g_tg_schema) {
    tg_schema_free(g_tg_schema);
    g_tg_schema = NULL;
  }
  
  return tg_schema_load_from_bytes(start, len, &g_tg_schema);
}
/* ESP32 runtime: schema load + prefix validation:2 ends here */

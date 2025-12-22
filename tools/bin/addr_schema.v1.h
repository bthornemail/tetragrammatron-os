
// addr_schema.h
#pragma once
#include <stdint.h>
#include <stdbool.h>

typedef struct {
  uint8_t r[8]; // R0..R7
} addr8_t;

// helpers
static inline bool one_of(uint8_t x, const uint8_t *xs, int n) {
  for (int i = 0; i < n; i++) if (xs[i] == x) return true;
  return false;
}

// Authoritative schema sets (v1)
static const uint8_t REALMS[]     = { 0x00, 0x01, 0x1A };
static const uint8_t ONTOLOGY[]   = { 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07 };
static const uint8_t CAPABILITY[] = { 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07 };
static const uint8_t PROCESS[]    = { 0x01, 0x02, 0x03, 0x04, 0x05, 0x06 };
static const uint8_t CONTEXT[]    = { 0x01, 0x02, 0x03, 0x04, 0x05, 0x06 };

static inline bool schema_prefix_valid(const addr8_t *a) {
  return one_of(a->r[0], REALMS,     (int)(sizeof(REALMS)))
      && one_of(a->r[1], ONTOLOGY,   (int)(sizeof(ONTOLOGY)))
      && one_of(a->r[2], CAPABILITY, (int)(sizeof(CAPABILITY)))
      && one_of(a->r[3], PROCESS,    (int)(sizeof(PROCESS)))
      && one_of(a->r[4], CONTEXT,    (int)(sizeof(CONTEXT)));
}
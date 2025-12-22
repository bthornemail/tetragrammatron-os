/* [[file:../../../AGENT.org::*ESP32 runtime: schema load + prefix validation][ESP32 runtime: schema load + prefix validation:1]] */
#pragma once
#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

// Addr8: R0..R7
typedef struct { uint8_t r[8]; } tg_addr8_t;

// Binary schema ABI (v1)
#define TG_SCHEMA_MAGIC 0x54414452u /* 'TADR' */
#define TG_SCHEMA_MAX_ALLOWED 16
#define TG_SCHEMA_ROWS 8

typedef struct {
  uint8_t fixed;          // 1 = fixed, 0 = free
  uint8_t allowed_count;  // 0 if free
  uint8_t allowed[TG_SCHEMA_MAX_ALLOWED];
} tg_row_spec_t;

typedef struct {
  uint32_t magic;
  uint16_t version;
  uint8_t  rows;
  uint8_t  schema_rows; // 5
  tg_row_spec_t row[TG_SCHEMA_ROWS];
} tg_schema_t;

// Load schema from bytes (for unit tests or custom storage)
bool tg_schema_load_from_bytes(const uint8_t *data, size_t len, tg_schema_t *out);

// Validate prefix R0..R4 according to schema (data-driven)
bool tg_schema_prefix_valid(const tg_schema_t *s, const tg_addr8_t *a);

// Convenience: validate prefix against globally loaded schema
bool tg_schema_prefix_valid_global(const tg_addr8_t *a);

// Global schema storage
extern tg_schema_t g_tg_schema;

#ifdef __cplusplus
}
#endif
/* ESP32 runtime: schema load + prefix validation:1 ends here */

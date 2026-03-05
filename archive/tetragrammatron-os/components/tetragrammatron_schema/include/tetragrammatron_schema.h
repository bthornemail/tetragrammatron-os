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

// Binary schema ABI v2
#define TG_SCHEMA_MAGIC 0x54414452u /* 'TADR' */
#define TG_SCHEMA_ROWS 8
#define TG_SCHEMA_ROWS_SCHEMA 5
#define TG_SCHEMA_MAX_PREFIXES 255

// Schema class enumeration
typedef enum {
  TG_SCHEMA_CLASS_PRIVATE = 0,
  TG_SCHEMA_CLASS_PROTECTED = 1,
  TG_SCHEMA_CLASS_PUBLIC = 2
} tg_schema_class_t;

// ABI v2: Prefix list format (compact, efficient)
typedef struct {
  uint8_t bytes[5];  // R0:R1:R2:R3:R4
} tg_prefix40_t;

typedef struct {
  uint32_t magic;           // 'TADR'
  uint16_t version;         // 2 (ABI v2)
  uint8_t  rows;            // 8
  uint8_t  schema_rows;     // 5
  uint8_t  schema_class;    // 0=private, 1=protected, 2=public
  uint8_t  realm;           // R0 byte
  uint16_t epoch;           // monotonic version (little-endian)
  uint8_t  prefix_count;    // number of valid prefixes
  tg_prefix40_t prefixes[]; // variable-length array of prefixes
} tg_schema_t;

// Load schema from bytes (ABI v2 format)
// Returns true on success, false on invalid format
bool tg_schema_load_from_bytes(const uint8_t *data, size_t len, tg_schema_t **out);

// Free schema loaded by tg_schema_load_from_bytes
void tg_schema_free(tg_schema_t *s);

// Validate prefix R0..R4 according to schema (data-driven, ABI v2)
bool tg_schema_prefix_valid(const tg_schema_t *s, const tg_addr8_t *a);

// Convenience: validate prefix against globally loaded schema
bool tg_schema_prefix_valid_global(const tg_addr8_t *a);

// Get schema class
tg_schema_class_t tg_schema_get_class(const tg_schema_t *s);

// Get realm
uint8_t tg_schema_get_realm(const tg_schema_t *s);

// Get epoch
uint16_t tg_schema_get_epoch(const tg_schema_t *s);

// Global schema storage
extern tg_schema_t *g_tg_schema;

// Optional helper: load the embedded binary blob at boot
bool tg_schema_load_embedded(void);

#ifdef __cplusplus
}
#endif
/* ESP32 runtime: schema load + prefix validation:1 ends here */

// DEPRECATED: This file uses ABI v1 format (row specs).
// Use components/tetragrammatron_schema/include/tetragrammatron_schema.h instead (ABI v2).
// This file is kept for reference only and will be removed in a future release.

// addr_schema_runtime.h (ABI v1 - DEPRECATED)
#pragma once
#include <stdint.h>
#include <stdbool.h>

#define SCHEMA_MAX_ALLOWED 16
#define SCHEMA_ROWS 8

typedef struct {
  uint8_t fixed;
  uint8_t allowed_count;
  uint8_t allowed[SCHEMA_MAX_ALLOWED];
} row_spec_t;

typedef struct {
  uint32_t magic;
  uint16_t version;  // v1 (DEPRECATED - use v2)
  uint8_t  rows;
  uint8_t  schema_rows;
  row_spec_t row[SCHEMA_ROWS];
} address_schema_t;
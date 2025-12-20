// canb_reader.h
// CANB v1 Container Reader (RFC-0012)
// Role: Agent 2 — CAN-ISA / BINARY ENCODING ENGINEER (CAN-BIT-TRUTH)
// Implements: RFC-0012 §4 (CANB Container Format) - Reader utilities

#pragma once

#include "canb_container.h"
#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

// Read CANB container from file
// Returns true on success, false on error
bool canb_read_file(const char* filename, canb_container_t* container);

// Read CANB container from memory
// Returns true on success, false on error
bool canb_read_memory(const uint8_t* data, size_t data_len, canb_container_t* container);

// Free CANB container (deallocates sections)
void canb_free_container(canb_container_t* container);

// Find section by type
// Returns pointer to section or NULL if not found
const canb_section_t* canb_find_section(const canb_container_t* container, uint8_t section_type);

// Get CODE section (instruction stream)
// Returns pointer to section data or NULL if not found
const uint8_t* canb_get_code_section(const canb_container_t* container, size_t* out_len);

// Get DATA section (object pool)
// Returns pointer to section data or NULL if not found
const uint8_t* canb_get_data_section(const canb_container_t* container, size_t* out_len);

// Get META section (metadata)
// Returns pointer to section data or NULL if not found
const uint8_t* canb_get_meta_section(const canb_container_t* container, size_t* out_len);

// Get PROOF section (proof witness)
// Returns pointer to section data or NULL if not found
const uint8_t* canb_get_proof_section(const canb_container_t* container, size_t* out_len);

#ifdef __cplusplus
}
#endif




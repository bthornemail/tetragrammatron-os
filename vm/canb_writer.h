// canb_writer.h
// CANB v1 Container Writer (RFC-0012)
// Role: Agent 2 — CAN-ISA / BINARY ENCODING ENGINEER (CAN-BIT-TRUTH)
// Implements: RFC-0012 §4 (CANB Container Format) - Writer utilities

#pragma once

#include "canb_container.h"
#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

// Write CANB container to file
// Returns true on success, false on error
bool canb_write_file(const char* filename, const canb_container_t* container);

// Write CANB container to memory buffer
// Returns number of bytes written, or -1 on error
// Caller must free the buffer
int canb_write_memory(const canb_container_t* container, uint8_t** out_data, size_t* out_len);

// Create empty CANB container
void canb_init_container(canb_container_t* container);

// Add section to container
// Returns true on success, false on error (e.g., out of memory)
// Takes ownership of data (will be freed by canb_free_container)
bool canb_add_section(canb_container_t* container, uint8_t section_type, uint8_t* data, size_t data_size);

// Create CODE section from instruction stream
// Returns true on success, false on error
bool canb_add_code_section(canb_container_t* container, const uint8_t* instructions, size_t inst_count);

// Create DATA section from object pool data
// Returns true on success, false on error
bool canb_add_data_section(canb_container_t* container, const uint8_t* data, size_t data_size);

// Finalize container (compute checksum, validate)
// Returns true on success, false on error
bool canb_finalize_container(canb_container_t* container);

#ifdef __cplusplus
}
#endif




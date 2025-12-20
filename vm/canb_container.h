// canb_container.h
// CANB v1 Container Format (RFC-0012)
// Role: Agent 2 — CAN-ISA / BINARY ENCODING ENGINEER (CAN-BIT-TRUTH)
// Implements: RFC-0012 §4 (CANB Container Format)

#pragma once

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

// CANB v1 Container Header (16 bytes, RFC-0012 §4.2)
typedef struct {
  uint8_t magic[4];        // "CANB" (0x43 0x41 0x4E 0x42)
  uint8_t ver;             // Version (0x01)
  uint8_t flags;           // Reserved, MUST be 0
  uint16_t section_count;  // Number of sections (big-endian)
  uint32_t header_checksum; // CRC32 of header (big-endian)
  uint32_t reserved;       // MUST be 0 (big-endian)
} __attribute__((packed)) canb_header_t;

// CANB Section Header (4 bytes, RFC-0012 §4.3)
typedef struct {
  uint8_t section_type;    // Section type (RFC-0012 §4.4)
  uint8_t section_size[3]; // Section size in bytes, excluding header (big-endian, 24-bit)
} __attribute__((packed)) canb_section_header_t;

// Section types (RFC-0012 §4.4)
#define CANB_SECT_CODE  0x01  // Instruction stream
#define CANB_SECT_DATA  0x02  // Object pool data
#define CANB_SECT_META  0x03  // Metadata (non-executable)
#define CANB_SECT_PROOF 0x04  // Proof witness data

// CANB Section structure
typedef struct {
  canb_section_header_t header;
  uint8_t* data;           // Section data (allocated separately)
  size_t data_size;        // Actual data size
} canb_section_t;

// CANB Container structure
typedef struct {
  canb_header_t header;
  canb_section_t* sections; // Array of sections
  size_t section_count;     // Number of sections
} canb_container_t;

// Validate CANB container header
// Returns true if header is valid, false otherwise
bool canb_validate_header(const canb_header_t* header);

// Decode CANB container header from bytes (big-endian)
// Returns true on success, false on error
bool canb_decode_header(const uint8_t* bytes, canb_header_t* out);

// Encode CANB container header to bytes (big-endian)
void canb_encode_header(const canb_header_t* header, uint8_t* bytes);

// Compute CRC32 checksum for header
// RFC-0012 §4.2: HEADER_CHECKSUM is CRC32 of header bytes
// Note: Checksum field itself is set to 0 during computation
uint32_t canb_compute_header_crc32(const canb_header_t* header);

// Decode CANB section header from bytes (big-endian)
// Returns true on success, false on error
bool canb_decode_section_header(const uint8_t* bytes, canb_section_header_t* out);

// Encode CANB section header to bytes (big-endian)
void canb_encode_section_header(const canb_section_header_t* header, uint8_t* bytes);

// Get section size from section header (24-bit big-endian)
uint32_t canb_get_section_size(const canb_section_header_t* header);

// Set section size in section header (24-bit big-endian)
void canb_set_section_size(canb_section_header_t* header, uint32_t size);

#ifdef __cplusplus
}
#endif


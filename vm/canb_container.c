// canb_container.c
// CANB v1 Container Format Implementation (RFC-0012)
// Role: Agent 2 — CAN-ISA / BINARY ENCODING ENGINEER (CAN-BIT-TRUTH)
// Implements: RFC-0012 §4 (CANB Container Format)

#include "canb_container.h"
#include "can_codec.h"  // For big-endian helpers
#include <string.h>
#include <stddef.h>

// Simple CRC32 implementation (RFC-0012 §4.2 requires CRC32)
// Polynomial: 0xEDB88320 (standard CRC-32)
static uint32_t crc32_table[256];
static bool crc32_table_initialized = false;

static void init_crc32_table(void) {
  if (crc32_table_initialized) return;
  
  uint32_t polynomial = 0xEDB88320;
  for (uint32_t i = 0; i < 256; i++) {
    uint32_t crc = i;
    for (int j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >> 1) ^ polynomial;
      } else {
        crc >>= 1;
      }
    }
    crc32_table[i] = crc;
  }
  crc32_table_initialized = true;
}

static uint32_t compute_crc32(const uint8_t* data, size_t len) {
  init_crc32_table();
  uint32_t crc = 0xFFFFFFFF;
  for (size_t i = 0; i < len; i++) {
    crc = (crc >> 8) ^ crc32_table[(crc ^ data[i]) & 0xFF];
  }
  return crc ^ 0xFFFFFFFF;
}

// Decode CANB container header from bytes (big-endian)
bool canb_decode_header(const uint8_t* bytes, canb_header_t* out) {
  if (!bytes || !out) return false;
  
  memcpy(out->magic, bytes, 4);
  out->ver = bytes[4];
  out->flags = bytes[5];
  out->section_count = read_u16be(bytes + 6);
  out->header_checksum = read_u32be(bytes + 8);
  out->reserved = read_u32be(bytes + 12);
  
  return true;
}

// Encode CANB container header to bytes (big-endian)
void canb_encode_header(const canb_header_t* header, uint8_t* bytes) {
  if (!header || !bytes) return;
  
  memcpy(bytes, header->magic, 4);
  bytes[4] = header->ver;
  bytes[5] = header->flags;
  write_u16be(bytes + 6, header->section_count);
  write_u32be(bytes + 8, header->header_checksum);
  write_u32be(bytes + 12, header->reserved);
}

// Compute CRC32 checksum for header
// RFC-0012 §4.2: HEADER_CHECKSUM is CRC32 of header bytes
// Checksum field itself is set to 0 during computation
uint32_t canb_compute_header_crc32(const canb_header_t* header) {
  if (!header) return 0;
  
  // Create temporary header with checksum set to 0
  canb_header_t temp = *header;
  temp.header_checksum = 0;
  
  // Encode to bytes
  uint8_t header_bytes[16];
  canb_encode_header(&temp, header_bytes);
  
  // Compute CRC32
  return compute_crc32(header_bytes, 16);
}

// Validate CANB container header
bool canb_validate_header(const canb_header_t* header) {
  if (!header) return false;
  
  // Check magic number (RFC-0012 §4.2)
  if (header->magic[0] != 0x43 || header->magic[1] != 0x41 ||
      header->magic[2] != 0x4E || header->magic[3] != 0x42) {
    return false;
  }
  
  // Check version (RFC-0012 §4.2)
  if (header->ver != 0x01) {
    return false;
  }
  
  // Check flags (RFC-0012 §4.2: reserved, MUST be 0)
  if (header->flags != 0) {
    return false;
  }
  
  // Check section count (RFC-0012 §9.2: must be non-zero)
  if (header->section_count == 0) {
    return false;
  }
  
  // Check reserved field (RFC-0012 §4.2: MUST be 0)
  if (header->reserved != 0) {
    return false;
  }
  
  // Validate checksum (RFC-0012 §4.2)
  uint32_t computed_crc = canb_compute_header_crc32(header);
  if (computed_crc != header->header_checksum) {
    return false;
  }
  
  return true;
}

// Decode CANB section header from bytes (big-endian)
bool canb_decode_section_header(const uint8_t* bytes, canb_section_header_t* out) {
  if (!bytes || !out) return false;
  
  out->section_type = bytes[0];
  // Decode 24-bit big-endian size
  out->section_size[0] = bytes[1];
  out->section_size[1] = bytes[2];
  out->section_size[2] = bytes[3];
  
  return true;
}

// Encode CANB section header to bytes (big-endian)
void canb_encode_section_header(const canb_section_header_t* header, uint8_t* bytes) {
  if (!header || !bytes) return;
  
  bytes[0] = header->section_type;
  bytes[1] = header->section_size[0];
  bytes[2] = header->section_size[1];
  bytes[3] = header->section_size[2];
}

// Get section size from section header (24-bit big-endian)
uint32_t canb_get_section_size(const canb_section_header_t* header) {
  if (!header) return 0;
  
  return ((uint32_t)header->section_size[0] << 16) |
         ((uint32_t)header->section_size[1] << 8) |
         (uint32_t)header->section_size[2];
}

// Set section size in section header (24-bit big-endian)
void canb_set_section_size(canb_section_header_t* header, uint32_t size) {
  if (!header) return;
  
  // Clamp to 24-bit maximum
  if (size > 0x00FFFFFF) size = 0x00FFFFFF;
  
  header->section_size[0] = (uint8_t)((size >> 16) & 0xFF);
  header->section_size[1] = (uint8_t)((size >> 8) & 0xFF);
  header->section_size[2] = (uint8_t)(size & 0xFF);
}


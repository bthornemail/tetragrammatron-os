// canb_writer.c
// CANB v1 Container Writer Implementation (RFC-0012)
// Role: Agent 2 — CAN-ISA / BINARY ENCODING ENGINEER (CAN-BIT-TRUTH)
// Implements: RFC-0012 §4 - Container writing utilities

#include "canb_writer.h"
#include "canb_container.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

// Initialize empty container
void canb_init_container(canb_container_t* container) {
  if (!container) return;
  
  memset(container, 0, sizeof(canb_container_t));
  memcpy(container->header.magic, "CANB", 4);
  container->header.ver = 0x01;
  container->header.flags = 0;
  container->header.reserved = 0;
}

// Add section to container
bool canb_add_section(canb_container_t* container, uint8_t section_type, uint8_t* data, size_t data_size) {
  if (!container) return false;
  
  // Clamp data_size to 24-bit maximum
  if (data_size > 0x00FFFFFF) data_size = 0x00FFFFFF;
  
  // Reallocate sections array
  size_t new_count = container->section_count + 1;
  canb_section_t* new_sections = (canb_section_t*)realloc(container->sections, new_count * sizeof(canb_section_t));
  if (!new_sections) return false;
  
  container->sections = new_sections;
  
  // Initialize new section
  canb_section_t* sect = &container->sections[container->section_count];
  sect->header.section_type = section_type;
  canb_set_section_size(&sect->header, (uint32_t)data_size);
  sect->data = data;  // Takes ownership
  sect->data_size = data_size;
  
  container->section_count = new_count;
  return true;
}

// Create CODE section from instruction stream
bool canb_add_code_section(canb_container_t* container, const uint8_t* instructions, size_t inst_count) {
  if (!container || !instructions) return false;
  
  size_t data_size = inst_count * 4;  // Each instruction is 4 bytes
  uint8_t* data = (uint8_t*)malloc(data_size);
  if (!data) return false;
  
  memcpy(data, instructions, data_size);
  return canb_add_section(container, CANB_SECT_CODE, data, data_size);
}

// Create DATA section from object pool data
bool canb_add_data_section(canb_container_t* container, const uint8_t* data, size_t data_size) {
  if (!container || !data) return false;
  
  uint8_t* copy = (uint8_t*)malloc(data_size);
  if (!copy) return false;
  
  memcpy(copy, data, data_size);
  return canb_add_section(container, CANB_SECT_DATA, copy, data_size);
}

// Finalize container (compute checksum)
bool canb_finalize_container(canb_container_t* container) {
  if (!container) return false;
  
  // Update section count
  container->header.section_count = (uint16_t)container->section_count;
  
  // Compute and set checksum
  container->header.header_checksum = canb_compute_header_crc32(&container->header);
  
  // Validate
  return canb_validate_header(&container->header);
}

// Write CANB container to file
bool canb_write_file(const char* filename, const canb_container_t* container) {
  if (!filename || !container) return false;
  
  FILE* f = fopen(filename, "wb");
  if (!f) return false;
  
  // Write header
  uint8_t header_bytes[16];
  canb_encode_header(&container->header, header_bytes);
  if (fwrite(header_bytes, 1, 16, f) != 16) {
    fclose(f);
    return false;
  }
  
  // Write sections
  for (size_t i = 0; i < container->section_count; i++) {
    // Write section header
    uint8_t sect_header_bytes[4];
    canb_encode_section_header(&container->sections[i].header, sect_header_bytes);
    if (fwrite(sect_header_bytes, 1, 4, f) != 4) {
      fclose(f);
      return false;
    }
    
    // Write section data
    if (container->sections[i].data_size > 0) {
      if (fwrite(container->sections[i].data, 1, container->sections[i].data_size, f) != container->sections[i].data_size) {
        fclose(f);
        return false;
      }
    }
  }
  
  fclose(f);
  return true;
}

// Write CANB container to memory buffer
int canb_write_memory(const canb_container_t* container, uint8_t** out_data, size_t* out_len) {
  if (!container || !out_data || !out_len) return -1;
  
  // Calculate total size
  size_t total_size = 16;  // Header
  for (size_t i = 0; i < container->section_count; i++) {
    total_size += 4;  // Section header
    total_size += container->sections[i].data_size;  // Section data
  }
  
  // Allocate buffer
  uint8_t* buffer = (uint8_t*)malloc(total_size);
  if (!buffer) return -1;
  
  size_t offset = 0;
  
  // Write header
  canb_encode_header(&container->header, buffer + offset);
  offset += 16;
  
  // Write sections
  for (size_t i = 0; i < container->section_count; i++) {
    // Write section header
    canb_encode_section_header(&container->sections[i].header, buffer + offset);
    offset += 4;
    
    // Write section data
    if (container->sections[i].data_size > 0) {
      memcpy(buffer + offset, container->sections[i].data, container->sections[i].data_size);
      offset += container->sections[i].data_size;
    }
  }
  
  *out_data = buffer;
  *out_len = total_size;
  return (int)total_size;
}




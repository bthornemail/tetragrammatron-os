// canb_reader.c
// CANB v1 Container Reader Implementation (RFC-0012)
// Role: Agent 2 — CAN-ISA / BINARY ENCODING ENGINEER (CAN-BIT-TRUTH)
// Implements: RFC-0012 §4 - Container reading utilities

#include "canb_reader.h"
#include "canb_container.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

// Read CANB container from file
bool canb_read_file(const char* filename, canb_container_t* container) {
  if (!filename || !container) return false;
  
  FILE* f = fopen(filename, "rb");
  if (!f) return false;
  
  // Read header
  uint8_t header_bytes[16];
  if (fread(header_bytes, 1, 16, f) != 16) {
    fclose(f);
    return false;
  }
  
  if (!canb_decode_header(header_bytes, &container->header)) {
    fclose(f);
    return false;
  }
  
  if (!canb_validate_header(&container->header)) {
    fclose(f);
    return false;
  }
  
  // Allocate sections array
  container->section_count = container->header.section_count;
  container->sections = (canb_section_t*)calloc(container->section_count, sizeof(canb_section_t));
  if (!container->sections) {
    fclose(f);
    return false;
  }
  
  // Read sections
  for (size_t i = 0; i < container->section_count; i++) {
    // Read section header
    uint8_t sect_header_bytes[4];
    if (fread(sect_header_bytes, 1, 4, f) != 4) {
      canb_free_container(container);
      fclose(f);
      return false;
    }
    
    if (!canb_decode_section_header(sect_header_bytes, &container->sections[i].header)) {
      canb_free_container(container);
      fclose(f);
      return false;
    }
    
    // Read section data
    uint32_t data_size = canb_get_section_size(&container->sections[i].header);
    container->sections[i].data_size = data_size;
    
    if (data_size > 0) {
      container->sections[i].data = (uint8_t*)malloc(data_size);
      if (!container->sections[i].data) {
        canb_free_container(container);
        fclose(f);
        return false;
      }
      
      if (fread(container->sections[i].data, 1, data_size, f) != data_size) {
        canb_free_container(container);
        fclose(f);
        return false;
      }
    } else {
      container->sections[i].data = NULL;
    }
  }
  
  fclose(f);
  return true;
}

// Read CANB container from memory
bool canb_read_memory(const uint8_t* data, size_t data_len, canb_container_t* container) {
  if (!data || !container || data_len < 16) return false;
  
  // Decode header
  if (!canb_decode_header(data, &container->header)) {
    return false;
  }
  
  if (!canb_validate_header(&container->header)) {
    return false;
  }
  
  // Allocate sections array
  container->section_count = container->header.section_count;
  container->sections = (canb_section_t*)calloc(container->section_count, sizeof(canb_section_t));
  if (!container->sections) {
    return false;
  }
  
  // Read sections
  size_t offset = 16;  // Skip header
  for (size_t i = 0; i < container->section_count; i++) {
    if (offset + 4 > data_len) {
      canb_free_container(container);
      return false;
    }
    
    // Decode section header
    if (!canb_decode_section_header(data + offset, &container->sections[i].header)) {
      canb_free_container(container);
      return false;
    }
    offset += 4;
    
    // Read section data
    uint32_t data_size = canb_get_section_size(&container->sections[i].header);
    container->sections[i].data_size = data_size;
    
    if (offset + data_size > data_len) {
      canb_free_container(container);
      return false;
    }
    
    if (data_size > 0) {
      container->sections[i].data = (uint8_t*)malloc(data_size);
      if (!container->sections[i].data) {
        canb_free_container(container);
        return false;
      }
      memcpy(container->sections[i].data, data + offset, data_size);
      offset += data_size;
    } else {
      container->sections[i].data = NULL;
    }
  }
  
  return true;
}

// Free CANB container
void canb_free_container(canb_container_t* container) {
  if (!container) return;
  
  if (container->sections) {
    for (size_t i = 0; i < container->section_count; i++) {
      if (container->sections[i].data) {
        free(container->sections[i].data);
        container->sections[i].data = NULL;
      }
    }
    free(container->sections);
    container->sections = NULL;
  }
  
  container->section_count = 0;
  memset(&container->header, 0, sizeof(container->header));
}

// Find section by type
const canb_section_t* canb_find_section(const canb_container_t* container, uint8_t section_type) {
  if (!container || !container->sections) return NULL;
  
  for (size_t i = 0; i < container->section_count; i++) {
    if (container->sections[i].header.section_type == section_type) {
      return &container->sections[i];
    }
  }
  return NULL;
}

// Get CODE section
const uint8_t* canb_get_code_section(const canb_container_t* container, size_t* out_len) {
  const canb_section_t* sect = canb_find_section(container, CANB_SECT_CODE);
  if (!sect) return NULL;
  
  if (out_len) *out_len = sect->data_size;
  return sect->data;
}

// Get DATA section
const uint8_t* canb_get_data_section(const canb_container_t* container, size_t* out_len) {
  const canb_section_t* sect = canb_find_section(container, CANB_SECT_DATA);
  if (!sect) return NULL;
  
  if (out_len) *out_len = sect->data_size;
  return sect->data;
}

// Get META section
const uint8_t* canb_get_meta_section(const canb_container_t* container, size_t* out_len) {
  const canb_section_t* sect = canb_find_section(container, CANB_SECT_META);
  if (!sect) return NULL;
  
  if (out_len) *out_len = sect->data_size;
  return sect->data;
}

// Get PROOF section
const uint8_t* canb_get_proof_section(const canb_container_t* container, size_t* out_len) {
  const canb_section_t* sect = canb_find_section(container, CANB_SECT_PROOF);
  if (!sect) return NULL;
  
  if (out_len) *out_len = sect->data_size;
  return sect->data;
}




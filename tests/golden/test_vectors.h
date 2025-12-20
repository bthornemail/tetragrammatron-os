// test_vectors.h
// CAN-ISA Golden Test Vectors (RFC-0012)
// Role: Agent 2 — CAN-ISA / BINARY ENCODING ENGINEER (CAN-BIT-TRUTH)
// Implements: RFC-0012 - Canonical test vectors for regression testing

#pragma once

#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

// Test vector structure
typedef struct {
  const char* name;           // Test name
  const char* description;    // Test description
  uint8_t opcode;
  uint8_t A;
  uint8_t B;
  uint16_t imm16;
  const uint8_t expected_bytes[4];  // Expected big-endian encoding
} can_test_vector_t;

// Golden test vectors - canonical bytecode for all opcodes
extern const can_test_vector_t golden_vectors[];
extern const size_t golden_vectors_count;

// Get test vector by opcode
const can_test_vector_t* get_test_vector_by_opcode(uint8_t opcode);

#ifdef __cplusplus
}
#endif


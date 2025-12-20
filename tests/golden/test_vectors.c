// test_vectors.c
// CAN-ISA Golden Test Vectors Implementation (RFC-0012)
// Role: Agent 2 — CAN-ISA / BINARY ENCODING ENGINEER (CAN-BIT-TRUTH)
// Implements: RFC-0012 - Canonical test vectors

#include "test_vectors.h"
#include <stddef.h>

// Golden test vectors - one per opcode (RFC-0009 Appendix A, RFC-0013)
const can_test_vector_t golden_vectors[] = {
  // Control Flow
  {
    "NOOP",
    "No operation",
    0x00, 0, 0, 0x0000,
    {0x00, 0x00, 0x00, 0x00}
  },
  {
    "HALT",
    "Halt execution",
    0x01, 0, 0, 0x0000,
    {0x01, 0x00, 0x00, 0x00}
  },
  
  // Canonicalization
  {
    "CANON",
    "Canonicalize register",
    0x10, 0, 1, 0x0000,  // CANON states alphabet
    {0x10, 0x01, 0x00, 0x00}  // A=0, B=1, imm16=0x0000 (byte 1: (A<<4)|B = 0x01)
  },
  {
    "COMMIT",
    "Commit with profile and flags",
    0x60, 0, 0, 0x0001,  // profile=0, flags=1
    {0x60, 0x00, 0x00, 0x01}  // imm16=0x0001 (correct: bytes 2-3 are imm16)
  },
  
  // Immediate Construction
  {
    "LDI16H",
    "Load immediate high 16 bits",
    0x40, 0, 0, 0x1234,
    {0x40, 0x00, 0x12, 0x34}  // imm16=0x1234 (bytes 2-3)
  },
  {
    "LDI16L",
    "Load immediate low 16 bits",
    0x41, 0, 0, 0x5678,
    {0x41, 0x00, 0x56, 0x78}  // imm16=0x5678 (bytes 2-3)
  },
  {
    "USEI32",
    "Use I32 latch (poly_id)",
    0x42, 0, 0, 0x0000,  // USEI32 states poly_id
    {0x42, 0x00, 0x00, 0x00}  // imm16=0x0000
  },
  
  // Lattice Operations
  {
    "MEET_GCD",
    "Meet operation (GCD)",
    0x20, 0, 1, 0x0000,  // MEET_GCD states alphabet
    {0x20, 0x01, 0x00, 0x00}  // A=0, B=1, imm16=0x0000 (byte 1: (A<<4)|B = 0x01)
  },
  {
    "JOIN_LCM",
    "Join operation (LCM)",
    0x21, 0, 1, 0x0000,  // JOIN_LCM states alphabet
    {0x21, 0x01, 0x00, 0x00}  // A=0, B=1, imm16=0x0000
  },
  {
    "SWAP",
    "Swap registers",
    0x50, 0, 1, 0x0000,  // SWAP states alphabet
    {0x50, 0x01, 0x00, 0x00}  // A=0, B=1, imm16=0x0000
  },
  {
    "CLEAR",
    "Clear register fields",
    0x51, 0, 0, 0x000F,  // CLEAR states (all fields)
    {0x51, 0x00, 0x00, 0x0F}  // imm16=0x000F (mask in low byte)
  },
  
  // Fano Projection
  {
    "PROJ_FANO",
    "Fano plane projection",
    0x30, 0, 0, 0x0003,  // PROJ_FANO (omit_rule=0, flags=3)
    {0x30, 0x00, 0x00, 0x03}  // imm16=0x0003
  },
  {
    "EMIT_NODE",
    "Emit geometry node",
    0x70, 0, 1, 0x0123,  // EMIT_NODE (style=0, layer=1, flags=0x23)
    {0x70, 0x01, 0x01, 0x23}  // A=0, B=1, imm16=0x0123
  },
  {
    "EMIT_EDGE",
    "Emit geometry edge",
    0x71, 0, 0, 0x0102,  // EMIT_EDGE (from=1, to=2)
    {0x71, 0x00, 0x01, 0x02}  // imm16=0x0102 (from=1, to=2)
  },
  {
    "LIFT_3D",
    "Lift 2D to 3D",
    0x72, 0, 0, 0x0123,  // LIFT_3D (space=0, scale=1, flags=0x23)
    {0x72, 0x00, 0x01, 0x23}  // imm16=0x0123
  },
  
  // Assertions
  {
    "ASSERT_CANON",
    "Assert canonical form",
    0x80, 0, 0, 0x0000,
    {0x80, 0x00, 0x00, 0x00}  // imm16=0x0000
  },
  {
    "ASSERT_IDEMP",
    "Assert idempotence",
    0x81, 0, 0, 0x0000,  // ASSERT_IDEMP states (opcode_sel=0)
    {0x81, 0x00, 0x00, 0x00}  // imm16=0x0000
  },
  {
    "ASSERT_FANO",
    "Assert Fano triad",
    0x82, 0, 1, 0x0002,  // ASSERT_FANO states alphabet (reg3=left_marker)
    {0x82, 0x01, 0x00, 0x02}  // A=0, B=1, imm16=0x0002 (reg3=2)
  },
  
  // Time and Barriers (RFC-0013)
  {
    "TIME_RD",
    "Read monotonic tick counter",
    0x64, 0, 0, 0x0000,  // TIME_RD states
    {0x64, 0x00, 0x00, 0x00}  // imm16=0x0000
  },
  {
    "TIME_DIV",
    "Quantize time",
    0x65, 0, 1, 0x0064,  // TIME_DIV states alphabet (divisor=100)
    {0x65, 0x01, 0x00, 0x64}  // A=0, B=1, imm16=0x0064 (divisor=100)
  },
  {
    "WAIT",
    "Wait until time deadline",
    0x66, 0, 0, 0x03E8,  // WAIT (offset=1000 microseconds)
    {0x66, 0x00, 0x03, 0xE8}  // imm16=0x03E8 (offset=1000)
  },
  {
    "BARRIER_T",
    "Time barrier",
    0x67, 0, 0, 0x1388,  // BARRIER_T (max_duration=5000 microseconds)
    {0x67, 0x00, 0x13, 0x88}  // imm16=0x1388 (max_duration=5000)
  },
};

const size_t golden_vectors_count = sizeof(golden_vectors) / sizeof(golden_vectors[0]);

// Get test vector by opcode
const can_test_vector_t* get_test_vector_by_opcode(uint8_t opcode) {
  for (size_t i = 0; i < golden_vectors_count; i++) {
    if (golden_vectors[i].opcode == opcode) {
      return &golden_vectors[i];
    }
  }
  return NULL;
}


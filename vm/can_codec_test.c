// can_codec_test.c
// CAN-ISA Binary Encoding Test Vectors (RFC-0012)
// Role: Agent 2 — CAN-ISA / BINARY ENCODING ENGINEER (CAN-BIT-TRUTH)
// Implements: RFC-0012 - Round-trip encoding verification

#include "can_codec.h"
#include "can_disasm.h"
#include <stdio.h>
#include <string.h>
#include <stdbool.h>
#include <stdint.h>

// Test round-trip encoding for a single instruction
static bool test_round_trip(uint8_t opcode, uint8_t A, uint8_t B, uint16_t imm16) {
  can_inst_t inst;
  inst.opcode = opcode;
  inst.A = A;
  inst.B = B;
  inst.imm16 = imm16;
  
  // Encode
  uint8_t bytes[4];
  encode_inst_bytes(&inst, bytes);
  
  // Decode
  can_inst_t decoded;
  if (!decode_inst_bytes(bytes, &decoded)) {
    printf("ERROR: Failed to decode instruction\n");
    return false;
  }
  
  // Verify round-trip
  if (decoded.opcode != inst.opcode ||
      decoded.A != inst.A ||
      decoded.B != inst.B ||
      decoded.imm16 != inst.imm16) {
    printf("ERROR: Round-trip mismatch\n");
    printf("  Original: opcode=0x%02x A=%d B=%d imm16=0x%04x\n",
           inst.opcode, inst.A, inst.B, inst.imm16);
    printf("  Decoded:  opcode=0x%02x A=%d B=%d imm16=0x%04x\n",
           decoded.opcode, decoded.A, decoded.B, decoded.imm16);
    return false;
  }
  
  return true;
}

// Test imm16 validation
static bool test_imm16_validation(void) {
  printf("Testing imm16 validation...\n");
  
  // Test MUST be zero opcodes
  struct {
    uint8_t opcode;
    uint16_t imm16;
    bool should_pass;
  } tests[] = {
    {0x00, 0x0000, true},   // NOOP: must be zero
    {0x00, 0x0001, false},  // NOOP: non-zero should fail
    {0x10, 0x0000, true},   // CANON: must be zero
    {0x10, 0x0001, false},  // CANON: non-zero should fail
    {0x60, 0x0003, true},   // COMMIT: flags bits 0..1 valid
    {0x60, 0x0004, false},  // COMMIT: flag bit 2 invalid
    {0x51, 0x000F, true},   // CLEAR: low 4 bits valid
    {0x51, 0x0010, false},  // CLEAR: bit 4 invalid
    {0x65, 0x0001, true},   // TIME_DIV: must be > 0
    {0x65, 0x0000, false},  // TIME_DIV: zero should fail
  };
  
  int passed = 0;
  int failed = 0;
  
  for (size_t i = 0; i < sizeof(tests) / sizeof(tests[0]); i++) {
    bool result = validate_imm16(tests[i].opcode, tests[i].imm16);
    if (result == tests[i].should_pass) {
      passed++;
    } else {
      failed++;
      printf("  FAIL: opcode=0x%02x imm16=0x%04x expected=%s got=%s\n",
             tests[i].opcode, tests[i].imm16,
             tests[i].should_pass ? "pass" : "fail",
             result ? "pass" : "fail");
    }
  }
  
  printf("  Passed: %d, Failed: %d\n", passed, failed);
  return failed == 0;
}

int main(void) {
  printf("CAN-ISA Binary Encoding Test Suite\n");
  printf("===================================\n\n");
  
  // Test round-trip encoding
  printf("Testing round-trip encoding...\n");
  int round_trip_passed = 0;
  int round_trip_failed = 0;
  
  // Test various opcodes
  struct {
    uint8_t opcode;
    uint8_t A;
    uint8_t B;
    uint16_t imm16;
  } round_trip_tests[] = {
    {0x00, 0, 0, 0x0000},      // NOOP
    {0x01, 0, 0, 0x0000},     // HALT
    {0x10, 0, 1, 0x0000},     // CANON
    {0x20, 0, 1, 0x0000},     // MEET_GCD
    {0x40, 0, 0, 0x1234},     // LDI16H
    {0x41, 0, 0, 0x5678},     // LDI16L
    {0x60, 0, 0, 0x0001},     // COMMIT (profile=0, flags=1)
    {0x30, 0, 0, 0x0003},     // PROJ_FANO
    {0x70, 0, 1, 0x0123},     // EMIT_NODE
    {0x71, 0, 0, 0x0102},     // EMIT_EDGE (from=1, to=2)
    {0x64, 0, 0, 0x0000},     // TIME_RD
    {0x65, 0, 1, 0x0064},     // TIME_DIV (divisor=100)
  };
  
  for (size_t i = 0; i < sizeof(round_trip_tests) / sizeof(round_trip_tests[0]); i++) {
    if (test_round_trip(round_trip_tests[i].opcode,
                        round_trip_tests[i].A,
                        round_trip_tests[i].B,
                        round_trip_tests[i].imm16)) {
      round_trip_passed++;
    } else {
      round_trip_failed++;
    }
  }
  
  printf("  Passed: %d, Failed: %d\n\n", round_trip_passed, round_trip_failed);
  
  // Test imm16 validation
  bool validation_ok = test_imm16_validation();
  printf("\n");
  
  // Test disassembler
  printf("Testing disassembler...\n");
  can_inst_t test_inst = {0x20, 0, 1, 0x0000};  // MEET_GCD states alphabet
  char disasm_buf[256];
  int len = can_disasm_inst(&test_inst, disasm_buf, sizeof(disasm_buf));
  if (len > 0) {
    printf("  Disassembly: %s\n", disasm_buf);
  } else {
    printf("  ERROR: Disassembly failed\n");
  }
  printf("\n");
  
  // Summary
  printf("Summary\n");
  printf("=======\n");
  printf("Round-trip encoding: %d passed, %d failed\n", round_trip_passed, round_trip_failed);
  printf("imm16 validation: %s\n", validation_ok ? "PASS" : "FAIL");
  printf("Disassembler: %s\n", len > 0 ? "PASS" : "FAIL");
  
  return (round_trip_failed == 0 && validation_ok && len > 0) ? 0 : 1;
}


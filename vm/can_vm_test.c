// can_vm_test.c
// Test program for Origami Fold VM
// Role B: COMPILER / VM IMPLEMENTER

#include "can_vm.h"
#include "can_codec.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Simple test program: CANON + HALT
// Format: opcode(8) | A(4) | B(4) | imm16(16) = 32 bits = 4 bytes
static const uint8_t test_prog_simple[] = {
  // CANON states states #x0000
  // opcode=0x02, A=0, B=0, imm16=0x0000
  0x02, 0x00, 0x00, 0x00,
  // HALT r0 r0 #x0000
  // opcode=0x01, A=0, B=0, imm16=0x0000
  0x01, 0x00, 0x00, 0x00
};

// Test program: LDI16H + LDI16L + USEI32 + HALT
static const uint8_t test_prog_imm[] = {
  // LDI16H r0 r0 #x1234
  // opcode=0x10, A=0, B=0, imm16=0x1234
  0x10, 0x00, 0x00, 0x12, 0x34,
  // LDI16L r0 r0 #x5678
  // opcode=0x11, A=0, B=0, imm16=0x5678
  0x11, 0x00, 0x00, 0x56, 0x78,
  // USEI32 states r0 #x0000 (poly_id, B=0)
  // opcode=0x12, A=0 (states), B=0 (poly_id), imm16=0x0000
  0x12, 0x00, 0x00, 0x00, 0x00,
  // HALT r0 r0 #x0000
  // opcode=0x01, A=0, B=0, imm16=0x0000
  0x01, 0x00, 0x00, 0x00
};

static void test_simple(void) {
  printf("Test 1: Simple CANON + HALT\n");
  can_vm_t vm;
  can_vm_init(&vm);
  
  int steps = can_vm_run(&vm, test_prog_simple, sizeof(test_prog_simple));
  if (steps < 0) {
    printf("  ERROR: %s\n", can_vm_error_string(vm.last_error));
    return;
  }
  
  printf("  Executed %d instructions\n", steps);
  printf("  VM halted: %s\n", vm.halted ? "yes" : "no");
  printf("  PC: %u\n", vm.pc);
  printf("  PASS\n\n");
}

static void test_immediate(void) {
  printf("Test 2: Immediate construction (LDI16H + LDI16L + USEI32)\n");
  can_vm_t vm;
  can_vm_init(&vm);
  
  int steps = can_vm_run(&vm, test_prog_imm, sizeof(test_prog_imm));
  if (steps < 0) {
    printf("  ERROR: %s\n", can_vm_error_string(vm.last_error));
    return;
  }
  
  printf("  Executed %d instructions\n", steps);
  printf("  I32 latch: 0x%08X\n", vm.I32);
  printf("  states.poly_id: %u\n", vm.regs[REG_STATES].poly_id);
  printf("  Expected I32: 0x12345678\n");
  printf("  Expected poly_id: 0x12345678\n");
  
  if (vm.I32 == 0x12345678 && vm.regs[REG_STATES].poly_id == 0x12345678) {
    printf("  PASS\n\n");
  } else {
    printf("  FAIL: Values don't match\n\n");
  }
}

static void test_instruction_decode(void) {
  printf("Test 3: Instruction encoding/decoding\n");
  
  can_inst_t inst;
  inst.opcode = OP_CANON;
  inst.A = REG_STATES;
  inst.B = REG_ALPHABET;
  inst.imm16 = 0;
  
  uint8_t bytes[4];
  encode_inst_bytes(&inst, bytes);
  
  can_inst_t decoded;
  decode_inst_bytes(bytes, &decoded);
  
  if (decoded.opcode == OP_CANON &&
      decoded.A == REG_STATES &&
      decoded.B == REG_ALPHABET &&
      decoded.imm16 == 0) {
    printf("  PASS: Encode/decode roundtrip successful\n\n");
  } else {
    printf("  FAIL: Encode/decode mismatch\n");
    printf("    Expected: op=%02X A=%d B=%d imm=%04X\n",
           OP_CANON, REG_STATES, REG_ALPHABET, 0);
    printf("    Got:      op=%02X A=%d B=%d imm=%04X\n",
           decoded.opcode, decoded.A, decoded.B, decoded.imm16);
  }
}

static void test_register_names(void) {
  printf("Test 4: Semantic register names\n");
  can_vm_t vm;
  can_vm_init(&vm);
  
  // Verify all 8 registers exist
  printf("  Register count: %zu\n", sizeof(vm.regs) / sizeof(vm.regs[0]));
  
  // Test register IDs
  printf("  REG_STATES: %d\n", REG_STATES);
  printf("  REG_ALPHABET: %d\n", REG_ALPHABET);
  printf("  REG_LEFT_MARKER: %d\n", REG_LEFT_MARKER);
  printf("  REG_RIGHT_MARKER: %d\n", REG_RIGHT_MARKER);
  printf("  REG_TRANSITION: %d\n", REG_TRANSITION);
  printf("  REG_START: %d\n", REG_START);
  printf("  REG_ACCEPT: %d\n", REG_ACCEPT);
  printf("  REG_REJECT: %d\n", REG_REJECT);
  
  if (sizeof(vm.regs) / sizeof(vm.regs[0]) == 8) {
    printf("  PASS: 8 semantic registers present\n\n");
  } else {
    printf("  FAIL: Expected 8 registers\n\n");
  }
}

int main(void) {
  printf("=== Origami Fold VM Test Suite ===\n\n");
  
  test_instruction_decode();
  test_register_names();
  test_simple();
  test_immediate();
  
  printf("=== Tests Complete ===\n");
  return 0;
}


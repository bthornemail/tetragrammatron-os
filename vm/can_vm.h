// can_vm.h
// Origami Fold VM Core (RFC-0009, RFC-0012, RFC-0013)
// Role: Agent 3 — SCHEME ASSEMBLER & VM IMPLEMENTER (VM-EXEC-FOLD)
// Implements: RFC-0009, RFC-0012, RFC-0013

#pragma once

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>
#include "can_codec.h"

#ifdef __cplusplus
extern "C" {
#endif

// Semantic register IDs (RFC-009 §X.6.2)
#define REG_STATES 0
#define REG_ALPHABET 1
#define REG_LEFT_MARKER 2
#define REG_RIGHT_MARKER 3
#define REG_TRANSITION 4
#define REG_START 5
#define REG_ACCEPT 6
#define REG_REJECT 7

// Opcodes (RFC-0009 Appendix A, RFC-0013)
#define OP_NOOP 0x00
#define OP_HALT 0x01
#define OP_CANON 0x10
#define OP_MEET_GCD 0x20
#define OP_JOIN_LCM 0x21
#define OP_PROJ_FANO 0x30
#define OP_LDI16H 0x40
#define OP_LDI16L 0x41
#define OP_USEI32 0x42
#define OP_SWAP 0x50
#define OP_CLEAR 0x51
#define OP_COMMIT 0x60
#define OP_TIME_RD 0x64      // RFC-0013
#define OP_TIME_DIV 0x65     // RFC-0013
#define OP_WAIT 0x66         // RFC-0013
#define OP_BARRIER_T 0x67    // RFC-0013
#define OP_EMIT_NODE 0x70
#define OP_EMIT_EDGE 0x71
#define OP_LIFT_3D 0x72
#define OP_ASSERT_CANON 0x80
#define OP_ASSERT_IDEMP 0x81
#define OP_ASSERT_FANO 0x82

// VM error codes
typedef enum {
  VM_ERR_OK = 0,
  VM_ERR_DECODE = 1,
  VM_ERR_BAD_OPCODE = 2,
  VM_ERR_ASSERT_FAIL = 3,
  VM_ERR_INVALID_STATE = 4,
  VM_ERR_HALT = 5
} vm_error_t;

// Semantic register structure
// Each register holds a poly_id reference (RFC-009 §X.7)
typedef struct {
  uint32_t poly_id;  // Reference to POLYTAB
  uint32_t str_id;   // Reference to STRTAB (optional)
  uint32_t node_id;  // For geometry emission
  uint32_t mat_id;   // For material assignment
} can_reg_t;

// Forward declaration
typedef struct can_objpool_t can_objpool_t;

// VM state
typedef struct {
  can_reg_t regs[8];      // 8 semantic registers
  uint32_t I32;           // 32-bit immediate latch (RFC-009 §X.6.3)
  uint32_t pc;            // Program counter (instruction offset)
  vm_error_t last_error;
  bool halted;
  can_objpool_t* objpool; // Object pool for polynomial storage (POLYTAB)
} can_vm_t;

// Initialize VM
void can_vm_init(can_vm_t* vm);

// Execute single instruction
// Returns true on success, false on error (check vm->last_error)
bool can_vm_step(can_vm_t* vm, const uint8_t* prog_bytes, size_t prog_len);

// Execute program until halt or error
// Returns number of instructions executed, or -1 on error
int can_vm_run(can_vm_t* vm, const uint8_t* prog_bytes, size_t prog_len);

// Get error message
const char* can_vm_error_string(vm_error_t err);

// Set object pool for polynomial storage
void can_vm_set_objpool(can_vm_t* vm, can_objpool_t* pool);

#ifdef __cplusplus
}
#endif

#pragma once

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

// CanISA opcodes (matches tools/canbc/canisa.js)
#define CAN_OP_NOP           0x00
#define CAN_OP_HALT          0x01

#define CAN_OP_MOV           0x10
#define CAN_OP_LOAD8         0x11
#define CAN_OP_LOAD16        0x12
#define CAN_OP_LOAD32        0x13

#define CAN_OP_ADD           0x20
#define CAN_OP_SUB           0x21
#define CAN_OP_AND           0x22
#define CAN_OP_OR            0x23
#define CAN_OP_XOR           0x24

#define CAN_OP_MOD8          0x30
#define CAN_OP_ADMISS_EXCEPT6 0x31
#define CAN_OP_MAP_PARITY    0x32
#define CAN_OP_MAP_PRIME8    0x33

#define CAN_OP_CMP8          0x40
#define CAN_OP_JZ            0x41
#define CAN_OP_JNZ           0x42
#define CAN_OP_JMP           0x43

#define CAN_OP_EMIT8         0x50
#define CAN_OP_EMITREGS      0x51

#define CAN_OP_LOADADDR8     0x60
#define CAN_OP_HASHREGS      0x61

// VM state
#define CAN_VM_REGS          16
#define CAN_VM_MAX_CODE      4096
#define CAN_VM_MAX_CONST     1024

typedef struct {
  uint32_t regs[CAN_VM_REGS];  // r0..r15
  bool zf;                     // zero flag (for CMP8)
  size_t pc;                   // program counter
  size_t steps;                // execution step counter
  uint32_t ticks;              // execution tick counter
} can_vm_state_t;

// Execution result
typedef enum {
  CAN_VM_OK = 0,
  CAN_VM_HALT = 1,
  CAN_VM_TRAP = 2,
  CAN_VM_ERROR_PC_OVERFLOW = 3,
  CAN_VM_ERROR_UNKNOWN_OPCODE = 4,
  CAN_VM_ERROR_ADMISS_VIOLATION = 5,
} can_vm_result_t;

// String constant pool (for EMIT8/EMITREGS)
typedef struct {
  const char** strings;
  size_t count;
} can_vm_const_pool_t;

// Callback for EMIT8/EMITREGS (emits JSONL telemetry)
// Returns true to continue, false to trap
typedef bool (*can_vm_emit_cb_t)(const char* key, const uint8_t* values, size_t count, void* user_data);

// Execution context
typedef struct {
  const uint8_t* code;         // code bytes
  size_t code_len;              // code length
  const uint8_t* const_bytes;  // constant pool bytes (optional)
  size_t const_len;            // constant pool length
  const uint8_t* addr8;        // 8-byte address (for LOADADDR8)
  can_vm_state_t state;         // VM state
  can_vm_const_pool_t const_pool; // parsed constant pool
  can_vm_emit_cb_t emit_cb;    // callback for EMIT8/EMITREGS (optional)
  void* emit_user_data;         // user data for emit callback
} can_vm_ctx_t;

// Parse constant pool from const_bytes
// Returns true on success, false on parse error
bool can_vm_parse_const_pool(const uint8_t* const_bytes, size_t const_len, can_vm_const_pool_t* pool);

// Free constant pool (if strings were allocated)
void can_vm_free_const_pool(can_vm_const_pool_t* pool);

// Execute CANBC bytecode
// ctx->state is initialized and updated during execution
// Returns execution result
can_vm_result_t can_vm_execute(can_vm_ctx_t* ctx);

// Helper: check if value is prime (for MAP_PRIME8)
bool can_vm_is_prime8(uint8_t value);

#ifdef __cplusplus
}
#endif


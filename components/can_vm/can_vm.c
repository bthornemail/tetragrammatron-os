#include "can_vm.h"
#include <string.h>
#include <stdlib.h>
#include "mbedtls/sha256.h"

// Helper: read uint8 from code
static bool read_u8(can_vm_ctx_t* ctx, uint8_t* out) {
  if (ctx->state.pc >= ctx->code_len) return false;
  *out = ctx->code[ctx->state.pc++];
  return true;
}

// Helper: read uint16 (little-endian) from code
static bool read_u16(can_vm_ctx_t* ctx, uint16_t* out) {
  if (ctx->state.pc + 2 > ctx->code_len) return false;
  *out = (uint16_t)ctx->code[ctx->state.pc] |
         ((uint16_t)ctx->code[ctx->state.pc + 1] << 8);
  ctx->state.pc += 2;
  return true;
}

// Helper: read uint32 (little-endian) from code
static bool read_u32(can_vm_ctx_t* ctx, uint32_t* out) {
  if (ctx->state.pc + 4 > ctx->code_len) return false;
  *out = (uint32_t)ctx->code[ctx->state.pc] |
         ((uint32_t)ctx->code[ctx->state.pc + 1] << 8) |
         ((uint32_t)ctx->code[ctx->state.pc + 2] << 16) |
         ((uint32_t)ctx->code[ctx->state.pc + 3] << 24);
  ctx->state.pc += 4;
  return true;
}

// Helper: read int8 (signed) from code
static bool read_i8(can_vm_ctx_t* ctx, int8_t* out) {
  if (ctx->state.pc >= ctx->code_len) return false;
  *out = (int8_t)ctx->code[ctx->state.pc++];
  return true;
}

// Helper: pack two 4-bit register indices into one byte
static uint8_t pack_regs(uint8_t a, uint8_t b) {
  return ((b & 0x0f) << 4) | (a & 0x0f);
}

// Helper: unpack two 4-bit register indices from one byte
static void unpack_regs(uint8_t packed, uint8_t* a, uint8_t* b) {
  *a = packed & 0x0f;
  *b = (packed >> 4) & 0x0f;
}

bool can_vm_is_prime8(uint8_t value) {
  if (value < 2) return false;
  if (value == 2) return true;
  if ((value & 1) == 0) return false;  // even > 2
  for (uint8_t i = 3; i * i <= value; i += 2) {
    if (value % i == 0) return false;
  }
  return true;
}

bool can_vm_parse_const_pool(const uint8_t* const_bytes, size_t const_len, can_vm_const_pool_t* pool) {
  if (!const_bytes || !pool || const_len < 2) {
    pool->strings = NULL;
    pool->count = 0;
    return true;  // empty pool is valid
  }

  size_t idx = 0;
  uint16_t count = (uint16_t)const_bytes[idx] | ((uint16_t)const_bytes[idx + 1] << 8);
  idx += 2;

  if (count == 0) {
    pool->strings = NULL;
    pool->count = 0;
    return true;
  }

  // Allocate string pointers
  const char** strings = (const char**)malloc(count * sizeof(const char*));
  if (!strings) return false;

  // Parse strings
  for (uint16_t i = 0; i < count; i++) {
    if (idx + 2 > const_len) {
      // Free what we allocated so far
      for (uint16_t j = 0; j < i; j++) {
        free((void*)strings[j]);
      }
      free(strings);
      return false;
    }

    uint16_t len = (uint16_t)const_bytes[idx] | ((uint16_t)const_bytes[idx + 1] << 8);
    idx += 2;

    if (idx + len > const_len) {
      // Free what we allocated so far
      for (uint16_t j = 0; j < i; j++) {
        free((void*)strings[j]);
      }
      free(strings);
      return false;
    }

    // Allocate and copy string
    char* str = (char*)malloc(len + 1);
    if (!str) {
      for (uint16_t j = 0; j < i; j++) {
        free((void*)strings[j]);
      }
      free(strings);
      return false;
    }
    memcpy(str, const_bytes + idx, len);
    str[len] = '\0';
    strings[i] = str;
    idx += len;
  }

  pool->strings = strings;
  pool->count = count;
  return true;
}

void can_vm_free_const_pool(can_vm_const_pool_t* pool) {
  if (!pool || !pool->strings) return;
  for (size_t i = 0; i < pool->count; i++) {
    free((void*)pool->strings[i]);
  }
  free((void*)pool->strings);
  pool->strings = NULL;
  pool->count = 0;
}

can_vm_result_t can_vm_execute(can_vm_ctx_t* ctx) {
  if (!ctx || !ctx->code || ctx->code_len == 0) {
    return CAN_VM_ERROR_PC_OVERFLOW;
  }

  // Initialize state
  memset(&ctx->state, 0, sizeof(ctx->state));
  ctx->state.pc = 0;
  ctx->state.steps = 0;
  ctx->state.ticks = 0;
  ctx->state.zf = false;

  // Parse constant pool if provided
  if (ctx->const_bytes && ctx->const_len > 0) {
    if (!can_vm_parse_const_pool(ctx->const_bytes, ctx->const_len, &ctx->const_pool)) {
      return CAN_VM_ERROR_PC_OVERFLOW;
    }
  } else {
    ctx->const_pool.strings = NULL;
    ctx->const_pool.count = 0;
  }

  // Main execution loop
  while (ctx->state.pc < ctx->code_len) {
    uint8_t op;
    if (!read_u8(ctx, &op)) {
      return CAN_VM_ERROR_PC_OVERFLOW;
    }

    ctx->state.steps++;
    ctx->state.ticks++;

    switch (op) {
      case CAN_OP_NOP:
        // No operation
        break;

      case CAN_OP_HALT:
        return CAN_VM_HALT;

      case CAN_OP_MOV: {
        uint8_t packed;
        if (!read_u8(ctx, &packed)) return CAN_VM_ERROR_PC_OVERFLOW;
        uint8_t dst, src;
        unpack_regs(packed, &dst, &src);
        if (dst >= CAN_VM_REGS || src >= CAN_VM_REGS) return CAN_VM_ERROR_PC_OVERFLOW;
        ctx->state.regs[dst] = ctx->state.regs[src];
        break;
      }

      case CAN_OP_LOAD8: {
        uint8_t dst, imm;
        if (!read_u8(ctx, &dst)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (!read_u8(ctx, &imm)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (dst >= CAN_VM_REGS) return CAN_VM_ERROR_PC_OVERFLOW;
        ctx->state.regs[dst] = imm;
        break;
      }

      case CAN_OP_LOAD16: {
        uint8_t dst;
        uint16_t imm;
        if (!read_u8(ctx, &dst)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (!read_u16(ctx, &imm)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (dst >= CAN_VM_REGS) return CAN_VM_ERROR_PC_OVERFLOW;
        ctx->state.regs[dst] = imm;
        break;
      }

      case CAN_OP_LOAD32: {
        uint8_t dst;
        uint32_t imm;
        if (!read_u8(ctx, &dst)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (!read_u32(ctx, &imm)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (dst >= CAN_VM_REGS) return CAN_VM_ERROR_PC_OVERFLOW;
        ctx->state.regs[dst] = imm;
        break;
      }

      case CAN_OP_ADD:
      case CAN_OP_SUB:
      case CAN_OP_AND:
      case CAN_OP_OR:
      case CAN_OP_XOR: {
        uint8_t dst, packed;
        if (!read_u8(ctx, &dst)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (!read_u8(ctx, &packed)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (dst >= CAN_VM_REGS) return CAN_VM_ERROR_PC_OVERFLOW;
        uint8_t a, b;
        unpack_regs(packed, &a, &b);
        if (a >= CAN_VM_REGS || b >= CAN_VM_REGS) return CAN_VM_ERROR_PC_OVERFLOW;

        uint32_t val_a = ctx->state.regs[a];
        uint32_t val_b = ctx->state.regs[b];
        uint32_t result = 0;

        switch (op) {
          case CAN_OP_ADD:
            result = (val_a + val_b) & 0xFFFFFFFF;
            break;
          case CAN_OP_SUB:
            result = (val_a - val_b) & 0xFFFFFFFF;
            break;
          case CAN_OP_AND:
            result = val_a & val_b;
            break;
          case CAN_OP_OR:
            result = val_a | val_b;
            break;
          case CAN_OP_XOR:
            result = val_a ^ val_b;
            break;
        }
        ctx->state.regs[dst] = result;
        break;
      }

      case CAN_OP_MOD8: {
        uint8_t dst;
        if (!read_u8(ctx, &dst)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (dst >= CAN_VM_REGS) return CAN_VM_ERROR_PC_OVERFLOW;
        ctx->state.regs[dst] &= 0x07;
        break;
      }

      case CAN_OP_ADMISS_EXCEPT6: {
        uint8_t dst;
        if (!read_u8(ctx, &dst)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (dst >= CAN_VM_REGS) return CAN_VM_ERROR_PC_OVERFLOW;
        if ((ctx->state.regs[dst] & 0xff) == 6) {
          return CAN_VM_ERROR_ADMISS_VIOLATION;
        }
        break;
      }

      case CAN_OP_MAP_PARITY: {
        uint8_t dst;
        if (!read_u8(ctx, &dst)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (dst >= CAN_VM_REGS) return CAN_VM_ERROR_PC_OVERFLOW;
        ctx->state.regs[dst] &= 1;
        break;
      }

      case CAN_OP_MAP_PRIME8: {
        uint8_t dst;
        if (!read_u8(ctx, &dst)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (dst >= CAN_VM_REGS) return CAN_VM_ERROR_PC_OVERFLOW;
        uint8_t val = ctx->state.regs[dst] & 0xff;
        ctx->state.regs[dst] = can_vm_is_prime8(val) ? 1 : 0;
        break;
      }

      case CAN_OP_CMP8: {
        uint8_t reg, imm;
        if (!read_u8(ctx, &reg)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (!read_u8(ctx, &imm)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (reg >= CAN_VM_REGS) return CAN_VM_ERROR_PC_OVERFLOW;
        ctx->state.zf = ((ctx->state.regs[reg] & 0xff) == imm);
        break;
      }

      case CAN_OP_JZ: {
        int8_t rel;
        if (!read_i8(ctx, &rel)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (ctx->state.zf) {
          // Check for overflow
          if (rel > 0 && ctx->state.pc + rel > ctx->code_len) {
            return CAN_VM_ERROR_PC_OVERFLOW;
          }
          if (rel < 0 && (size_t)(-rel) > ctx->state.pc) {
            return CAN_VM_ERROR_PC_OVERFLOW;
          }
          ctx->state.pc += rel;
        }
        break;
      }

      case CAN_OP_JNZ: {
        int8_t rel;
        if (!read_i8(ctx, &rel)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (!ctx->state.zf) {
          // Check for overflow
          if (rel > 0 && ctx->state.pc + rel > ctx->code_len) {
            return CAN_VM_ERROR_PC_OVERFLOW;
          }
          if (rel < 0 && (size_t)(-rel) > ctx->state.pc) {
            return CAN_VM_ERROR_PC_OVERFLOW;
          }
          ctx->state.pc += rel;
        }
        break;
      }

      case CAN_OP_JMP: {
        int8_t rel;
        if (!read_i8(ctx, &rel)) return CAN_VM_ERROR_PC_OVERFLOW;
        // Check for overflow
        if (rel > 0 && ctx->state.pc + rel > ctx->code_len) {
          return CAN_VM_ERROR_PC_OVERFLOW;
        }
        if (rel < 0 && (size_t)(-rel) > ctx->state.pc) {
          return CAN_VM_ERROR_PC_OVERFLOW;
        }
        ctx->state.pc += rel;
        break;
      }

      case CAN_OP_LOADADDR8: {
        uint8_t start;
        if (!read_u8(ctx, &start)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (!ctx->addr8) return CAN_VM_ERROR_PC_OVERFLOW;
        for (int i = 0; i < 8; i++) {
          uint8_t reg = (start + i) & 0x0f;
          if (reg >= CAN_VM_REGS) return CAN_VM_ERROR_PC_OVERFLOW;
          ctx->state.regs[reg] = ctx->addr8[i];
        }
        break;
      }

      case CAN_OP_HASHREGS: {
        uint8_t start, count, dst;
        if (!read_u8(ctx, &start)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (!read_u8(ctx, &count)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (!read_u8(ctx, &dst)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (dst >= CAN_VM_REGS) return CAN_VM_ERROR_PC_OVERFLOW;

        // Hash registers using SHA-256
        mbedtls_sha256_context sha;
        mbedtls_sha256_init(&sha);
        mbedtls_sha256_starts(&sha, 0);

        for (uint8_t i = 0; i < count; i++) {
          uint8_t reg = (start + i) & 0x0f;
          if (reg >= CAN_VM_REGS) {
            mbedtls_sha256_free(&sha);
            return CAN_VM_ERROR_PC_OVERFLOW;
          }
          uint8_t byte = ctx->state.regs[reg] & 0xff;
          mbedtls_sha256_update(&sha, &byte, 1);
        }

        uint8_t hash[32];
        mbedtls_sha256_finish(&sha, hash);
        mbedtls_sha256_free(&sha);

        // Store first byte of hash in destination register
        ctx->state.regs[dst] = hash[0];
        break;
      }

      case CAN_OP_EMIT8: {
        uint16_t idx;
        uint8_t reg;
        if (!read_u16(ctx, &idx)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (!read_u8(ctx, &reg)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (reg >= CAN_VM_REGS) return CAN_VM_ERROR_PC_OVERFLOW;

        // Get string key from constant pool
        const char* key = (idx < ctx->const_pool.count) ? ctx->const_pool.strings[idx] : NULL;
        if (!key) key = "unknown";  // Fallback if string not found

        // Get value
        uint8_t value = ctx->state.regs[reg] & 0xff;

        // Call emit callback if provided
        if (ctx->emit_cb) {
          if (!ctx->emit_cb(key, &value, 1, ctx->emit_user_data)) {
            return CAN_VM_TRAP;
          }
        }
        break;
      }

      case CAN_OP_EMITREGS: {
        uint16_t idx;
        uint8_t start, count;
        if (!read_u16(ctx, &idx)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (!read_u8(ctx, &start)) return CAN_VM_ERROR_PC_OVERFLOW;
        if (!read_u8(ctx, &count)) return CAN_VM_ERROR_PC_OVERFLOW;

        // Get string key from constant pool
        const char* key = (idx < ctx->const_pool.count) ? ctx->const_pool.strings[idx] : NULL;
        if (!key) key = "unknown";  // Fallback if string not found

        // Collect values
        uint8_t values[CAN_VM_REGS];
        for (uint8_t i = 0; i < count && i < CAN_VM_REGS; i++) {
          uint8_t reg = (start + i) & 0x0f;
          if (reg >= CAN_VM_REGS) return CAN_VM_ERROR_PC_OVERFLOW;
          values[i] = ctx->state.regs[reg] & 0xff;
        }

        // Call emit callback if provided
        if (ctx->emit_cb) {
          if (!ctx->emit_cb(key, values, count, ctx->emit_user_data)) {
            return CAN_VM_TRAP;
          }
        }
        break;
      }

      default:
        return CAN_VM_ERROR_UNKNOWN_OPCODE;
    }
  }

  return CAN_VM_OK;
}


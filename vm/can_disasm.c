// can_disasm.c
// CAN-ISA Disassembler Implementation (RFC-0012)
// Role: Agent 2 — CAN-ISA / BINARY ENCODING ENGINEER (CAN-BIT-TRUTH)
// Implements: RFC-0012 (Binary Encoding) - Human-readable disassembly

#include "can_disasm.h"
#include "can_codec.h"
#include <stdio.h>
#include <string.h>
#include <stdint.h>

// Opcode mnemonic table (RFC-0009 Appendix A, RFC-0013)
static const char* opcode_names[256] = {
  [0x00] = "NOOP",
  [0x01] = "HALT",
  [0x10] = "CANON",
  [0x20] = "MEET_GCD",
  [0x21] = "JOIN_LCM",
  [0x30] = "PROJ_FANO",
  [0x40] = "LDI16H",
  [0x41] = "LDI16L",
  [0x42] = "USEI32",
  [0x50] = "SWAP",
  [0x51] = "CLEAR",
  [0x60] = "COMMIT",
  [0x64] = "TIME_RD",      // RFC-0013
  [0x65] = "TIME_DIV",     // RFC-0013
  [0x66] = "WAIT",         // RFC-0013
  [0x67] = "BARRIER_T",    // RFC-0013
  [0x70] = "EMIT_NODE",
  [0x71] = "EMIT_EDGE",
  [0x72] = "LIFT_3D",
  [0x80] = "ASSERT_CANON",
  [0x81] = "ASSERT_IDEMP",
  [0x82] = "ASSERT_FANO",
};

// Semantic register names (RFC-0009 §2.2)
static const char* register_names[8] = {
  [0] = "states",
  [1] = "alphabet",
  [2] = "left_marker",
  [3] = "right_marker",
  [4] = "transition",
  [5] = "start",
  [6] = "accept",
  [7] = "reject",
};

// Get opcode mnemonic string
const char* can_get_opcode_mnemonic(uint8_t opcode) {
  if (opcode_names[opcode]) {
    return opcode_names[opcode];
  }
  return NULL;
}

// Get register name (for semantic registers 0-7)
const char* can_get_register_name(uint8_t reg) {
  if (reg < 8) {
    return register_names[reg];
  }
  return NULL;
}

// Format imm16 field based on opcode (RFC-0012 Appendix B)
static int format_imm16(uint8_t opcode, uint16_t imm16, char* buf, size_t buf_size) {
  switch (opcode) {
    case 0x60: // COMMIT
      {
        uint8_t profile = (uint8_t)(imm16 >> 8);
        uint8_t flags = (uint8_t)(imm16 & 0xFF);
        return snprintf(buf, buf_size, "profile=0x%02x flags=0x%02x", profile, flags);
      }
    
    case 0x51: // CLEAR
      {
        uint8_t mask = (uint8_t)(imm16 & 0x0F);
        return snprintf(buf, buf_size, "mask=0x%x", mask);
      }
    
    case 0x30: // PROJ_FANO
      {
        uint8_t omit_rule = (uint8_t)(imm16 >> 8);
        uint8_t flags = (uint8_t)(imm16 & 0xFF);
        return snprintf(buf, buf_size, "omit_rule=0x%02x flags=0x%02x", omit_rule, flags);
      }
    
    case 0x70: // EMIT_NODE
      {
        uint8_t style = (uint8_t)((imm16 >> 12) & 0x0F);
        uint8_t layer = (uint8_t)((imm16 >> 8) & 0x0F);
        uint8_t flags = (uint8_t)(imm16 & 0xFF);
        return snprintf(buf, buf_size, "style=0x%x layer=0x%x flags=0x%02x", style, layer, flags);
      }
    
    case 0x71: // EMIT_EDGE
      {
        uint8_t from_idx = (uint8_t)(imm16 >> 8);
        uint8_t to_idx = (uint8_t)(imm16 & 0xFF);
        return snprintf(buf, buf_size, "from=%d to=%d", from_idx, to_idx);
      }
    
    case 0x72: // LIFT_3D
      {
        uint8_t space = (uint8_t)((imm16 >> 12) & 0x0F);
        uint8_t scale = (uint8_t)((imm16 >> 8) & 0x0F);
        uint8_t flags = (uint8_t)(imm16 & 0xFF);
        return snprintf(buf, buf_size, "space=0x%x scale=0x%x flags=0x%02x", space, scale, flags);
      }
    
    case 0x81: // ASSERT_IDEMP
      {
        uint8_t opcode_sel = (uint8_t)(imm16 & 0x0F);
        return snprintf(buf, buf_size, "opcode_sel=0x%x", opcode_sel);
      }
    
    case 0x82: // ASSERT_FANO
      {
        uint8_t reg3 = (uint8_t)(imm16 & 0x0F);
        const char* reg3_name = can_get_register_name(reg3);
        if (reg3_name) {
          return snprintf(buf, buf_size, "reg3=%s", reg3_name);
        }
        return snprintf(buf, buf_size, "reg3=r%d", reg3);
      }
    
    default:
      // Default: show as hex
      if (imm16 == 0) {
        return snprintf(buf, buf_size, "0x0000");
      }
      return snprintf(buf, buf_size, "0x%04x", imm16);
  }
}

// Disassemble single instruction to human-readable string
int can_disasm_inst(const can_inst_t* inst, char* buf, size_t buf_size) {
  if (!inst || !buf || buf_size == 0) return -1;
  
  const char* opname = can_get_opcode_mnemonic(inst->opcode);
  if (!opname) {
    return snprintf(buf, buf_size, "UNKNOWN_OPCODE(0x%02x) r%d r%d 0x%04x",
                    inst->opcode, inst->A, inst->B, inst->imm16);
  }
  
  // Format register A
  const char* reg_a_name = can_get_register_name(inst->A);
  char reg_a_str[16];
  if (reg_a_name) {
    snprintf(reg_a_str, sizeof(reg_a_str), "%s", reg_a_name);
  } else {
    snprintf(reg_a_str, sizeof(reg_a_str), "r%d", inst->A);
  }
  
  // Format register B
  const char* reg_b_name = can_get_register_name(inst->B);
  char reg_b_str[16];
  if (reg_b_name) {
    snprintf(reg_b_str, sizeof(reg_b_str), "%s", reg_b_name);
  } else {
    snprintf(reg_b_str, sizeof(reg_b_str), "r%d", inst->B);
  }
  
  // Format imm16
  char imm16_str[64];
  format_imm16(inst->opcode, inst->imm16, imm16_str, sizeof(imm16_str));
  
  return snprintf(buf, buf_size, "%-12s %-12s %-12s %s",
                  opname, reg_a_str, reg_b_str, imm16_str);
}

// Disassemble instruction from 32-bit word
int can_disasm_word(uint32_t word, char* buf, size_t buf_size) {
  can_inst_t inst;
  decode_inst(word, &inst);
  return can_disasm_inst(&inst, buf, buf_size);
}

// Disassemble instruction from bytes (big-endian)
int can_disasm_bytes(const uint8_t* bytes, char* buf, size_t buf_size) {
  if (!bytes || !buf || buf_size == 0) return -1;
  
  can_inst_t inst;
  if (!decode_inst_bytes(bytes, &inst)) {
    return -1;
  }
  
  return can_disasm_inst(&inst, buf, buf_size);
}


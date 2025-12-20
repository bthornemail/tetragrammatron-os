// can_codec.c
// CANB v1 Binary Encoding/Decoding (RFC-0012)
// Role: Agent 2 — CAN-ISA / BINARY ENCODING ENGINEER (CAN-BIT-TRUTH)
// Implements: RFC-0012, RFC-0012 Appendix B

#include "can_codec.h"

bool decode_inst_bytes(const uint8_t* bytes, can_inst_t* out) {
  if (!bytes || !out) return false;
  uint32_t word = read_u32be(bytes);
  decode_inst(word, out);
  return true;
}

void encode_inst_bytes(const can_inst_t* inst, uint8_t* bytes) {
  if (!inst || !bytes) return;
  uint32_t word = encode_inst(inst);
  write_u32be(bytes, word);
}

// Validate imm16 per RFC-0012 Appendix B
bool validate_imm16(uint8_t opcode, uint16_t imm16) {
  switch (opcode) {
    // MUST be zero opcodes
    case 0x00: // NOOP
    case 0x01: // HALT
    case 0x10: // CANON
    case 0x42: // USEI32
    case 0x20: // MEET_GCD
    case 0x21: // JOIN_LCM
    case 0x50: // SWAP
    case 0x80: // ASSERT_CANON
      return (imm16 == 0);
    
    // COMMIT: profile<<8 | flags (flags bits 0..1 only)
    case 0x60: // COMMIT
      {
        uint8_t profile = (uint8_t)(imm16 >> 8);
        uint8_t flags = (uint8_t)(imm16 & 0xFF);
        return ((flags & 0xFC) == 0); // bits 2..7 must be 0
      }
    
    // TIME_RD (RFC-0013): must be zero
    case 0x64: // TIME_RD
      return (imm16 == 0);
    
    // CLEAR: low 4 bits mask, upper 12 bits must be zero
    case 0x51: // CLEAR
      return ((imm16 & 0xFFF0) == 0);
    
    // PROJ_FANO: omit_rule<<8 | flags (flags bits 6..7 must be 0)
    case 0x30: // PROJ_FANO
      {
        uint8_t flags = (uint8_t)(imm16 & 0xFF);
        return ((flags & 0xC0) == 0); // bits 6..7 must be 0
      }
    
    // ASSERT_IDEMP: low 4 bits opcode selector, upper 12 bits must be zero
    case 0x81: // ASSERT_IDEMP
      return ((imm16 & 0xFFF0) == 0);
    
    // ASSERT_FANO: low 4 bits reg3 (0..7), upper 12 bits must be zero
    case 0x82: // ASSERT_FANO
      {
        uint8_t reg3 = (uint8_t)(imm16 & 0x0F);
        return ((imm16 & 0xFFF0) == 0) && (reg3 <= 7);
      }
    
    // TIME_DIV (RFC-0013): must be > 0
    case 0x65: // TIME_DIV
      return (imm16 > 0);
    
    // WAIT (RFC-0013): any value allowed (0 = cooperative yield)
    case 0x66: // WAIT
      return true; // Any 16-bit value is valid (signed interpretation)
    
    // BARRIER_T (RFC-0013): must be > 0
    case 0x67: // BARRIER_T
      return (imm16 > 0);
    
    // LDI16H, LDI16L: any value allowed
    case 0x40: // LDI16H
    case 0x41: // LDI16L
      return true; // Any 16-bit value is valid
    
    
    // EMIT_NODE, EMIT_EDGE, LIFT_3D: opcode-specific validation
    case 0x70: // EMIT_NODE
      {
        uint8_t flags = (uint8_t)(imm16 & 0xFF);
        return ((flags & 0xF8) == 0); // bits 3..7 must be 0
      }
    case 0x71: // EMIT_EDGE
      {
        uint8_t from_idx = (uint8_t)(imm16 >> 8);
        uint8_t to_idx = (uint8_t)(imm16 & 0xFF);
        return (from_idx <= 6) && (to_idx <= 6);
      }
    case 0x72: // LIFT_3D
      {
        uint8_t flags = (uint8_t)(imm16 & 0xFF);
        return ((flags & 0xF0) == 0); // bits 4..7 must be 0
      }
    
    // Unknown opcode: reject
    default:
      return false;
  }
}

// Get imm16 validation mask for opcode
uint16_t get_imm16_valid_mask(uint8_t opcode) {
  switch (opcode) {
    // MUST be zero opcodes
    case 0x00: // NOOP
    case 0x01: // HALT
    case 0x10: // CANON
    case 0x42: // USEI32
    case 0x20: // MEET_GCD
    case 0x21: // JOIN_LCM
    case 0x50: // SWAP
    case 0x80: // ASSERT_CANON
      return 0x0000; // All bits must be zero
    
    // COMMIT: bits 0..1 valid in flags byte
    case 0x60: // COMMIT
      return 0x0003; // Only bits 0..1 valid
    
    // CLEAR: low 4 bits valid
    case 0x51: // CLEAR
      return 0x000F; // Only bits 0..3 valid
    
    // PROJ_FANO: all bits valid except 6..7 in flags
    case 0x30: // PROJ_FANO
      return 0x3FFF; // All bits except 14..15 (flags bits 6..7)
    
    // ASSERT_IDEMP: low 4 bits valid
    case 0x81: // ASSERT_IDEMP
      return 0x000F; // Only bits 0..3 valid
    
    // ASSERT_FANO: low 4 bits valid, but only 0..7 values
    case 0x82: // ASSERT_FANO
      return 0x000F; // Only bits 0..3 valid
    
    // TIME_RD (RFC-0013): must be zero
    case 0x64: // TIME_RD
      return 0x0000; // All bits must be zero
    
    // TIME_DIV, BARRIER_T (RFC-0013): all bits valid (but must be > 0)
    case 0x65: // TIME_DIV
    case 0x67: // BARRIER_T
      return 0xFFFF; // All bits valid
    
    // LDI16H, LDI16L, WAIT: all bits valid
    case 0x40: // LDI16H
    case 0x41: // LDI16L
    case 0x66: // WAIT (RFC-0013)
      return 0xFFFF; // All bits valid
    
    // EMIT_NODE: all bits valid except flags bits 3..7
    case 0x70: // EMIT_NODE
      return 0x07FF; // All bits except flags bits 3..7
    
    // EMIT_EDGE: all bits valid (but indices must be 0..6)
    case 0x71: // EMIT_EDGE
      return 0xFFFF; // All bits valid (range check done separately)
    
    // LIFT_3D: all bits valid except flags bits 4..7
    case 0x72: // LIFT_3D
      return 0x0FFF; // All bits except flags bits 4..7
    
    // Unknown opcode: no valid bits
    default:
      return 0x0000;
  }
}

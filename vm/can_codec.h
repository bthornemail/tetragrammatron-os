// can_codec.h
// CANB v1 Binary Encoding/Decoding (RFC-0012)
// Role: Agent 2 — CAN-ISA / BINARY ENCODING ENGINEER (CAN-BIT-TRUTH)
// Implements: RFC-0012 §3 (Instruction Encoding), RFC-0012 Appendix B (imm16 Layouts)

#pragma once

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

// CANB v1 constants (RFC-009 §X.3.1)
#define CANB_MAGIC0 0x43u  // 'C'
#define CANB_MAGIC1 0x41u  // 'A'
#define CANB_MAGIC2 0x4Eu  // 'N'
#define CANB_MAGIC3 0x42u  // 'B'
#define CANB_VER_V1 0x01u
#define CANB_HEADER_LEN 0x0010u

// Section types (RFC-009 §X.3.3)
#define CANB_SECT_STRTAB 0x0001u
#define CANB_SECT_POLYTAB 0x0002u
#define CANB_SECT_PROG 0x0003u
#define CANB_SECT_AVD 0x0004u

// Instruction encoding (RFC-0012 §3.2)
// 32-bit fixed-width: OPCODE8 | A4 | B4 | IMM16
// Format per RFC-0012:
//   31..24: OPCODE (8 bits)
//   23..20: A (4 bits) - destination register, source register, or channel
//   19..16: B (4 bits) - source register, flags, or kind selector
//   15..0:  IMM16 (16 bits) - immediate value (opcode-specific interpretation)
typedef struct {
  uint8_t opcode;  // Instruction opcode (RFC-0009 Appendix A)
  uint8_t A;       // 4-bit field: destination register, source register, or channel (0..15)
  uint8_t B;       // 4-bit field: source register, flags, or kind selector (0..15)
  uint16_t imm16;  // 16-bit immediate (RFC-0012 Appendix B interpretation)
} can_inst_t;

// Big-endian read helpers
static inline uint16_t read_u16be(const uint8_t* p) {
  return (uint16_t)((p[0] << 8) | p[1]);
}

static inline uint32_t read_u32be(const uint8_t* p) {
  return ((uint32_t)p[0] << 24) | ((uint32_t)p[1] << 16) |
         ((uint32_t)p[2] << 8) | (uint32_t)p[3];
}

static inline void write_u16be(uint8_t* p, uint16_t v) {
  p[0] = (uint8_t)(v >> 8);
  p[1] = (uint8_t)(v & 0xff);
}

static inline void write_u32be(uint8_t* p, uint32_t v) {
  p[0] = (uint8_t)(v >> 24);
  p[1] = (uint8_t)(v >> 16);
  p[2] = (uint8_t)(v >> 8);
  p[3] = (uint8_t)(v & 0xff);
}

// Decode 32-bit instruction word (RFC-009 §X.6.1)
static inline void decode_inst(uint32_t word, can_inst_t* out) {
  out->opcode = (uint8_t)(word >> 24);
  out->A = (uint8_t)((word >> 20) & 0x0f);
  out->B = (uint8_t)((word >> 16) & 0x0f);
  out->imm16 = (uint16_t)(word & 0xffff);
}

// Encode 32-bit instruction word
static inline uint32_t encode_inst(const can_inst_t* inst) {
  return ((uint32_t)inst->opcode << 24) |
         ((uint32_t)inst->A << 20) |
         ((uint32_t)inst->B << 16) |
         (uint32_t)inst->imm16;
}

// Decode instruction from byte stream (big-endian)
bool decode_inst_bytes(const uint8_t* bytes, can_inst_t* out);

// Encode instruction to byte stream (big-endian)
void encode_inst_bytes(const can_inst_t* inst, uint8_t* bytes);

// Validate imm16 field per opcode (RFC-0012 Appendix B)
// Returns true if imm16 is valid for the given opcode, false otherwise
bool validate_imm16(uint8_t opcode, uint16_t imm16);

// Get imm16 validation mask for opcode
// Returns bitmask of valid bits (1 = valid, 0 = must be zero)
// Used for strict mode validation
uint16_t get_imm16_valid_mask(uint8_t opcode);

#ifdef __cplusplus
}
#endif

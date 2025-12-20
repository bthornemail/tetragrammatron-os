// can_disasm.h
// CAN-ISA Disassembler (RFC-0012)
// Role: Agent 2 — CAN-ISA / BINARY ENCODING ENGINEER (CAN-BIT-TRUTH)
// Implements: RFC-0012 (Binary Encoding) - Human-readable disassembly

#pragma once

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>
#include "can_codec.h"

#ifdef __cplusplus
extern "C" {
#endif

// Disassembly output buffer size
#define CAN_DISASM_BUF_SIZE 256

// Disassemble single instruction to human-readable string
// Returns number of characters written (excluding null terminator)
// Returns -1 on error
int can_disasm_inst(const can_inst_t* inst, char* buf, size_t buf_size);

// Disassemble instruction from 32-bit word
int can_disasm_word(uint32_t word, char* buf, size_t buf_size);

// Disassemble instruction from bytes (big-endian)
int can_disasm_bytes(const uint8_t* bytes, char* buf, size_t buf_size);

// Get opcode mnemonic string
// Returns NULL if opcode is unknown
const char* can_get_opcode_mnemonic(uint8_t opcode);

// Get register name (for semantic registers 0-7)
// Returns NULL if register is not semantic
const char* can_get_register_name(uint8_t reg);

#ifdef __cplusplus
}
#endif


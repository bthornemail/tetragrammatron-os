#pragma once
#include <stdint.h>

// Fetch big-endian u16
static inline uint16_t fetch_u16(const uint8_t *code, uint32_t word_pc) {
    uint32_t i = word_pc * 2;
    return (uint16_t)((code[i] << 8) | code[i + 1]);
}

// Fields
#define OPCODE(w)   (((w) >> 12) & 0xF)
#define RD(w)       (((w) >> 8)  & 0xF)
#define RA(w)       (((w) >> 4)  & 0xF)
#define RB(w)       ((w) & 0xF)

#define IMM8(w)     ((w) & 0xFF)
#define OFF8(w)     ((int8_t)((w) & 0xFF))

#define EXT_OP(w)   (((w) >> 8) & 0xF)

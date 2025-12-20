#pragma once
#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#include "clbc_poly_final.h"   // your deterministic F₂[x] implementation

#define CAN_REG_COUNT 16
#define CAN_MAX_POLY_CONST 256
#define CAN_MAX_CODE_WORDS 4096

typedef struct {
    // Program
    const uint8_t *code_bytes;   // raw CODE section bytes
    size_t code_len;             // bytes
    uint32_t entry_pc;           // entry PC (word index)

    // Constant pool (decoded once)
    f2poly_t poly_const[CAN_MAX_POLY_CONST];
    uint32_t poly_const_count;

    // Registers
    f2poly_t regs[CAN_REG_COUNT];

    // Control
    uint32_t pc;        // program counter (word index)
    bool halted;
    bool faulted;

} can_vm_t;
typedef struct {
    ...
    uint64_t time_now;     // monotonic ticks
    uint64_t time_latch;   // last TIME_RD
} can_vm_t;

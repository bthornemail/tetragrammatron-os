#include "can_vm.h"
#include "can_decode.h"
#include <stdio.h>

static inline f2poly_t *REG(can_vm_t *vm, uint8_t r) {
    return &vm->regs[r & 0xF];
}

static inline void trap(can_vm_t *vm, const char *msg) {
    vm->faulted = true;
#ifdef CAN_VM_DEBUG
    printf("VM TRAP: %s (pc=%u)
", msg, vm->pc);
#endif
}

void can_vm_step(can_vm_t *vm) {
    if (vm->halted || vm->faulted) return;

    uint16_t w = fetch_u16(vm->code_bytes, vm->pc);
    uint8_t op = OPCODE(w);

    vm->pc += 1; // default advance

    switch (op) {

    // -------------------------------------------------
    // HALT
    // -------------------------------------------------
    case 0x0: // HALT
        vm->halted = true;
        return;

    // -------------------------------------------------
    // CANON
    // -------------------------------------------------
    case 0x1: {
        uint8_t rd = RD(w);
        uint8_t ra = RA(w);
        if (rd != 0)
            f2poly_normalize(REG(vm, ra));
        if (rd != 0)
            vm->regs[rd] = vm->regs[ra];
        return;
    }

    // -------------------------------------------------
    // MEET (GCD)
    // -------------------------------------------------
    case 0x2: {
        uint8_t rd = RD(w), ra = RA(w), rb = RB(w);
        if (rd != 0)
            f2poly_gcd(REG(vm, rd), REG(vm, ra), REG(vm, rb));
        return;
    }

    // -------------------------------------------------
    // JOIN (LCM)
    // -------------------------------------------------
    case 0x3: {
        uint8_t rd = RD(w), ra = RA(w), rb = RB(w);
        if (rd != 0)
            f2poly_lcm(REG(vm, rd), REG(vm, ra), REG(vm, rb));
        return;
    }

    // -------------------------------------------------
    // PROJ_FANO (idempotent projection)
    // -------------------------------------------------
    case 0x4: {
        uint8_t rd = RD(w);
        uint8_t mode = IMM8(w);

        // Minimal v1: projection = canonical reduction + degree mod 7 mask
        // (you can later replace this with full incidence projection)
        if (rd != 0) {
            f2poly_normalize(REG(vm, rd));
            REG(vm, rd)->degree %= 7;
        }
        (void)mode;
        return;
    }

    // -------------------------------------------------
    // POLY_LOAD
    // -------------------------------------------------
    case 0x5: {
        uint8_t rd = RD(w);
        uint8_t idx = IMM8(w);
        if (idx >= vm->poly_const_count) {
            trap(vm, "POLY_LOAD index out of range");
            return;
        }
        if (rd != 0)
            vm->regs[rd] = vm->poly_const[idx];
        return;
    }

    // -------------------------------------------------
    // ASSERT_EQ
    // -------------------------------------------------
    case 0x6: {
        uint8_t ra = RA(w), rb = RB(w);
        if (!f2poly_equal(REG(vm, ra), REG(vm, rb))) {
            trap(vm, "ASSERT_EQ failed");
        }
        return;
    }

    // -------------------------------------------------
    // ASSERT_IDEM
    // -------------------------------------------------
    case 0x7: {
        uint8_t ra = RA(w);
        f2poly_t tmp = *REG(vm, ra);
        f2poly_normalize(&tmp);
        if (!f2poly_equal(&tmp, REG(vm, ra))) {
            trap(vm, "ASSERT_IDEM failed");
        }
        return;
    }

    // -------------------------------------------------
    // JMP
    // -------------------------------------------------
    case 0x8: {
        int8_t off = OFF8(w);
        vm->pc = vm->pc + off;
        return;
    }

    // -------------------------------------------------
    // JZ
    // -------------------------------------------------
    case 0x9: {
        uint8_t ra = RA(w);
        if (f2poly_is_zero(REG(vm, ra))) {
            int8_t off = OFF8(w);
            vm->pc = vm->pc + off;
        }
        return;
    }

    // -------------------------------------------------
    // JNZ
    // -------------------------------------------------
    case 0xA: {
        uint8_t ra = RA(w);
        if (!f2poly_is_zero(REG(vm, ra))) {
            int8_t off = OFF8(w);
            vm->pc = vm->pc + off;
        }
        return;
    }

    // -------------------------------------------------
    // EXTENDED
    // -------------------------------------------------
    case 0xF: {
        uint8_t ext = EXT_OP(w);
        uint8_t rd = RD(w);
        uint8_t ra = RA(w);

        uint16_t imm = fetch_u16(vm->code_bytes, vm->pc);
        vm->pc += 1;

        switch (ext) {

        case 0x0: // LI
            if (rd != 0) {
                f2poly_zero(REG(vm, rd));
                if (imm & 1)
                    REG(vm, rd)->words[0] = 1;
                REG(vm, rd)->degree = (imm != 0);
            }
            return;

        case 0x1: // JMP16
            vm->pc = imm;
            return;

        case 0x2: // PCREL16
            vm->pc = vm->pc + (int16_t)imm;
            return;

        default:
            trap(vm, "Unknown EXT opcode");
            return;
        }
    }

    default:
        trap(vm, "Unknown opcode");
        return;
    }
}

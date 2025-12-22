#include "canisa.h"
#include <stddef.h>
#include <string.h>

enum {
  OP_NOP = 0x00,
  OP_HALT = 0x01,

  OP_MOV = 0x10,
  OP_LOAD8 = 0x11,

  OP_ADD = 0x20,
  OP_AND = 0x22,

  OP_MOD8 = 0x30,
  OP_ADMISS_EXCEPT6 = 0x31,

  OP_LOADADDR8 = 0x60,
  OP_EMITREGS = 0x51,
};

static inline uint8_t fetch_u8(canisa_vm_t *vm) {
  if (vm->pc >= vm->code_len) {
    return 0;
  }
  return vm->code[vm->pc++];
}

void canisa_init(canisa_vm_t *vm, const uint8_t addr[8], const uint8_t *code, uint32_t len) {
  memset(vm, 0, sizeof(*vm));
  memcpy(vm->addr, addr, 8);
  vm->code = code;
  vm->code_len = len;
}

int canisa_run(canisa_vm_t *vm, canisa_emit_fn emit) {
  if (!vm || !emit) {
    return -1;
  }

  while (vm->pc < vm->code_len) {
    uint8_t op = fetch_u8(vm);

    switch (op) {
      case OP_NOP:
        break;
      case OP_HALT:
        return 0;
      case OP_MOV: {
        uint8_t packed = fetch_u8(vm);
        uint8_t dst = packed & 0x0F;
        uint8_t src = (packed >> 4) & 0x0F;
        vm->regs[dst] = vm->regs[src];
        break;
      }
      case OP_LOAD8: {
        uint8_t dst = fetch_u8(vm);
        vm->regs[dst] = fetch_u8(vm);
        break;
      }
      case OP_ADD: {
        uint8_t dst = fetch_u8(vm);
        uint8_t packed = fetch_u8(vm);
        uint8_t a = packed & 0x0F;
        uint8_t b = (packed >> 4) & 0x0F;
        vm->regs[dst] = vm->regs[a] + vm->regs[b];
        break;
      }
      case OP_AND: {
        uint8_t dst = fetch_u8(vm);
        uint8_t packed = fetch_u8(vm);
        uint8_t a = packed & 0x0F;
        uint8_t b = (packed >> 4) & 0x0F;
        vm->regs[dst] = vm->regs[a] & vm->regs[b];
        break;
      }
      case OP_MOD8: {
        uint8_t dst = fetch_u8(vm);
        vm->regs[dst] &= 0x07;
        break;
      }
      case OP_ADMISS_EXCEPT6: {
        uint8_t dst = fetch_u8(vm);
        if ((vm->regs[dst] & 0xFF) == 6) {
          return -2;
        }
        break;
      }
      case OP_LOADADDR8: {
        uint8_t start = fetch_u8(vm);
        for (int i = 0; i < 8; i++) {
          vm->regs[(start + i) & 0x0F] = vm->addr[i];
        }
        break;
      }
      case OP_EMITREGS: {
        uint16_t lo = fetch_u8(vm);
        uint16_t hi = fetch_u8(vm);
        (void)lo;
        (void)hi;
        uint8_t start = fetch_u8(vm);
        uint8_t count = fetch_u8(vm);
        emit("emit", &vm->regs[start], count);
        break;
      }
      default:
        return -3;
    }
  }

  return 0;
}

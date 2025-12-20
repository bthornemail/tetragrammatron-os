# 7) ESP32 VM Loop Stub (Interpreter Skeleton)

This is the “vertical slice” you asked for: the loop that reads 16-bit words and dispatches.

**Key point:** word stream is big-endian bytes, same as our emitter.

```c
// vm_can_isa.c (skeleton)
#include <stdint.h>
#include <stdbool.h>

typedef struct {
  uint16_t pc;         // word index
  uint16_t sp;         // stack pointer (optional)
  uint16_t code_words; // code length in u16 words
  const uint16_t *code;
  // registers are handles to polynomials / contexts in your real impl:
  uint32_t R[16];
  bool Z;
} vm_t;

static inline uint16_t fetch(vm_t *vm) {
  return vm->code[vm->pc++];
}

static inline uint16_t fetch_ext(vm_t *vm) {
  return fetch(vm);
}

void vm_step(vm_t *vm) {
  uint16_t w = fetch(vm);

  uint8_t cls = (w >> 12) & 0xF;
  uint8_t op  = (w >>  8) & 0xF;
  uint8_t src = (w >>  4) & 0xF;
  uint8_t dst = (w >>  0) & 0xF;

  switch (cls) {
    case 0x0: { // ALU
      if (op == 0x4) { // LIT16
        uint16_t imm = fetch_ext(vm);
        vm->R[dst] = imm;
      } else if (op == 0x0) { // MOV
        vm->R[dst] = vm->R[src];
      }
      break;
    }

    case 0x1: { // CTRL
      if (op == 0x2) { // JMP
        int16_t rel = (int16_t)fetch_ext(vm);
        vm->pc = (uint16_t)(vm->pc + rel);
      } else if (op == 0x1) { // HALT
        // set pc to end
        vm->pc = vm->code_words;
      }
      break;
    }

    case 0x2: { // TIME
      if (op == 0x1) { // WAIT
        uint16_t ticks = fetch_ext(vm);
        // TODO: busy wait or timer-based yield
        (void)ticks;
      } else if (op == 0x2) { // BARRIER_T
        // TODO: enforce physical timing barrier / crystal sync hook
      }
      break;
    }

    case 0x4: { // GEOM
      // TODO: call your poly canon/gcd/lcm + renderer event emitters
      // op 0x0 CANON, 0x1 MEET, 0x2 JOIN, 0x9 FOLD-A6, 0xD PROJ-FANO
      break;
    }

    default:
      // unknown class => halt
      vm->pc = vm->code_words;
      break;
  }
}

void vm_run(vm_t *vm) {
  while (vm->pc < vm->code_words) vm_step(vm);
}
```

This is enough to run `prog-fold-loop` once you implement GEOM ops calling your existing polynomial library.

---

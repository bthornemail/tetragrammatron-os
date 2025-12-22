#ifndef TETRAGRAMMATRON_CANISA_H
#define TETRAGRAMMATRON_CANISA_H

#include <stdint.h>

#define CANISA_REGS 16

typedef struct {
  uint8_t addr[8];
  uint32_t regs[CANISA_REGS];
  const uint8_t *code;
  uint32_t code_len;
  uint32_t pc;
  uint8_t flag_z;
} canisa_vm_t;

typedef void (*canisa_emit_fn)(const char *key, const uint32_t *values, uint8_t count);

void canisa_init(canisa_vm_t *vm, const uint8_t addr[8], const uint8_t *code, uint32_t len);
int canisa_run(canisa_vm_t *vm, canisa_emit_fn emit);

#endif

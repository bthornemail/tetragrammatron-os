# 7) VM C Skeleton — `vm/can_codec.h` and `vm/can_codec.c`

```c
// vm/can_codec.h
#pragma once
#include <stdint.h>
#include <stdbool.h>
#include "can_vm.h"

static inline uint16_t read_u16be(const uint8_t* p) {
  return (uint16_t)((p[0] << 8) | p[1]);
}

static inline uint32_t read_u32be(const uint8_t* p) {
  return ((uint32_t)p[0] << 24) | ((uint32_t)p[1] << 16) | ((uint32_t)p[2] << 8) | (uint32_t)p[3];
}

bool can_decode_inst(const uint8_t* p, uint32_t remaining, can_inst_t* out);
```

```c
// vm/can_codec.c
#include "can_codec.h"

bool can_decode_inst(const uint8_t* p, uint32_t remaining, can_inst_t* out) {
  if (remaining < 16) return false;

  if (p[0]!=CANB_MAGIC0 || p[1]!=CANB_MAGIC1 || p[2]!=CANB_MAGIC2 || p[3]!=CANB_MAGIC3) return false;
  out->ver = p[4];
  if (out->ver != CANB_VER_V1) return false;

  out->opcode = p[5];
  out->flags  = p[6];
  // reserved bits must be 0
  if ((out->flags & 0xF0u) != 0) return false;

  out->rdst = p[7];
  out->ra   = p[8];
  out->rb   = p[9];
  out->imm16 = read_u16be(p + 10);
  out->ref32 = read_u32be(p + 12);
  return true;
}
```

---

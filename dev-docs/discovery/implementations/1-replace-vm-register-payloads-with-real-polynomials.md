# 1. Replace VM register payloads with real polynomials

### Old (placeholder)
```c
uint32_t regs[CAN_REGS];
```

### New (real)
```c
#include "clbc_poly_final.h"

typedef struct {
  f2poly_t regs[CAN_REGS];
  ...
} can_vm_t;
```

Initialization rule:
```c
for (int i = 0; i < CAN_REGS; i++)
  f2poly_zero(&vm->regs[i]);
```

This alone upgrades the VM from **symbolic tags → real algebra**.

---

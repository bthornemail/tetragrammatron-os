# 2. Canonicalization = idempotent normalization

```c
bool can_op_canon(can_vm_t *vm, uint8_t dst, uint8_t src) {
  vm->regs[dst] = vm->regs[src];     // copy
  f2poly_normalize(&vm->regs[dst]);  // canonical representative
  return true;
}
```

### Property (Lean-level invariant)
```
CANON(CANON(p)) = CANON(p)
```

This is the **idempotence you keep referring to** — now literal.

---

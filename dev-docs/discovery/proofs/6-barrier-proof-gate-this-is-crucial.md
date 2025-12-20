# 6. Barrier = proof gate (this is crucial)

`BARRIER_FANO` must ensure:

1. Inputs are canonical
2. Fold result is idempotent
3. Triad is consistent

### Implementation
```c
bool can_op_barrier_fano(can_vm_t *vm,
                         uint8_t a, uint8_t b, uint8_t c) {
  f2poly_normalize(&vm->regs[a]);
  f2poly_normalize(&vm->regs[b]);
  f2poly_normalize(&vm->regs[c]);

  // Fano triad check (you already defined this!)
  if (!f2poly_fano_check(&vm->regs[a],
                          &vm->regs[b],
                          &vm->regs[c])) {
    return false; // VM halts
  }

  vm->barrier_armed = true;
  vm->last_barrier_a = a;
  vm->last_barrier_b = b;
  vm->last_barrier_c = c;
  return true;
}
```

### This gives you:
- **proof-carrying execution**
- no invalid self-modification
- no geometry violations
- deterministic safety

---

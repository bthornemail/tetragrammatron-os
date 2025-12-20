# 5. Fano projection = incidence compression

We project any polynomial to **one of 7 Fano points** by:

- computing support (set of exponents)
- reducing mod 7
- hashing into incidence class

### Minimal deterministic projection
```c
bool can_op_proj_fano(can_vm_t *vm, uint8_t dst, uint8_t src) {
  uint32_t acc = 0;
  for (uint32_t i = 0; i <= vm->regs[src].degree; i++) {
    if (f2poly_get_coeff(&vm->regs[src], i)) {
      acc ^= (i % 7);
    }
  }
  f2poly_zero(&vm->regs[dst]);
  f2poly_from_bits(&vm->regs[dst], &acc, 1); // single-point poly
  return true;
}
```

This guarantees:
- exactly **7 equivalence classes**
- stable under normalization
- Fano automorphism compatible

---

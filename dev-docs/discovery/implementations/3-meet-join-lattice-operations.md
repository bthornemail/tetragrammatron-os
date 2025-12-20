# 3. MEET / JOIN = lattice operations

### MEET = GCD
```c
bool can_op_meet(can_vm_t *vm, uint8_t dst, uint8_t a, uint8_t b) {
  f2poly_gcd(&vm->regs[dst], &vm->regs[a], &vm->regs[b]);
  return true;
}
```

### JOIN = LCM
```c
bool can_op_join(can_vm_t *vm, uint8_t dst, uint8_t a, uint8_t b) {
  f2poly_lcm(&vm->regs[dst], &vm->regs[a], &vm->regs[b]);
  return true;
}
```

These are:
- commutative
- associative
- idempotent

So the VM is now a **true algebraic lattice machine**.

---

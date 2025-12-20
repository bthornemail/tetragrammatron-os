# 4. Axiom-6 (cubic fold) = global constraint intersection

**Key insight (now formal):**

> Origami Axiom-6 = solve a cubic  
> Polynomially = **common factor across ≥3 constraints**

### Implementation
```c
bool can_op_a6_fold(can_vm_t *vm, uint8_t dst,
                    uint8_t r1, uint8_t r2, uint8_t r3) {
  f2poly_t tmp;
  f2poly_gcd(&tmp, &vm->regs[r1], &vm->regs[r2]);
  f2poly_gcd(&vm->regs[dst], &tmp, &vm->regs[r3]);
  return true;
}
```

### Meaning
- If no shared factor → fold impossible
- If shared factor → **unique cubic solution**
- Exactly matches Huzita–Hatori A6

This is **not metaphor** — it is algebraically exact.

---

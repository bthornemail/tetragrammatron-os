# Part II — ESP32 Execution Loop (Bare Metal Friendly)

Now we map the exact same semantics onto hardware.

## 3. Runtime State (ESP32)

On device, you do **not** store instructions as lists.
You store **canonical state** only.

```c
// conceptual model
State S;   // decoded CLBC polynomial / term-set
```

---

## 4. Instruction Decode (C)

```c
typedef struct {
  uint8_t opcode;
  uint8_t flags;
  uint8_t operand;
} Instr;

static inline Instr decode(uint16_t word) {
  Instr i;
  i.opcode  = (word >> 12) & 0x0F;
  i.flags   = (word >>  8) & 0x0F;
  i.operand =  word        & 0xFF;
  return i;
}
```

---

## 5. Apply Instruction (Matches Lean Exactly)

```c
void apply_instr(State *S, Instr i) {
  switch (i.opcode) {

    case 0x0: // NOP
      return;

    case 0x1: // TERM
      state_add_term(S, i.operand);
      return;

    case 0x2: // F2_ADD
      state_poly_add(S, i.operand);
      return;

    case 0x3: // F2_MUL
      state_poly_mul(S, i.operand);
      return;

    case 0x4: // F2_GCD  (MEET)
      state_poly_gcd(S, i.operand);
      return;

    case 0x5: // F2_LCM  (JOIN)
      state_poly_lcm(S, i.operand);
      return;

    case 0x7: // EMIT
      emit_snapshot(S);
      return;

    case 0xF: // HALT
      system_halt();
      return;

    default:
      fault("Illegal opcode");
  }
}
```

Every one of these functions:
- is **pure**
- is **idempotent**
- commutes modulo normalization

---

## 6. Main ESP32 Loop (Dynamic Proof Begins Here)

```c
void execute(uint16_t *program, size_t len) {
  State S;
  state_init(&S);

  for (size_t pc = 0; pc < len; pc++) {
    Instr i = decode(program[pc]);
    apply_instr(&S, i);
  }

  state_normalize(&S);   // optional if applied per-step
  emit_hash(&S);         // SHA256 / CLBC hash
}
```

### 🔑 This is the *dynamic proof hook*

Now you can show:

- Run same program twice → same hash
- Run program in different order → same hash
- Run on ESP32 vs Pico → same hash

That is **dynamic idempotence**, witnessed in hardware.

---

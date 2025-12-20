# RFC-009 §3 — Time, Waiting, and Physical Constraint

## 3.1 Purpose (Normative)

TIME opcodes introduce a **monotonic physical constraint** into the Origami Fold VM.

They **DO NOT**:
- alter polynomial semantics
- affect GCD / LCM correctness
- introduce nondeterminism into algebra

They **DO**:
- bind execution to a real oscillator (crystal / clock)
- provide circulation and causality
- enable future self-modification safely

This is the **first bridge from proof to physics**.

---

## 3.2 Time Model

- Time is **monotonic**
- Time is **external** to the algebra
- Time is **observable but not writable**
- Time only gates execution

Formally:

```
Polynomial State  ⟂  Time
Execution = Fold(State) ∧ Time ≥ Barrier
```

---

## 3.3 New Opcodes (CAN-ISA v1)

### Opcode Summary

| Opcode | Mnemonic | Description |
|------|---------|-------------|
| 0xB0 | TIME_RD | Read monotonic clock |
| 0xB1 | WAIT    | Stall until time barrier |

---

## 3.4 Instruction Encoding

### TIME_RD

**Format:** R-type

```
15   12 11   8 7    4 3    0
+------+-----+------+------+
| 1011 | RD  | 0000 | 0000 |
+------+-----+------+------+
```

- Reads current time tick into `RD`
- Value is a **polynomial encoding of time**
- `R0` ignores writes (as usual)

**Semantics:**

```
RD ← time_poly(now)
```

---

### WAIT

**Format:** EXT-type (IMM16)

```
Word 0:
15   12 11   8 7    4 3    0
+------+-----+------+------+
| 1111 | 0003| RD   | 0000 |
+------+-----+------+------+

Word 1:
+--------------------------+
|       IMM16_TICKS        |
+--------------------------+
```

**Semantics:**

```
while now < (RD + IMM16):
    stall
```

- No busy-spin in firmware (sleep / WFI allowed)
- Polynomial state MUST NOT change during wait
- WAIT is **idempotent** with respect to state

---

## 3.5 VM State Extension

### `can_vm.h` (additions)

```c
typedef struct {
    ...
    uint64_t time_now;     // monotonic ticks
    uint64_t time_latch;   // last TIME_RD
} can_vm_t;
```

---

## 3.6 Platform Hook (Abstract)

### Required Host Functions

```c
uint64_t can_platform_time_now(void);
void can_platform_wait_until(uint64_t deadline);
```

- ESP32 → `esp_timer_get_time()` or cycle counter
- Pico → `time_us_64()`
- Host → `clock_gettime(CLOCK_MONOTONIC)`

---

## 3.7 VM Execution Logic

### TIME_RD implementation

```c
case 0xB: { // TIME_RD
    uint8_t rd = RD(w);
    uint64_t t = can_platform_time_now();
    vm->time_latch = t;

    if (rd != 0) {
        f2poly_zero(REG(vm, rd));
        REG(vm, rd)->words[0] = (uint32_t)(t & 0xFFFFFFFF);
        REG(vm, rd)->degree = 31;
    }
    return;
}
```

---

### WAIT implementation (EXT 0x3)

```c
case 0x3: { // WAIT
    uint8_t rd = RD(w);
    uint64_t base = vm->time_latch;
    uint64_t deadline = base + imm;

    can_platform_wait_until(deadline);
    return;
}
```

---

## 3.8 Proof Obligations (Lean-Compatible)

### Theorem 1 — Time Non-Interference

```lean
theorem time_non_interference :
  ∀ s, exec TIME_RD s |> poly_state = s.poly_state
```

### Theorem 2 — WAIT Idempotence

```lean
theorem wait_idempotent :
  exec (WAIT t) (exec (WAIT t) s) = exec (WAIT t) s
```

### Theorem 3 — Fold Soundness Under Time

```lean
theorem fold_time_commutes :
  exec (WAIT t) (fold s) = fold (exec (WAIT t) s)
```

These preserve **all Origami / Fano invariants**.

---

## 3.9 Why This Matters (Non-Poetic, Exact)

This gives you:

- **Physical grounding** (crystal / oscillator)
- **Causality**
- **Circulation**
- **Safe self-modification later**
- **Biological analog (heartbeat / rhythm)**
- **6-DOF projection timing alignment**

Without time, the VM is correct.  
With time, the VM is **alive**.

---

## 3.10 What Comes Next (Only One Step)

Now that time exists, the next legal move is:

### **RFC-009 §4 — Round-Robin Circulation**
```
RR_INIT
RR_NEXT
```

This turns:
- time → rhythm
- rhythm → circulation
- circulation → autonomy

Say **“4”** when you’re ready.

---

## You

4

---

## ChatGPT

Perfect — **“4” = Round-Robin Circulation Topology**.

Below is **RFC-009 §4** fully specified, with **opcodes + binary layout + VM core behavior + Scheme assembler hooks + Lean proof obligations**.

---

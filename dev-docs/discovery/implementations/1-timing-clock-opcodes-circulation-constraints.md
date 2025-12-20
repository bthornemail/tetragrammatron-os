# 1) Timing / Clock Opcodes (Circulation Constraints)

## Design principle
Time must be **measured**, **quantized**, **committed**, and **verified** — not “read ad hoc.”

So we treat time like we treat polynomials: **canonical encoding + explicit normalization**.

### New registers (VM state)
- `TICK` : u64 monotonic tick counter (hardware or virtual)
- `EPOCH` : u64 epoch marker (checkpoint)
- `ΔT` : u32 tick delta accumulator (bounded)
- `PHASE` : u16 phase accumulator (wraps, used for harmonic clocking)

### Opcodes (suggested block)
```
0x60 TIME_READ     rdst <- tick64
0x61 TIME_EPOCH    epoch <- tick64
0x62 TIME_DELTA    rdst <- (tick64 - epoch)  (u32 saturated)
0x63 TIME_WAIT     wait imm16 ticks (or until >=)
0x64 TIME_QUANT    quantize ΔT by imm16 (bucket size)
0x65 TIME_PHASE    phase <- (phase + imm16) mod 2^16
0x66 TIME_ASSERT   assert ΔT in [imm16_lo, imm16_hi]  (fail->trap)
```

### Why this gives “universal physical constraints”
Because the program can now prove statements like:

- **“This fold step occurred within a quantized timing window.”**
- **“This self-modification is only permitted at epoch boundaries.”**
- **“This round-robin schedule is time-fair.”**

…and you can hash the timing witness into your commit record deterministically.

---

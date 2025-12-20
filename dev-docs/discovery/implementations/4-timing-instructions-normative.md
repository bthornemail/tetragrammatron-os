# 4) Timing instructions (Normative)

## 4.1 TIME_RD — read monotonic time into a register
**Opcode:** `0x60`

Layout:
```
u8  op      = 0x60
u8  dst_reg = 0..15
u8  unit    = 0..3
u8  flags   = 0 (reserved; MUST be 0 in v1)
```

Meaning:
- Reads platform monotonic counter and writes an unsigned integer into `dst_reg`.
- `unit`:
  - 0 = cycles
  - 1 = microseconds
  - 2 = nanoseconds (if supported; otherwise MUST map deterministically from cycles)
  - 3 = reserved (illegal in v1)

Total size: **4 bytes**

---

## 4.2 WAIT_US — busy wait for N microseconds
**Opcode:** `0x61`

Layout:
```
u8  op   = 0x61
u8  src_reg = 0..15   ; duration in microseconds
u16 flags = 0         ; reserved; MUST be 0 in v1
```

Total size: **4 bytes**

---

## 4.3 BARRIER_T — timing barrier (physical constraint hook)
**Opcode:** `0x62`

Layout:
```
u8  op      = 0x62
u8  mode    = 0..3
u16 param   ; big-endian
```

Modes:
- 0: `BARRIER_T(Δt_us)`  where `param = Δt_us` (u16 microseconds)
- 1: `BARRIER_T(cycles)` where `param = cycles` (u16 cycles)
- 2: `BARRIER_T(sync_id)` where `param = sync_id` (u16 id)
- 3: reserved (illegal)

Total size: **4 bytes**

This is the “analog/timing crystal / clock substrate” bridge: you can force pacing, stabilize circulation, and bound self-modifying application windows.

---

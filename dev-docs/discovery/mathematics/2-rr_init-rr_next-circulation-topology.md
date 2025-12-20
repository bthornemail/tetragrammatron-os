# 2) RR_INIT + RR_NEXT (circulation topology)

Define a round-robin scheduler that is **purely discrete** and **replayable**.

### VM state additions
- `rr.count : u8` number of lanes/participants
- `rr.idx   : u8` current lane (0..count-1)
- `rr.epoch : u32` increments when idx wraps (gives circulation “heartbeats”)

### Opcodes
#### RR_INIT
- **Semantics:** `rr.count ← imm8 (1..255)`, `rr.idx ← 0`, `rr.epoch ← 0`

**Encoding**
- `FMT=01`, imm8 = count

#### RR_NEXT
- **Semantics:**
  - `rr.idx ← (rr.idx + 1) mod rr.count`
  - if wraps to 0: `rr.epoch++`
  - `RA ← rr.idx` (optionally: RA gets idx so programs can branch on it)

**Encoding**
- `FMT=00`, RA = dest

**Invariant**
- RR evolution MUST be deterministic given initial count.
- RR values MUST be emitted via MUX_EVT for trace parity across devices.

---

# 1) TIME_RD + WAIT + BARRIER_T

### VM time model (deterministic + physical)
- VM maintains `t_phys` from hardware timer, plus `t_vm` (monotonic logical time).
- `t_vm` MUST be computed as:
  - `t_vm = max(t_vm, t_phys, last_barrier_t)`
- This prevents time going backward even if the hardware clock jitters.

### Opcodes
#### TIME_RD (read time)
- **Semantics:** `RA ← now_us()` (microseconds, u32 or u64 depending build)
- **Determinism:** value is *observed*, not derived; must be logged in MUX_EVT for replay.

**Encoding**
- `FMT=00`, RA=dest, RB ignored.

#### WAIT (sleep until duration)
- **Semantics:** block until `(now_us() - start) ≥ imm16_us`
- **Required:** MUST update `t_vm` after waking.

**Encoding**
- `FMT=10`, imm16 = microseconds.

#### BARRIER_T (time barrier)
- **Semantics:** enforce `t_vm ≥ imm16_us` OR `t_vm ≥ RA` depending format.
- **Purpose:** gives you a “physical constraint hook” for proofs: ordering by time.

**Encoding options**
- `FMT=10`: barrier at absolute `imm16`
- `FMT=00`: barrier at `RA` (barrier time stored in register)

**Invariant**
- After `BARRIER_T`, all subsequent commits/patches MUST record the barrier token.

---

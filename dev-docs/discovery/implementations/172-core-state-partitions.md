# 17.2 Core state partitions

VM state MUST be partitioned into:

- **Registers**
  - `R[0..N-1]` generic registers (u64 or u32 depending on target)
  - `P[0..M-1]` polynomial registers (CLBC-POLY f2poly_t fixed-size)
  - `H[0..K-1]` hash registers (32 bytes each, SHA-256)

- **Memory spaces**
  - `CODE`, `DATA`, `CONST`, `MUX_META` (as in §16.4)

- **Runtime control**
  - `pc` program counter
  - `barrier_active : bool`
  - `barrier_epoch : u64` (time snapshot)
  - `rr_state` round-robin cursor + policy
  - `mux_ring` event ring buffer (canonical event bytes)
  - `state_hash` rolling chain hash

---

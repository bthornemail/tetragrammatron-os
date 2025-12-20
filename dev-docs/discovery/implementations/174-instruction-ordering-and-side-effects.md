# 17.4 Instruction ordering and side effects

Instructions fall into 3 categories:

### (A) Pure (deterministic)
- poly ops: `MEET(GCD)`, `JOIN(LCM)`, `CANON`, `PROJ_FANO`, etc.
- register moves, arithmetic, etc.

### (B) Buffered side effects
- MUX events: must go into `mux_ring` as canonical bytes and commit at phase (4)

### (C) Barrier-gated mutations
- PATCH apply: must only commit at phase (3) or at instruction boundary that enforces barrier

Rule:
- If an instruction produces a side effect, it MUST do so either by:
  - writing deterministic state, or
  - appending a canonical event record to `mux_ring`.

No direct “printf/uart” inside opcode handlers except via MUX commit.

---

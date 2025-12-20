# 17.3 Timing substrate (the analog constraint)

The VM MUST define a monotonic time source `t_now`.

On ESP32 / Pico:
- `t_now` SHOULD be derived from a hardware timer/cycle counter.
- `TIME_RD` MUST return a value that is monotonic within a run.

Determinism rule:
- The VM MUST treat time as **observed input** but MUST only allow it to affect behavior at defined instructions (`TIME_RD`, `WAIT`, `BARRIER_T`).
- No “implicit time branching” is allowed.

---

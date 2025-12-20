# 11. Acceptance Criteria (Irrefutable + Demonstrable)

You’re “done” when:

1. A trace can be replayed on two machines and produces identical refs.
2. Fano7 + PCG14 checks pass deterministically.
3. Lean/Coq artifact exports boundary/tickets that match runtime validation.
4. A static viewer can render the same trace without affecting validity.
5. The system runs in a constrained profile (ESP32 plan: log+hash+check).

---

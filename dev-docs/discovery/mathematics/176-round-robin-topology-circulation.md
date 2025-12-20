# 17.6 Round-robin topology (circulation)

Round-robin is your “biological chirality / circulation” primitive.

`RR_INIT` defines a ring over a set of indices (registers, polynomial registers, or memory blocks).

`RR_NEXT` advances cursor deterministically and returns the current element index.

Rules:
- RR order MUST be stable and independent of platform.
- RR_NEXT MUST be pure (no IO); it only updates `rr_state`.

This makes your system “keep moving” even without external inputs.

---

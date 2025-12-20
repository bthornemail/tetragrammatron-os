# 3) IMM16 + PATCH (self-modifying but safe)

## 3A) IMM16 encoding (canonical, no ambiguity)

### Surface form
```scheme
(IMM16 rX #xNNNN)     ; or (IMM16 rX 4660)
```

### Binary encoding (2 words)
- word0: `[OP_IMM16 dst 0 0]`
- word1: `[0 hi lo 0]`  where `imm16 = hi*256 + lo`

This matches the same “extension word” pattern as jumps.

---

## 3B) PATCH block model (safe self-modification)

You said you want “self modifying code” but constrained by an analog/timing/physical barrier. Patch gives you that **without letting arbitrary writes happen at any time**.

### High-level semantics
- `PATCH_BEGIN id` starts a staged patch buffer (not executable yet)
- `PATCH_WRITE16 id offset imm16` writes into that buffer at a *bounded* offset
- `PATCH_SEAL id hashReg` seals (commits) the patch; VM computes/validates digest (policy-defined)
- `PATCH_APPLY id` applies patch only if:
  - sealed
  - passes policy (e.g., only patching within allowed range)
  - optionally requires a barrier/timing check you already want (TIME_RD/BARRIER_T later)

This is exactly the “circulation + proof + physical constraint” lane.

---

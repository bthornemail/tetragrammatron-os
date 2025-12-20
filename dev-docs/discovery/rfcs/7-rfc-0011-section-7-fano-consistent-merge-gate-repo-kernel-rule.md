# 7. RFC-0011 Section 7: Fano-consistent merge gate (repo kernel rule)

**Rule (normative):**
A merge from `feature/* → current` or `current → main` MUST be rejected unless the **Fold VM proof program** (like the one above) passes using:
- the proposed new state polynomial `P_new`
- the target branch state polynomial `P_base`
- the branch context key `K_branch`

Concretely, CI runs:
- `CANON(P_new), CANON(P_base), CANON(K_branch)`
- `MEET = gcd(P_new, P_base)`
- `JOIN = lcm(P_new, P_base)`
- `FANO.S(K_branch, P_new, P_base)` (strict)
- idempotence assertions on meet/join/canon

If that VM program halts successfully, the merge is declared **Fano-consistent**.

This is the mechanical “only propagate/backprop if merge maintains Fano consistency” rule you described—now enforceable in firmware, host VM, and CI.

---

If you want the next chunk (the thing you asked earlier but we paused on): I can write **RFC-009 Section 5 as a Lean skeleton** that corresponds exactly to `CANON/MEET/JOIN/FANO.S/ASSERT` (types + semantics + determinism lemmas), and it will match this binary encoding 1:1.

---

## You

Yes but you change the names to the "8-tuple"

---

## ChatGPT

Perfect — we’ll keep **everything exactly as specified**, but **rename the semantic axes back to the canonical 8-tuple**, while keeping them **keyboard-safe, mnemonic, and graph-friendly**.

Below is a **clean correction + normalization** of **RFC-009 + RFC-0011** with **no semantic drift**.

---

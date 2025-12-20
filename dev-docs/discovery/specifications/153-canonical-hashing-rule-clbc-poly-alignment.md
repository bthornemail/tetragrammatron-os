# 15.3 Canonical hashing rule (CLBC-POLY alignment)

To match your CLBC-POLY “canonical bytes then SHA256” discipline:

- Every MUX payload MUST have a **canonical byte encoding**.
- For each `MUX_EVT`, VM MUST compute:
  - `evt_hash = SHA256( canonical_bytes(payload) )`
- VM MUST also compute a rolling stream hash:
  - `H₀ = 0^32`
  - `Hᵢ₊₁ = SHA256( Hᵢ || evt_hash || ts16 || chan || kind )`
- `MUX_CLOSE` MUST output `final_hash = H_last`.

This gives “proof-carrying replay”: your visuals/sounds become a deterministic artifact.

---

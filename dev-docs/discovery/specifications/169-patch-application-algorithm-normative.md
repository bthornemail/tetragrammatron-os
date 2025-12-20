# 16.9 Patch application algorithm (normative)

If `ATOMIC=1`, VM MUST:

1. Pre-validate all records (bounds, permissions, policy).
2. Apply changes into a scratch buffer or journal.
3. Run required invariant checks (Fano policy).
4. Commit journal to target spaces.
5. Emit deterministic events (MUX optional).
6. Update rolling state hash deterministically:
   - `H_next = SHA256(H_prev || patch_hash || barrier_time || policy_id)`

If `ATOMIC=0`, VM MAY apply record-by-record but MUST still:
- trap on first failure, and
- MUST NOT leave invariant violations undetected.

Recommendation: always run atomic on firmware.

---

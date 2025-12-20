# 16.3 Determinism and barriers

PATCH MUST be *barrier-gated*:

- `PATCH_APPLY` MUST only succeed if:
  1. The VM is inside a **BARRIER_T** region (RFC-009 time barrier),
  2. And the patch passes **Fano policy checks** (16.7),
  3. And the patch hash matches the sealed hash.

This is your “analog constraint” turned into a hard rule: **timing crystal / clock** defines the barrier boundaries; patching can only happen when the machine agrees it’s at a stable boundary.

---

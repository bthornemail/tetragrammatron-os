# 17.8 State hash commit (proof-to-firmware bridge)

At phase (5), the VM MUST update `state_hash` as:

```
H_next = SHA256(
  H_prev ||
  pc ||
  canonical_deltas ||
  committed_mux_bytes ||
  applied_patch_hashes ||
  barrier_epoch (if changed)
)
```

Minimal version:
- include at least `(H_prev || committed_mux_bytes || applied_patch_hashes)`.

This gives you the “dynamic proof”: every run yields the same hash given same inputs.

---

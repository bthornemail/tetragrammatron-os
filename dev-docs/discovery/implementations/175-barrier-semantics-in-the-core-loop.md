# 17.5 Barrier semantics in the core loop

## 17.5.1 BARRIER_T
When `BARRIER_T` executes, the VM MUST:
1. capture `barrier_epoch := TIME_RD()`
2. set `barrier_active := true`
3. optionally clear `mux_ring` staging buffer if policy requires

`barrier_active` remains true until one of:
- an explicit `BARRIER_END` (optional future opcode), or
- a deterministic timeout window based on `WAIT`/time (recommended), or
- end-of-program.

Minimal version (recommended now):
- Barrier stays active until `WAIT` consumes a duration and then clears it.

## 17.5.2 Patch apply gate
`PATCH_APPLY` MUST fail unless `barrier_active = true`.

When `PATCH_APPLY` succeeds:
- the VM MUST record `(patch_hash, barrier_epoch)` into the state hash chain.

---

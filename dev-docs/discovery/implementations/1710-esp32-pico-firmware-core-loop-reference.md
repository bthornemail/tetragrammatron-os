# 17.10 ESP32 / Pico firmware core loop (reference)

This is the canonical structure you’ll implement in C on both devices:

```c
for (;;) {
  // (1) fetch
  uint16_t w0 = fetch_u16(code, pc);

  // (2) decode
  insn_t insn = decode(w0, code, &pc);

  // (3) execute
  exec(&vm, &insn);

  // (4) barrier/patch commit gate (can be inside exec for PATCH_APPLY,
  //     but must enforce the same invariant)
  // e.g. exec() checks vm.barrier_active

  // (5) mux commit (only flush sealed bundles)
  mux_commit(&vm.mux);

  // (6) state hash commit (optional per-instruction or per-bundle)
  hash_commit(&vm);

  if (vm.halt) break;
}
```

Required property:
- ESP32 and Pico MUST produce identical `mux bytes` and `state_hash` for identical inputs.

---

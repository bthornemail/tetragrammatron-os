# 17.7 MUX integration (visual + waveform channels)

The MUX subsystem MUST:

- Buffer events as canonical bytes:
  - `MUX_OPEN` begins an event bundle
  - `MUX_EVT` appends event records (svg points, fano triads, audio freq, etc.)
  - `MUX_CLOSE` seals the bundle and pushes to output commit

At phase (4) EVENT COMMIT:
- The VM MUST flush sealed bundles to transport (UART/WiFi/file) in order.
- The bytes flushed MUST be exactly the canonical bytes in the ring.

This is how you get:
- SVG/GLB projection events,
- frequency/harmonic events,
- debug traces,
**without** breaking determinism.

---

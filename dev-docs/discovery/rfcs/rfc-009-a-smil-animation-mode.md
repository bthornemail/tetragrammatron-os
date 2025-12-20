# RFC-009-A (SMIL Animation Mode)

## Timing model (deterministic)
- Define constants:
  - `FRAME_MS = 120` (or 100, 80 — pick one and freeze)
  - `t(step) = step * FRAME_MS` milliseconds
- Every event produces **a highlight pulse**:
  - `DUR_MS = FRAME_MS * 0.9` (pulse lasts most of the frame)
- SVG uses `begin="tms"` and `dur="DURms"`.

No randomness. Same trace ⇒ same SVG bytes.

---

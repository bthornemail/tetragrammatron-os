# RFC-009-A2: Accumulating Animation Mode (Monotone)

## Semantics
For each event `e@step`, the renderer emits a **SMIL set** that:
- begins at `t = step * FRAME_MS`
- updates the target style
- **freezes forever after firing**

This makes the visualization a **cumulative projection of execution**.

---

# 1) Execution model (what the renderer does)

The VM emits a **Render Event Stream** (RES). The SVG renderer is a pure function:

```
SVG = render(normalize(RES))
```

Normalization MUST:
1) sort items by type (lines → circle-line → points → labels),
2) sort by ids (`L0..L6`, then `p0..p6`),
3) emit attributes in fixed order.

This makes SVG byte-identical across ESP32/Pico/host.

---

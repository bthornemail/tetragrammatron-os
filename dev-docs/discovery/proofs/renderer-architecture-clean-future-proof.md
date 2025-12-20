# Renderer Architecture (Clean & Future-Proof)

```
CanvasL Core
  ├─ fold semantics (RFC-009)
  ├─ Fano gate
  ├─ polynomial ops
  └─ CAN-ISA VM
        ↓
Geometry Emitters
  ├─ svg_emitter.scm
  ├─ obj_emitter.scm
  └─ gltf_emitter.c (later)
        ↓
Viewers
  ├─ Browser (SVG / Three.js)
  ├─ ESP32 (line rasterizer)
  └─ Blender / Inkscape
```

**Key rule:**  
Renderers are *pure functions*.  
No state. No heuristics. No interpretation.

---

# 4) SVG / GLB Renderer Bridge (2D/3D Visual Reasoning)

Don’t generate SVG/GLB “directly.” Emit a **renderer event stream** (deterministic), then compile to SVG/GLB offline or on-device.

### Opcodes
```
0x90 REND_BEGIN    begin frame (barrier)
0x91 REND_POINT    emit point (x,y,z) packed
0x92 REND_EDGE     emit edge (i,j) indices
0x93 REND_FACE     emit face (i,j,k)
0x94 REND_STYLE    set style/material id
0x95 REND_END      end frame -> commits hash
```

### Geometry packing (deterministic fixed-point)
Use **signed fixed-point** so ESP32/Pico match:
- `coord16 = int16`, interpreted as Q8.8 or Q4.12
- no floats at all

This is the bridge you wanted: *exact* coordinates → exact SVG paths / exact mesh vertices.

---

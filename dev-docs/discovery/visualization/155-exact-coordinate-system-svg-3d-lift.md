# 15.5 Exact coordinate system (SVG + 3D lift)

## 15.5.1 2D (SVG)
- Coordinate space: **signed Q16.16 fixed point** (no floats)
- Origin: (0,0) at canvas center
- +X right, +Y up
- Default “unit” = 1.0 = 65536

Why: fixed-point is deterministic across ESP32/Pico.

### SVG primitive canonical forms
- LINE: `(x1,y1,x2,y2)` each i32
- POLYLINE: list of points length N (u16), then N*(x,y)
- PATH: command stream (M/L/C/Q/Z) with fixed-point params

## 15.5.2 3D (OBJ)
- Coordinate space: signed Q16.16 fixed point (x,y,z)
- Right-handed coordinates:
  - +X right
  - +Y up
  - +Z forward
- OBJ lift MUST be deterministic:
  - vertices emitted in stable order
  - faces use 1-based indices (OBJ standard)
  - materials optional but if present MUST be canonicalized

## 15.5.3 GLB (preferred)
- GLB payload carried as chunks (because big)
- Chunking MUST be deterministic: fixed max chunk size (e.g., 512 bytes) and sequential order.

---

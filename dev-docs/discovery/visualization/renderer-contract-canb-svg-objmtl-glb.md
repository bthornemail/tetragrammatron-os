# Renderer Contract: CANB → SVG → OBJ/MTL → GLB

## 7. Coordinate system (exact integer grid)

All renderers MUST interpret node positions in **integer fixed-point**:

- Stored positions are **i32 millipoints** (1 unit = 1/1000 px or 1/1000 world unit).
- SVG output divides by 1000 at the last moment (string formatting), but the VM never uses floats.

### 7.1 Canonical Fano layout (derived from 8 registers)

The Fano projection is derived; but you want deterministic SVG→3D lift. So define **one canonical layout**:

- 7 projected points are computed from the 8-register state by selecting a stable 7-of-8 mapping (e.g., omit `reject` for “accept-centric” projection, or omit whichever is the meet-identity in the current state).  
- **Rule:** the omitted register MUST be deterministically chosen as:
  - `omit = argmin_r (weight(reg[r].poly), r)` (lowest weight, tie by reg_id)

That gives you a canonical 7-point projection from the 8 every time.

Then map projected point indices `p0..p6` to fixed integer coords (millipoints). Example (same as earlier but ×1000):

- p0 = (512000, 256000)
- p1 = (707000, 369000)
- p2 = (707000, 655000)
- p3 = (512000, 768000)
- p4 = (317000, 655000)
- p5 = (317000, 369000)
- p6 = (512000, 512000)

This is stable and makes SVG → OBJ → GLB consistent.

## 8. OBJ/MTL and GLB strategy

You’re right: **OBJ is a reduction target**, not the top. So:

- Primary 3D artifact: **GLB (glTF 2.0 binary)**
  - supports materials, nodes, animations, morph targets, skinning, multiple channels
- Reduction outputs:
  - `.obj + .mtl` for compatibility
  - `.svg` for 2D proof surfaces
  - later: `.wav` / `.flac` / `.mp4` via mux (AVD)

### 8.1 Lift rule
- Each projected node becomes a GLB node with:
  - translation = (x/1000, y/1000, zLayer)
  - zLayer derived from register id (0..7) or from fold depth
- Each edge becomes a polyline mesh or cylinder segment
- Faces (when you go beyond Fano) become triangle meshes

---

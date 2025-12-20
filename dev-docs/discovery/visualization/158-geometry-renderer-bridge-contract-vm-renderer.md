# 15.8 Geometry renderer bridge contract (VM → renderer)

The renderer is a consumer of MUX streams.

## 15.8.1 Required renderer behavior
- MUST accept the coordinate profile declared by `meta_hash`.
- MUST interpret payloads deterministically per kind.
- MUST expose “lift” functions:
  - SVG→OBJ (2D to planar mesh) MUST be deterministic
  - OBJ→GLB packaging MUST be deterministic if done

## 15.8.2 Verification hook
- Renderer SHOULD recompute each event hash and stream rolling hash.
- If mismatch, renderer MUST flag stream as invalid.

This is how visuals become “proof-adjacent”.

---

# 1. Determinism Requirements

### 1.1 Fixed-point canonical geometry
All geometry coordinates **MUST** originate as signed integers and be converted to float32 by a fixed scale:

- Let `S = 65536` (2¹⁶).
- For a coordinate integer `ix : int32`, the float stored in `POSITION` is:  
  `x = float32(ix) / float32(S)`.

**Prohibited:** trig, transcendental math, platform-dependent rounding paths.  
**Allowed:** integer tables (e.g., Fano points), integer transforms, fixed-point ops.

### 1.2 Stable ordering
Emit order is canonical:
1) Points (if any)  
2) Edges  
3) Faces  
4) Animation samples (if enabled)  
All arrays are written in the order events appear, unless a higher-level canonical sorter is specified (not in v1.0).

### 1.3 Alignment
Every glTF chunk and BIN segment **MUST** align to 4 bytes (glTF requirement). Padding bytes are deterministic.

---

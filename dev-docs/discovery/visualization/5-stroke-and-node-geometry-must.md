# 5. Stroke and Node Geometry (MUST)

To guarantee identical appearance across engines:

## 5.1 Stroke width
- `stroke-width="4"` in CU

## 5.2 Point radius
- `r="10"` in CU for points

## 5.3 Z-order (critical for determinism)
Emit layers in this order:

1. Background (optional)
2. Lines (all)
3. Circle-line (if present)
4. Points (all)
5. Labels/metadata (optional)

---

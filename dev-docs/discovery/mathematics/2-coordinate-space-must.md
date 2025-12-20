# 2. Coordinate Space (MUST)

## 2.1 Units
- Coordinates are in **Canvas Units (CU)** where **1 CU = 1 viewBox unit**
- All canonical points MUST be **integers**
- Therefore all emitted coordinates MUST be in **ℤ** (no floats)

## 2.2 Origin and Axes
- Origin: **top-left**
- +X: right
- +Y: down

This matches SVG default and simplifies embedded rasterization.

## 2.3 Canonical Bounds
- Safe drawing region: `M = 64` margin
- Therefore canonical geometry MUST lie within:

```
x ∈ [64, 960]
y ∈ [64, 960]
```

---

# RFC-009 SVG Bridge (VM → SVG) — Minimal Deterministic Spec

## A. Canonical SVG coordinate system (Fano plane)

We fix the **7 points** on a unit circle + 1 center (optional) but **we’ll do 7-only** first.

**Canvas:** `viewBox="-100 -100 200 200"`  
**Radius:** `R = 80`  
**Point i:** `θᵢ = 2π * i / 7`, for `i ∈ {0..6}`  
**Coordinate:**  
`xᵢ = round(R * cos θᵢ)`  
`yᵢ = round(R * sin θᵢ)`

Rounding rule is deterministic: round-to-nearest-int (`lrint`).

This gives a stable “Fano wheel” coordinate system.

---

## B. Fano line set (incidence) for rendering edges

Use your canonical 7 lines (0-based indices):

```
L0={0,1,3}
L1={1,2,4}
L2={2,3,5}
L3={3,4,6}
L4={4,5,0}
L5={5,6,1}
L6={6,0,2}
```

(If your repo uses 1..7, just subtract 1.)

---

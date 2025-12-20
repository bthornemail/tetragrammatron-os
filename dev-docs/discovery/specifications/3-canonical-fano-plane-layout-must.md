# 3. Canonical Fano Plane Layout (MUST)

We fix one **exact** Fano embedding into this 1024×1024 plane.

## 3.1 Point IDs
Points are identified as `p0..p6` (7 points).  
(If you want semantic names later, they alias these IDs.)

## 3.2 Canonical Coordinates (integers)

Let:
- Center `C = (512, 512)`
- Radius `R = 384`

We place:
- 6 points on a hexagon
- 1 point at the center

### Exact point coordinates

```text
p0 = (512, 128)  // top
p1 = (832, 320)  // upper-right
p2 = (832, 704)  // lower-right
p3 = (512, 896)  // bottom
p4 = (192, 704)  // lower-left
p5 = (192, 320)  // upper-left
p6 = (512, 512)  // center
```

These are all integers, symmetric, and stable.

---

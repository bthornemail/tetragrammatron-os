## Exact SVG Coordinate System (Normative)

This is the **single canonical** coordinate system all CanvasL → SVG emitters MUST use. It’s designed so:

- You get **pixel-stable diffs** in git
- Geometry is **tool-agnostic** (Inkscape, browsers, etc.)
- Fano projection is **idempotent** (same input → same SVG bytes after normalization)
- It maps cleanly onto **integer / fixed-point** math for ESP32/Pico

---

# 1. SVG Document Envelope (MUST)

Emitters **MUST** produce SVG with:

- `viewBox="0 0 1024 1024"`
- `width="1024" height="1024"` OR omit and rely on viewBox
- `shape-rendering="geometricPrecision"`
- `vector-effect="non-scaling-stroke"` on strokes (or global style)
- **No transforms** for canonical geometry (transforms allowed only in debug layers)

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 1024 1024"
     width="1024" height="1024"
     shape-rendering="geometricPrecision">
  <defs>
    <style>
      .stroke { vector-effect: non-scaling-stroke; }
    </style>
  </defs>
</svg>
```

---

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

# 4. Canonical Fano Lines (MUST)

We represent the 7 “lines” as:

- 6 straight chords between pairs of outer points (triangle + inverted triangle)
- 1 circle through the 3 “midpoints” analogue (we model it as a **circle centered at C** with radius `r=192`)

This is the standard visual Fano: 6 straight lines + 1 circle.

## 4.1 Line IDs and Incidence (Normative)

We define 7 lines `L0..L6` as sets of 3 points each:

```text
L0 = {p0, p2, p4}
L1 = {p0, p3, p6}
L2 = {p0, p1, p5}
L3 = {p1, p3, p4}
L4 = {p2, p3, p5}
L5 = {p6, p2, p5}
L6 = {p6, p1, p4}
```

This is a valid Fano incidence structure (7 lines × 3 points, each pair of points lies on exactly one line).

## 4.2 SVG Primitives for Lines

### Straight lines
Emit as `<line>` between the two outer endpoints. The “third point” MUST lie on that line by construction of the incidence mapping (you still list incidence in metadata).

Example:
```xml
<line class="stroke" x1="512" y1="128" x2="832" y2="704" />
```

### The “circle line”
The special line is emitted as:

- `<circle cx="512" cy="512" r="192" />`

```xml
<circle class="stroke" cx="512" cy="512" r="192" />
```

---

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

# 6. Canonical Ordering Rules (MUST)

For byte-identical determinism, emit elements sorted:

1. Points in ascending ID: `p0..p6`
2. Lines in ascending ID: `L0..L6`
3. Within each `<g>`, attributes MUST be emitted in a fixed order:

For `<line>`:
`x1,y1,x2,y2`

For `<circle>`:
`cx,cy,r`

For `<circle point>`:
`cx,cy,r`

---

# 7. Required Metadata Hooks (MUST)

Each emitted SVG MUST carry:

- `data-canvsl-hash="…"` (hash of canonical CanvasL record input)
- `data-proj="fano"` when this layout is used
- Each point element has `id="p0"` etc.
- Each line element has `id="L0"` etc. and `data-incidence="p0,p2,p4"`

Example:
```xml
<g id="fano" data-proj="fano" data-canvsl-hash="0x...">
  <line id="L0" data-incidence="p0,p2,p4" x1="512" y1="128" x2="832" y2="704" class="stroke"/>
  ...
  <circle id="Lcircle" data-incidence="p1,p3,p5" cx="512" cy="512" r="192" class="stroke"/>
  <circle id="p0" cx="512" cy="128" r="10"/>
  ...
</g>
```

*(If you want the circle-line to correspond to a specific incidence triple, fix it to `{p1,p3,p5}` or whichever you choose — but make it **single and normative**. The important part is it is stable and referenced as a “line.”)*

---

# 8. Fixed-Point / Embedded Compatibility (MUST)

All coordinates are integers ≤ 1024, so:

- On microcontrollers, treat CU as **Q0 integer**
- Or optionally scale down by 4 for screen buffers

No trig needed. No floats.

---

## Quick sanity check
- All geometry fits in `[64,960]`
- Symmetry preserved
- Emission is deterministic
- Fano projection can be checked against incidence metadata even if the “circle line” isn’t collinear in Euclidean sense (because Fano incidence is projective, not Euclidean)
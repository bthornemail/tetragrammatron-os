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

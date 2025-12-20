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

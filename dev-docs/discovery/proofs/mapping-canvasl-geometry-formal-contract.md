# Mapping CanvasL → Geometry (Formal Contract)

This replaces Obsidian Canvas as the *authoritative mapping*.

## CanvasL → SVG

| CanvasL Concept | SVG Element |
|----------------|------------|
| Register       | `<g id="reg:axis:b:c">` |
| Point          | `<circle>` |
| Line / Fold    | `<line>` |
| Triad          | `<g class="fano-line">` |
| Projection     | `<g transform="…">` |
| Normalize      | element order + canonical coords |

### Example: Fano Triad
```xml
<g id="triad:state-alphabet-delta">
  <line data-op="MEET"/>
  <line data-op="JOIN"/>
  <line data-op="CANON"/>
</g>
```

---

## CanvasL → OBJ

| CanvasL | OBJ |
|-------|-----|
| Register | Object (`o reg_state_0_1`) |
| Point | Vertex (`v x y z`) |
| Line | Edge (`l a b`) |
| Fold | Transformation matrix |
| Normalize | Vertex ordering |

### Example: Tetrahedron (Merkaba half)
```obj
o tetra_left
v 0 0 1
v 1 0 0
v 0 1 0
v -1 -1 -1
f 1 2 3
f 1 2 4
f 1 3 4
f 2 3 4
```

---

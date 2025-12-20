# 3) Opcode table (Renderer Contract)

All opcodes are **1 byte**, followed by operands. Integer endianness = **big-endian** for multi-byte fields (matches your CLBC-POLY “network order” choice).

## 3.1 Projection barrier

### `0x60 PROJ_FANO dstReg, srcReg, flags`
**Meaning:** Project a computed state to the canonical Fano view and declare a new render frame context.

- Operands:
  - `dstReg` (u8): where the 7-point bitmap / incidence id set is stored
  - `srcReg` (u8): source state (poly or lattice state)
  - `flags` (u8): bitfield
    - bit0 `EMIT_LINES`
    - bit1 `EMIT_POINTS`
    - bit2 `EMIT_LABELS`
    - bit3 `EMIT_META_HASH`
    - bit4..7 reserved

**SVG effect:** none directly; it sets up the frame and determines which draw ops are legal next.

---

## 3.2 Draw primitives

### `0x70 DRAW_FANO_POINT pointId, styleId`
Emit point `p(pointId)` at canonical coords.

- `pointId` (u8): 0..6 (maps to p0..p6)
- `styleId` (u8): style table index (0 = default)

**SVG:**
```xml
<circle id="p{pointId}" cx="…" cy="…" r="10" class="stroke style-{styleId}"/>
```

---

### `0x71 DRAW_FANO_LINE lineId, styleId`
Emit straight Fano line `L(lineId)` as a `<line>`.

- `lineId` (u8): 0..6
- `styleId` (u8)

**SVG:**
```xml
<line id="L{lineId}" data-incidence="pA,pB,pC"
      x1="…" y1="…" x2="…" y2="…" class="stroke style-{styleId}"/>
```

> The renderer MUST use a fixed internal mapping:
> - `L0..L6` → endpoints `(p_i, p_j)` and incidence triple `{pA,pB,pC}`  
> - (The third point is semantic incidence; Euclidean collinearity is not required.)

---

### `0x72 DRAW_FANO_CIRCLE_LINE styleId`
Emit the “circle line”.

- `styleId` (u8)

**SVG:**
```xml
<circle id="Lcircle" data-incidence="p?,p?,p?"
        cx="512" cy="512" r="192" class="stroke style-{styleId}"/>
```

**Normative incidence for the circle-line**
Pick one triple and freeze it forever. Use:
- `data-incidence="p1,p3,p5"` (recommended, matches the “odd” triangle)

---

## 3.3 Labels (optional but deterministic)

### `0x73 LABEL_FANO_POINT pointId, labelStrId`
- `pointId` (u8) 0..6
- `labelStrId` (u16) index into a string table section

**SVG:**
```xml
<text data-label-for="p{pointId}" x="…" y="…" class="label">{string}</text>
```

Label position MUST be derived deterministically:
- `x = cx + 14`
- `y = cy - 14`

---

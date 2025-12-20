## Opcode → SVG Mapping (Normative)

This maps **CAN-ISA (Origami Fold VM)** instructions to **deterministic SVG primitives** using the **canonical 1024×1024 Fano coordinate system** I specified.

### Coordinate constants (baked into renderer)
- `p0..p6` coordinates are **fixed** (no runtime floats).
- `viewBox = 0 0 1024 1024`
- Circle-line: `cx=512 cy=512 r=192`

---

# 1) Execution model (what the renderer does)

The VM emits a **Render Event Stream** (RES). The SVG renderer is a pure function:

```
SVG = render(normalize(RES))
```

Normalization MUST:
1) sort items by type (lines → circle-line → points → labels),
2) sort by ids (`L0..L6`, then `p0..p6`),
3) emit attributes in fixed order.

This makes SVG byte-identical across ESP32/Pico/host.

---

# 2) Instruction classes

There are two layers:

1) **Fold/Polynomial ops** (MEET=GCD, JOIN=LCM, CANON, etc.)  
2) **Projection + Draw ops** (PROJ_FANO, DRAW_*) → SVG

Your request here is (2): “Opcode mapping”.

---

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

# 4) Style opcodes (stable CSS)

### `0x78 STYLE_DEFINE styleId, strokeW, pointR, flags`
- `styleId` (u8)
- `strokeW` (u8): default 4
- `pointR` (u8): default 10
- `flags` (u8):
  - bit0: dashed line
  - bit1: low-alpha (debug)
  - others reserved

**SVG effect:** emits/updates a `<style>` block (canonical ordering by `styleId`).

---

# 5) Frame / grouping opcodes

### `0x7E FRAME_BEGIN frameFlags`
- `frameFlags` (u8): same bits as PROJ_FANO flags

**SVG:** opens a `<g id="frameN">` group (N increments deterministically).

### `0x7F FRAME_END`
Closes current frame group.

---

# 6) Binary encoding (bit layout)

You asked for “full instruction binary encoding (bit layout) matching CLBC-POLY codec”. Here’s the **exact** rule for all render opcodes:

## 6.1 Instruction header (always)
```
byte0: OPCODE (u8)
```

## 6.2 Operand encoding rules
- u8: 1 byte
- u16: 2 bytes, **big-endian**
- No varints, no floats
- Any “immediate IDs” are u8 unless stated

### Example encodings

#### Emit p0 default style
```
70 00 00
^  ^  ^
|  |  +-- styleId=0
|  +----- pointId=0
+-------- DRAW_FANO_POINT
```

#### Emit L2 style 1
```
71 02 01
```

#### Emit circle-line style 0
```
72 00
```

#### Begin frame, emit meta hash + points + lines
```
7E 0B
```
(0b00001011 = meta + points + lines)

---

# 7) Required renderer lookup tables (fixed)

These MUST be hardcoded and identical across platforms.

## 7.1 Points table
`pointId → (x,y)` (from the previous spec)

## 7.2 Lines table
`lineId → incidence triple + endpoints`

You freeze a table like:

- `lineId` maps to:
  - `inc = (a,b,c)`  (three pointIds)
  - `endpoints = (a,b)` (two pointIds used for `<line>`)

> **Rule:** endpoints MUST be the lexicographically smallest pair in the triple (deterministic).

Example for a triple `{p0,p2,p4}`:
- endpoints = `(p0,p2)` (because (0,2) < (0,4) < (2,4))

This keeps every renderer identical.

---

# 8) Minimal “Fano-triad” draw program

To render one triad line + its 3 points:

```
7E 0B          ; FRAME_BEGIN (meta+points+lines)
60 01 00 03    ; PROJ_FANO r1 <- r0 flags=0x03 (emit points+lines)
71 00 00       ; DRAW_FANO_LINE L0 style0
70 00 00       ; DRAW_FANO_POINT p0 style0
70 02 00       ; DRAW_FANO_POINT p2 style0
70 04 00       ; DRAW_FANO_POINT p4 style0
7F             ; FRAME_END
```

## Appendix B — `imm16` Field Layouts (Normative)

This appendix **fully specifies** how the 16-bit immediate (`imm16`) is interpreted for **every opcode family** defined in RFC-009 / Appendix A.  
Anything not listed here **MUST be zero** and **MUST trap** in strict mode.

> **Invariant rule:**  
> `imm16` is always interpreted **big-endian bit numbering**  
> (`bit15` = MSB, `bit0` = LSB)

---

## B.1 Control & Canonicalization

### `OP_CANON (0x02)`
```
imm16 = 0x0000
```
- MUST be zero.
- Any non-zero value → **trap**

---

### `OP_COMMIT (0x03)`
```
imm16 layout:
bits 15..8   bits 7..0
[ profile ] [ flags  ]
```

| Bits | Name | Meaning |
|---|---|---|
| 15–8 | profile | Commit profile selector |
| 7–0 | flags | Commit flags |

**Profiles (recommended):**
- `0x00` → default (SHA-256 canonical hash)
- `0x01` → debug (include register labels)
- others reserved

**Flags:**
- bit0 → include renderer frame digest
- bit1 → include poly-weight summary
- others MUST be 0

---

## B.2 Immediate Construction (`I32` latch)

### `OP_LDI16H (0x10)`
```
imm16 = value
I32[31..16] := imm16
```

### `OP_LDI16L (0x11)`
```
imm16 = value
I32[15..0] := imm16
```

### `OP_USEI32 (0x12)`
```
imm16 = 0x0000
```
- MUST be zero
- Field selection happens via `B` only

---

## B.3 Polynomial Fold Algebra

### `OP_MEET_GCD (0x20)`
```
imm16 = 0x0000
```
- No flags allowed
- Deterministic gcd only

---

### `OP_JOIN_LCM (0x21)`
```
imm16 = 0x0000
```

---

### `OP_CLEAR (0x23)`
```
imm16 layout:
bits 15..4   bits 3..0
[ reserved ] [ mask   ]
```

| Mask bit | Meaning |
|---|---|
| bit0 | clear `poly_id` |
| bit1 | clear `str_id` |
| bit2 | clear `node_id` |
| bit3 | clear `mat_id` |

- Upper bits MUST be zero.

---

## B.4 Fano Projection & Geometry

### `OP_PROJ_FANO (0x30)`
```
imm16 layout:
bits 15..8     bits 7..0
[ omit_rule ] [ flags ]
```

**omit_rule (15..8):**
- `0x00` → omit minimal poly weight (canonical)
- `0x01` → omit explicit register index (encoded in flags[2..0])
- others reserved

**flags (7..0):**
| Bit | Meaning |
|---|---|
| 0 | emit circle-line |
| 1 | emit all 7 lines |
| 2 | emit all 7 points |
| 3 | attach semantic labels |
| 4 | emit weight annotation |
| 5 | emit incidence proof hash |
| 6–7 | reserved |

---

### `OP_EMIT_NODE (0x31)`
```
imm16 layout:
bits 15..12 11..8    7..0
[ style ] [ layer ] [ flags ]
```

| Field | Meaning |
|---|---|
| style | Node glyph style (renderer-defined) |
| layer | Z-layer (0 = base Fano plane) |
| flags | visual flags |

**flags:**
- bit0 → highlighted
- bit1 → ghosted
- bit2 → anchor
- others reserved

---

### `OP_EMIT_EDGE (0x32)`
```
imm16 layout:
bits 15..8   bits 7..0
[ from_idx ] [ to_idx ]
```

- Indices are **0..6** (Fano projection indices)
- Order matters unless edge_kind specifies undirected

---

### `OP_LIFT_3D (0x33)`
```
imm16 layout:
bits 15..12 11..8     7..0
[ space ] [ scale ] [ flags ]
```

| Field | Meaning |
|---|---|
| space | lift space (0=OBJ, 1=GLB, 2=SVG-Z) |
| scale | fixed-point scale exponent |
| flags | lift options |

**flags:**
- bit0 → generate normals
- bit1 → generate UVs
- bit2 → quantize vertices
- bit3 → embed provenance hash
- others reserved

---

## B.5 Assertions & Barriers

### `OP_ASSERT_CANON (0x40)`
```
imm16 = 0x0000
```

---

### `OP_ASSERT_IDEMPOTENT (0x41)`
```
imm16 = 0x0000
```
- Test kind selected by `B`

---

### `OP_ASSERT_FANO_TRIAD (0x42)`
```
imm16 layout:
bits 15..4  bits 3..0
[  zero   ] [ reg3  ]
```

- `reg3` ∈ 0..7
- Upper bits MUST be zero

---

## B.6 Timing / Analog Constraint Hooks (Reserved)

### `0x60..0x6F` (future)
```
imm16 layout (reserved):
bits 15..8   bits 7..0
[ source ] [ tolerance ]
```

These **MUST NOT** affect semantic state — assertions only.

---

## B.7 Strictness Rules (Mandatory)

1. Any opcode receiving a non-zero `imm16` in a field marked “MUST be zero” → **trap**
2. Any unknown flag bit → **trap**
3. All projections MUST be reproducible from `(opcode, A, B, imm16)` alone
4. `imm16` MAY NOT encode pointers, addresses, or time-dependent data

---

## Why this locks the system

- Every instruction is **bit-complete**
- No hidden semantics
- Determinism preserved across:
  - ESP32
  - Pico
  - Host Scheme VM
- Geometry, algebra, and proof all share the **same binary truth**

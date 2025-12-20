# RFC-0012 Appendix B — imm16 Field Layouts (Normative)

**Status:** Normative  
**Applies to:** RFC-0012 (CANB v1 Binary Encoding)  
**Mnemonic:** `CAN-BIT-TRUTH`

This appendix fully specifies how the 16-bit immediate (`imm16`) field is interpreted for every opcode defined in RFC-0009 Appendix A.

---

## B.1 General Rules

### B.1.1 Bit Numbering

`imm16` is always interpreted with **big-endian bit numbering**:
- `bit15` = MSB (most significant bit)
- `bit0` = LSB (least significant bit)

### B.1.2 Reserved Bits

Any bit field marked as "reserved" or "MUST be zero" SHALL:
- Be set to 0 during encoding
- Cause a trap/error if non-zero during decoding (strict mode)
- Be ignored in permissive mode (debug only)

### B.1.3 Validation

An implementation SHALL validate `imm16` according to opcode-specific rules. Invalid `imm16` values SHALL result in:
- Trap/error in strict mode
- Rejection of instruction in permissive mode

---

## B.2 Control Flow Opcodes

### NOOP (0x00)

```
imm16 = 0x0000
```

- **MUST be zero**
- Any non-zero value → trap

---

### HALT (0x01)

```
imm16 = 0x0000
```

- **MUST be zero**
- Any non-zero value → trap

---

## B.3 Canonicalization Opcodes

### CANON (0x10)

```
imm16 = 0x0000
```

- **MUST be zero**
- Any non-zero value → trap

---

### COMMIT (0x60)

```
imm16 layout:
bits 15..8   bits 7..0
[ profile ] [ flags  ]
```

| Bits | Name | Meaning |
|------|------|---------|
| 15–8 | profile | Commit profile selector |
| 7–0 | flags | Commit flags |

**Profiles:**
- `0x00` → default (SHA-256 canonical hash)
- `0x01` → debug (include register labels)
- `0x02..0xFF` → reserved

**Flags:**
- `bit0` → include renderer frame digest
- `bit1` → include poly-weight summary
- `bit2..7` → reserved (MUST be 0)

---

## B.4 Immediate Construction Opcodes

### LDI16H (0x40)

```
imm16 = value (high 16 bits)
```

- Direct value: `I32[31:16] := imm16`
- No restrictions (any 16-bit value allowed)

---

### LDI16L (0x41)

```
imm16 = value (low 16 bits)
```

- Direct value: `I32[15:0] := imm16`
- No restrictions (any 16-bit value allowed)

---

### USEI32 (0x42)

```
imm16 = 0x0000
```

- **MUST be zero**
- Field selection happens via `B` register only
- Any non-zero value → trap

---

## B.5 Lattice Operation Opcodes

### MEET_GCD (0x20)

```
imm16 = 0x0000
```

- **MUST be zero**
- No flags allowed
- Deterministic gcd only
- Any non-zero value → trap

---

### JOIN_LCM (0x21)

```
imm16 = 0x0000
```

- **MUST be zero**
- No flags allowed
- Deterministic lcm only
- Any non-zero value → trap

---

### SWAP (0x50)

```
imm16 = 0x0000
```

- **MUST be zero**
- Any non-zero value → trap

---

### CLEAR (0x51)

```
imm16 layout:
bits 15..4   bits 3..0
[ reserved ] [ mask   ]
```

| Mask bit | Meaning |
|----------|---------|
| bit0 | clear `poly_id` |
| bit1 | clear `str_id` |
| bit2 | clear `node_id` |
| bit3 | clear `mat_id` |

- Upper 12 bits (15..4) **MUST be zero**
- Any set bit in upper 12 bits → trap

---

## B.6 Fano Projection Opcodes

### PROJ_FANO (0x30)

```
imm16 layout:
bits 15..8     bits 7..0
[ omit_rule ] [ flags ]
```

**omit_rule (15..8):**
- `0x00` → omit minimal poly weight (canonical)
- `0x01` → omit explicit register index (encoded in flags[2..0])
- `0x02..0xFF` → reserved

**flags (7..0):**
| Bit | Meaning |
|-----|---------|
| 0 | emit circle-line |
| 1 | emit all 7 lines |
| 2 | emit all 7 points |
| 3 | attach semantic labels |
| 4 | emit weight annotation |
| 5 | emit incidence proof hash |
| 6–7 | reserved (MUST be 0) |

---

### EMIT_NODE (0x70)

```
imm16 layout:
bits 15..12 11..8    7..0
[ style ] [ layer ] [ flags ]
```

| Field | Bits | Meaning |
|-------|------|---------|
| style | 15..12 | Node glyph style (renderer-defined, 0..15) |
| layer | 11..8 | Z-layer (0 = base Fano plane, 0..15) |
| flags | 7..0 | Visual flags |

**flags:**
- `bit0` → highlighted
- `bit1` → ghosted
- `bit2` → anchor
- `bit3..7` → reserved (MUST be 0)

---

### EMIT_EDGE (0x71)

```
imm16 layout:
bits 15..8   bits 7..0
[ from_idx ] [ to_idx ]
```

- `from_idx` (15..8): Source Fano point index (0..6)
- `to_idx` (7..0): Destination Fano point index (0..6)
- Indices are in **Fano projection index space** (0..6)
- Order matters unless edge_kind specifies undirected

---

### LIFT_3D (0x72)

```
imm16 layout:
bits 15..12 11..8     7..0
[ space ] [ scale ] [ flags ]
```

| Field | Bits | Meaning |
|-------|------|---------|
| space | 15..12 | Lift space (0=OBJ, 1=GLB, 2=SVG-Z, 3..15 reserved) |
| scale | 11..8 | Fixed-point scale exponent (0..15) |
| flags | 7..0 | Lift options |

**flags:**
- `bit0` → generate normals
- `bit1` → generate UVs
- `bit2` → quantize vertices
- `bit3` → embed provenance hash
- `bit4..7` → reserved (MUST be 0)

---

## B.7 Assertion Opcodes

### ASSERT_CANON (0x80)

```
imm16 = 0x0000
```

- **MUST be zero**
- Any non-zero value → trap

---

### ASSERT_IDEMP (0x81)

```
imm16 layout:
bits 15..4  bits 3..0
[  zero   ] [ opcode ]
```

- Upper 12 bits (15..4) **MUST be zero**
- Lower 4 bits (3..0): Opcode selector for idempotence test
  - `0x0` = CANON (0x10)
  - `0x1` = PROJ_FANO (0x30)
  - `0x2` = MEET_GCD (0x20, with fixed partner `B`)
  - `0x3` = JOIN_LCM (0x21, with fixed partner `B`)
  - `0x4..0xF` → reserved

---

### ASSERT_FANO (0x82)

```
imm16 layout:
bits 15..4  bits 3..0
[  zero   ] [ reg3  ]
```

- Upper 12 bits (15..4) **MUST be zero**
- Lower 4 bits (3..0): Third register index (0..7)
- `reg3` ∈ {0..7} (semantic register indices)
- Any value > 7 in lower 4 bits → trap

---

## B.8 Time and Barrier Opcodes (RFC-0013)

### TIME_RD (0x64)

```
imm16 = 0x0000
```

- **MUST be zero**
- Any non-zero value → trap

---

### TIME_DIV (0x65)

```
imm16 = divisor
```

- Direct value: divisor for time quantization
- **MUST be > 0**
- Value of 0 → trap

---

### WAIT (0x66)

```
imm16 = offset (in ticks)
```

- Direct value: offset added to source register time value
- If `imm16 = 0`: cooperative yield (scheduling hook)
- Signed interpretation: values 0..32767 are positive, 32768..65535 are negative (two's complement)

---

### BARRIER_T (0x67)

```
imm16 = max_allowed_duration (in ticks)
```

- Direct value: maximum allowed duration for fold block
- **MUST be > 0**
- Value of 0 → trap
- Asserts: `(TICKS() - R[RSRC]) <= imm16`

---

## B.9 Strictness Rules (Mandatory)

1. Any opcode receiving a non-zero `imm16` in a field marked "MUST be zero" → **trap**
2. Any unknown flag bit set → **trap** (strict mode)
3. All projections MUST be reproducible from `(opcode, A, B, imm16)` alone
4. `imm16` MAY NOT encode:
   - Pointers
   - Addresses
   - Time-dependent data (except as specified in RFC-0013)
   - Floating-point values

---

## B.10 Round-Trip Encoding Requirement

For all opcodes, the following MUST hold:

```
Decode(Encode(opcode, A, B, imm16)) = (opcode, A, B, imm16)
```

This preserves RFC-0000 CAN-INV-3 (Decode/Encode Soundness).

---

**End of RFC-0012 Appendix B**


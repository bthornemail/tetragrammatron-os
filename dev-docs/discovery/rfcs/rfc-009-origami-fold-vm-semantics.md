# RFC-009 — Origami Fold VM Semantics  
## Section X — CANB v1 Binary Encoding, CLBC-POLY Alignment, and Deterministic Render Contract (Normative)

This section defines the normative **CanvasL Binary (CANB) v1** container and the **fixed-width instruction encoding** used by the Origami Fold VM. CANB v1 is designed to (a) preserve cross-platform determinism, (b) align polynomial payloads with the canonical **CLBC-POLY** codec, and (c) support mechanically reproducible SVG/OBJ/GLB derivations.

The key invariant is: **the VM’s semantic state is the 8-keyword register basis; all 7-point (Fano), tetrahedral, Merkaba, and higher projections are derived renderings**.

Normative terms are interpreted as in RFC 2119.

---

## X.1 Goals and Non-Goals

### X.1.1 Goals
Implementations **MUST**:
1. Encode a program as a deterministic byte sequence (`CANB`) with canonical ordering rules.
2. Reference polynomials using a canonical binary form aligned with **CLBC-POLY v1**.
3. Provide a fixed-width instruction encoding suitable for ESP32 and Pico-class MCUs.
4. Provide a deterministic renderer contract for SVG/OBJ/GLB outputs derived from VM commits.

### X.1.2 Non-Goals
This section does **NOT**:
- Define MQTT or transport wiring.
- Require any floating-point arithmetic at the bytecode or VM semantic layer.
- Require Obsidian canvas as a primary renderer.

---

## X.2 Determinism and Endianness Requirements

1. All multi-byte integers in CANB **MUST** be encoded **big-endian**.
2. The Origami Fold VM **MUST NOT** use floating-point arithmetic for semantic operations.
3. The VM state, when serialized for hashing or equality, **MUST** be in a canonical form (see `OP_CANON`).
4. All set-like insert operations in renderer streams (nodes/edges/faces) **MUST** be idempotent: re-inserting an identical item is a no-op.
5. If CRC32 is used (optional), it **MUST** be computed as specified in §X.3.1.

---

## X.3 CANB v1 Container Format

### X.3.1 CANB Header (16 bytes)

The CANB file begins with exactly 16 bytes:

| Offset | Size | Field | Meaning |
|---:|---:|---|---|
| 0  | 4  | `magic` | ASCII `"CANB"` |
| 4  | 1  | `version` | `0x01` |
| 5  | 1  | `flags` | bitmask (see below) |
| 6  | 2  | `header_len` | MUST be `0x0010` |
| 8  | 4  | `byte_len` | total file length in bytes |
| 12 | 4  | `crc32` | CRC32 of file bytes with this field treated as 0; 0 means “not present” |

`flags` bits:
- bit0 (`0x01`): STRTAB present
- bit1 (`0x02`): POLYTAB present
- bit2 (`0x04`): AVD present
- other bits: MUST be 0 in v1 and ignored on read

Readers **MUST** reject files where:
- `magic != "CANB"`
- `version != 0x01`
- `header_len != 0x0010`
- `byte_len` is inconsistent with actual file length

### X.3.2 Section TLV Format

After the header, the file contains a sequence of **Section TLVs**:

Section header (8 bytes):
- `u16 section_type`
- `u16 section_flags`
- `u32 section_len` (payload length in bytes)

Then `section_len` bytes of payload follow immediately.

Implementations **MUST** ignore unknown section types (forward compatibility), unless they are required by a VM profile.

### X.3.3 Section Types (v1)

The following `section_type` values are defined:

- `0x0001` STRTAB — canonical string table (§X.4)
- `0x0002` POLYTAB — CLBC-POLY blobs (§X.5)
- `0x0003` PROG — instruction stream (§X.6)
- `0x0004` AVD — audio/video multiplex metadata (§X.9, optional)

A CANB file intended for execution **MUST** include `PROG`.

---

## X.4 STRTAB — Canonical String Table (0x0001)

If present, STRTAB payload is:

- `u32 count`
- repeated `count` entries:
  - `u32 str_id`
  - `u32 byte_len`
  - `byte[byte_len] utf8_nfc`
  - `u8 0x00` terminator

Rules:
1. Strings **MUST** be NFC-normalized UTF-8.
2. Entries **MUST** be sorted by `str_id` ascending.
3. `byte_len` **MUST NOT** include the terminator byte; the terminator **MUST** still be present.

---

## X.5 POLYTAB — CLBC-POLY Alignment (0x0002)

POLYTAB provides canonical polynomial payloads aligned with the **CLBC-POLY v1** codec.

Payload:
- `u32 count`
- repeated `count` entries:
  - `u32 poly_id`
  - `u32 byte_len`
  - `byte[byte_len] clbc_poly_blob`
  - `u8 0x00` terminator

Rules:
1. `clbc_poly_blob` **MUST** be encoded using the canonical CLBC-POLY v1 codec.
2. Entries **MUST** be sorted by `poly_id` ascending.
3. `byte_len` **MUST NOT** include the terminator byte; the terminator **MUST** still be present.

A VM that executes polynomial fold semantics **MUST** treat POLYTAB as read-only immutable data.

---

## X.6 PROG — Instruction Stream (0x0003)

### X.6.1 Fixed-Width Instruction Encoding

In CANB v1, every instruction is exactly **32 bits**:

```
bits:  31..24   23..20   19..16   15..0
       opcode    A        B        imm16
```

- `opcode` : u8
- `A` : u4 (register / channel / target)
- `B` : u4 (register / channel / target)
- `imm16` : u16 (immediate; opcode-specific)

Rules:
1. PROG payload length **MUST** be a multiple of 4 bytes.
2. Instructions **MUST** be interpreted in order; the VM **MUST** be deterministic with respect to the byte stream.
3. The VM **MUST** reject reserved or undefined opcode values unless running in a permissive “ignore-unknown” mode (not RECOMMENDED for consensus).

### X.6.2 The Semantic 8 Registers (Keyword Basis)

The Origami Fold VM defines exactly 8 semantic registers. Their numeric IDs are fixed:

| reg_id | keyword |
|---:|---|
| 0 | `states` |
| 1 | `alphabet` |
| 2 | `left_marker` |
| 3 | `right_marker` |
| 4 | `transition` |
| 5 | `start` |
| 6 | `accept` |
| 7 | `reject` |

Implementations **MUST** use these identifiers for all projection and merge semantics. Implementations **MUST NOT** substitute symbolic glyphs (e.g., `Σ`, `δ`) at the bytecode level.

### X.6.3 32-bit Immediate Construction (u32 IDs)

Because the instruction word contains only a 16-bit immediate, CANB defines a deterministic u32 immediate latch.

The VM maintains a single u32 latch `I32`.

Opcodes:
- `0x10 OP_LDI16H`: `I32[31:16] := imm16`
- `0x11 OP_LDI16L`: `I32[15:0]  := imm16`
- `0x12 OP_USEI32`: moves `I32` into a register field determined by `B`

`OP_USEI32` interpretation:
- `A` = destination register (0..7)
- `B` = destination kind:
  - 0: `reg[A].poly_id := I32`
  - 1: `reg[A].str_id := I32`
  - 2: `reg[A].node_id := I32`
  - 3: `reg[A].mat_id := I32`

Rule: The latch **MUST** persist until overwritten.

---

## X.7 Origami Fold Semantics (Polynomial Meet/Join)

Each semantic register contains, at minimum, a `poly_id` referencing POLYTAB.

### X.7.1 Canonicalization

- `0x02 OP_CANON`  
  The VM **MUST** normalize its state to a canonical form. Applying `OP_CANON` twice **MUST** be a fixed point:

> `CANON(CANON(s)) = CANON(s)`  (idempotence)

Canonicalization **MUST** include:
1. Polynomial normalization (as defined by the CLBC-POLY canonical decode/encode rules).
2. Any VM-internal caches **MUST NOT** affect canonical state.

### X.7.2 Meet (GCD) and Join (LCM)

- `0x20 OP_MEET_GCD A=dstReg B=srcReg imm16=0`  
  Semantics:  
  `reg[A].poly := gcd(reg[A].poly, reg[B].poly)` over the configured polynomial ring (default F₂[x]).

- `0x21 OP_JOIN_LCM A=dstReg B=srcReg imm16=0`  
  Semantics:  
  `reg[A].poly := lcm(reg[A].poly, reg[B].poly)` over the configured polynomial ring (default F₂[x]).

Rules:
1. GCD/LCM operations **MUST** be deterministic and produce canonical polynomials (as if re-encoded by CLBC-POLY).
2. `MEET` and `JOIN` **MUST** be idempotent with respect to canonicalization:
   - `gcd(p, p) = p`
   - `lcm(p, p) = p`
3. Implementations **MUST** treat `poly_id` as references; however, results **MAY** be interned into a local polynomial store, provided canonical bytes match.

---

## X.8 Deterministic Derived Rendering Contract (SVG/OBJ/GLB)

Rendering is **derived** from VM commits. The bytecode does not “become” geometry; it **derives** geometry deterministically from canonical state.

### X.8.1 Commit Barrier

- `0x03 OP_COMMIT`  
  The VM **MUST**:
1. Apply canonicalization equivalent to `OP_CANON` before emitting.
2. Produce a deterministic commit hash over canonical state (exact hash algorithm specified by the VM profile; SHA-256 RECOMMENDED).
3. Emit a render frame boundary event to the renderer pipeline.

### X.8.2 Fano Projection Operator

- `0x30 OP_PROJ_FANO A=frameChan B=0 imm16=flags`

Flags:
- bit0: include circle-line
- bit1: include all 7 Fano lines
- bit2: include all 7 Fano points
- bit3: attach labels from semantic keywords (RECOMMENDED)

**Normative constraint:** the VM has 8 semantic registers but the Fano plane has 7 points. Therefore a deterministic omission rule is required.

#### X.8.2.1 Omission Rule (8 → 7)
The projection **MUST** omit exactly one register `omit` determined by:

1. Compute `w(r) = weight(reg[r].poly)` (Hamming weight in coefficient space)  
2. Choose `omit = argmin_r (w(r), r)` with tie broken by smallest `r`.

The projected point set is the ordered list of the remaining 7 registers in increasing `reg_id` order.

This rule ensures:
- stable projection under replay
- stable projection across devices
- projection is a pure function of canonical state

### X.8.3 Canonical Integer Coordinate System

All derived geometry **MUST** be computed on an integer fixed-point grid.

- Coordinate unit: **millipoint**  
  `1 millipoint = 1/1000 SVG px` and `1/1000 world unit` for 3D lifts.

The canonical 7-point Fano layout in millipoints is:

- p0 = (512000, 256000)
- p1 = (707000, 369000)
- p2 = (707000, 655000)
- p3 = (512000, 768000)
- p4 = (317000, 655000)
- p5 = (317000, 369000)
- p6 = (512000, 512000)

Renderers:
- SVG renderer **MUST** output coordinates by dividing by 1000 at serialization time only.
- OBJ/GLB lift **MUST** treat these integer coordinates as authoritative, using fixed deterministic scaling.

### X.8.4 OBJ/MTL and GLB Lift Rules

1. GLB (glTF 2.0 binary) is the preferred high-order 3D artifact.
2. OBJ+MTL is a reduction target.

Lift rules (minimum):
- Each projected node becomes a scene node with translation `(x/1000, y/1000, z)` where `z` is derived deterministically from either:
  - the original semantic `reg_id`, or
  - fold depth counter, if present in VM profile
- Each derived edge becomes either:
  - a polyline mesh, or
  - a cylinder segment with deterministic tessellation

Materials:
- Materials **MUST** be deterministically assigned (e.g., by `reg_id` or by canonical palette table).
- Material names **SHOULD** be sourced from STRTAB.

---

## X.9 Optional: AVD Section (0x0004) — Multiplex Metadata

If present, AVD declares multiplexed derived channels (e.g., waveform/audio, SVG frames, GLB frames). AVD is informational and **MUST NOT** affect VM semantics.

Implementations **MAY** treat AVD as a future-proof container analogous to a deterministic mux, where:
- PROG remains the semantic source of truth
- POLYTAB/STRTAB are immutable lookup tables
- derived media are reproducible products tied to `OP_COMMIT` boundaries

---

## X.10 Minimum Conformance Profile (Origami Fold VM v1)

An implementation conforms to this section if it:

1. Reads/writes CANB v1 header and sections per §X.3.
2. Enforces STRTAB and POLYTAB ordering/canonicalization per §X.4–§X.5.
3. Executes PROG with 32-bit fixed-width decode per §X.6.
4. Implements `OP_CANON`, `OP_MEET_GCD`, `OP_JOIN_LCM`, and `OP_COMMIT` per §X.7–§X.8.
5. Implements `OP_PROJ_FANO` with the omission rule and fixed integer coordinate layout per §X.8.

---

If you want, I can immediately follow this with the **exact opcode table appendix** (hex → name → operand meanings) written in the same RFC voice, using your semantic keywords everywhere (no symbols), and aligned to your existing CAN-ISA / CLBC naming conventions.

---

## You

Yes

---

## ChatGPT

## Appendix A — Origami Fold VM v1 Opcode Table (Normative)

This appendix defines the **minimum** opcode set required by RFC-009 §X (CANB v1 + Origami Fold VM). All opcodes are **1 byte** and executed in **32-bit fixed-width instructions**:

```
bits:  31..24   23..20   19..16   15..0
       opcode    A        B        imm16
```

### A.1 Register IDs (Semantic 8-Tuple Basis)

`A` and `B` fields that refer to semantic registers **MUST** use:

| reg_id | keyword |
|---:|---|
| 0 | states |
| 1 | alphabet |
| 2 | left_marker |
| 3 | right_marker |
| 4 | transition |
| 5 | start |
| 6 | accept |
| 7 | reject |

---

## A.2 Core Control and Canonicalization

### `0x00 OP_NOOP`
- **Format:** `opcode=0x00, A=*, B=*, imm16=*`
- **Semantics:** No effect.

### `0x01 OP_HALT`
- **Format:** `opcode=0x01`
- **Semantics:** Stop execution successfully at current PC.

### `0x02 OP_CANON`
- **Format:** `opcode=0x02`
- **Semantics (Normative):**
  - Canonicalize VM semantic state.
  - **Idempotence MUST hold:** `CANON(CANON(s)) = CANON(s)`.
  - Canonicalization MUST include CLBC-POLY canonical form for any resident polynomials.

### `0x03 OP_COMMIT`
- **Format:** `opcode=0x03, A=frame_chan, B=0, imm16=commit_flags`
- **Operands:**
  - `A` = frame channel (0..15) (renderer output lane)
  - `imm16` = flags (profile-defined; v1 recommends `0`)
- **Semantics (Normative):**
  1. Implicitly perform `OP_CANON`.
  2. Compute deterministic commit hash over canonical semantic state (profile-defined hash; SHA-256 RECOMMENDED).
  3. Emit a deterministic “frame boundary” event to the renderer contract.

---

## A.3 32-bit Immediate Construction (I32 latch)

The VM maintains a 32-bit latch `I32` for loading u32 IDs (poly_id, str_id, node_id, etc.).

### `0x10 OP_LDI16H`
- **Format:** `opcode=0x10, imm16=value`
- **Semantics:** `I32[31:16] := imm16`

### `0x11 OP_LDI16L`
- **Format:** `opcode=0x11, imm16=value`
- **Semantics:** `I32[15:0] := imm16`

### `0x12 OP_USEI32`
- **Format:** `opcode=0x12, A=dst_reg, B=kind, imm16=0`
- **Operands:**
  - `A` = destination semantic register (0..7)
  - `B` = destination kind:
    - `0` → `reg[A].poly_id := I32`
    - `1` → `reg[A].str_id  := I32`
    - `2` → `reg[A].node_id := I32`
    - `3` → `reg[A].mat_id  := I32`
- **Semantics:** Assign latched u32 to the selected field.
- **Rules:**
  - Unknown `B` kinds MUST trap (unless permissive mode).

---

## A.4 Polynomial Fold Algebra (Meet/Join)

All polynomial operations are performed in the configured ring (default **F₂[x]**) and MUST be deterministic.

### `0x20 OP_MEET_GCD`
- **Format:** `opcode=0x20, A=dst_reg, B=src_reg, imm16=0`
- **Semantics:**  
  `reg[A].poly := gcd(reg[A].poly, reg[B].poly)`
- **Required properties:**
  - `gcd(p,p)=p`
  - Result MUST be in CLBC-POLY canonical form (as-if re-encoded).

### `0x21 OP_JOIN_LCM`
- **Format:** `opcode=0x21, A=dst_reg, B=src_reg, imm16=0`
- **Semantics:**  
  `reg[A].poly := lcm(reg[A].poly, reg[B].poly)`
- **Required properties:**
  - `lcm(p,p)=p`
  - Result MUST be in CLBC-POLY canonical form.

### `0x22 OP_SWAP`
- **Format:** `opcode=0x22, A=reg1, B=reg2, imm16=0`
- **Semantics:** Swap the entire semantic-register payloads of `reg[A]` and `reg[B]`.

### `0x23 OP_CLEAR`
- **Format:** `opcode=0x23, A=reg, imm16=clear_mask`
- **Operands:** `imm16` bitmask:
  - bit0: clear `poly_id`
  - bit1: clear `str_id`
  - bit2: clear `node_id`
  - bit3: clear `mat_id`
- **Semantics:** Clears selected fields deterministically.

---

## A.5 Fano Projection and Geometry Emission

### `0x30 OP_PROJ_FANO`
- **Format:** `opcode=0x30, A=frame_chan, B=0, imm16=proj_flags`
- **Semantics (Normative):**
  - Derive a 7-point Fano projection from the 8 semantic registers using the RFC-009 omission rule:
    - compute `w(r)=weight(reg[r].poly)`
    - omit `argmin (w(r), r)`
  - Emit nodes/edges for the Fano plane into renderer channel `A`.
- **Flags (`imm16`):**
  - bit0: emit circle-line
  - bit1: emit all 7 lines
  - bit2: emit all 7 points
  - bit3: attach keyword labels (RECOMMENDED)
  - others reserved (MUST be 0 in v1)

### `0x31 OP_EMIT_NODE`
- **Format:** `opcode=0x31, A=frame_chan, B=reg, imm16=node_flags`
- **Semantics:** Emit a node derived from `reg[B]` into channel `A`.  
  Used for per-axis canvases / partial projections.
- **Rule:** Emission MUST be idempotent per (node_id, frame_chan).

### `0x32 OP_EMIT_EDGE`
- **Format:** `opcode=0x32, A=frame_chan, B=edge_kind, imm16=packed`
- **Operands:**
  - `B` selects edge derivation kind (profile-defined)
  - `imm16` packs two 8-bit indices (hi=from, lo=to) into the **current 7-point projection index space** (0..6).
- **Rule:** Emission MUST be idempotent per (from,to,kind,frame_chan).

### `0x33 OP_LIFT_3D`
- **Format:** `opcode=0x33, A=frame_chan, B=lift_kind, imm16=lift_flags`
- **Semantics:** Lift the most recent 2D derived frame to a 3D representation (OBJ/GLB contract layer).
- **Rule:** MUST use fixed-point integer coordinate rules (RFC-009 §X.8.3–§X.8.4).

---

## A.6 Barriers and Consistency Checks

These opcodes do **not** change semantic state except by trapping on failure.

### `0x40 OP_ASSERT_CANON`
- **Format:** `opcode=0x40`
- **Semantics:** Trap unless state is already canonical (as defined by `OP_CANON`).

### `0x41 OP_ASSERT_IDEMPOTENT`
- **Format:** `opcode=0x41, A=reg, B=test_kind, imm16=0`
- **Test kinds:**
  - `B=0`: assert `gcd(p,p)=p` for `reg[A]`
  - `B=1`: assert `lcm(p,p)=p` for `reg[A]`
- **Semantics:** Trap on failure.

### `0x42 OP_ASSERT_FANO_TRIAD`
- **Format:** `opcode=0x42, A=reg1, B=reg2, imm16=reg3_in_low_nibble`
- **Encoding:**
  - `imm16 & 0x000F` is `reg3` (0..7)
- **Semantics:** Trap unless the three selected registers satisfy the VM’s Fano-triad predicate (profile-defined).  
  v1 RECOMMENDS: all pairwise gcd are non-trivial (not equal to 1) after canonicalization.

---

## A.7 Reserved Ranges (v1)

- `0x50..0x5F` reserved for “origami fold axioms” expansions (A1..A7) once you decide which must be primitive vs derived.
- `0x60..0x6F` reserved for timing/clock constraints (crystal/analog barrier hooks) as pure **assertions**, not semantics (so determinism is preserved).
- `0x70..0x7F` reserved for multiplex/stream controls (AVD integration).

Readers/executors:
- MUST trap on encountering an unknown opcode in strict mode.
- MAY ignore unknown opcodes only in a non-consensus debug profile.

---

If you want the next step as “**bit layout for each opcode’s immediates**” (so every imm16 is precisely specified, including packing of poly_id references, node IDs, and renderer channels), say **“imm16 layouts”** and I’ll lock it down as Appendix B.

---

## You

Imm16 layouts

---

## ChatGPT

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

---

### If you want next:
- **Appendix C:** Binary `.canbc` container layout  
- **Appendix D:** Scheme assembler enforcing these layouts  
- **Appendix E:** SVG → OBJ → GLB lift math (exact coordinates)

Just say the letter.

---

## You

D

---

## ChatGPT

## Appendix D — Scheme Assembler (Normative) for `CAN-ISA` + `imm16` Layout Enforcement

This appendix defines a **mechanical** Scheme assembler that:

1. Parses a small S-expression assembly syntax
2. Encodes **exact 32-bit instructions** (`opcode8 | A4 | B4 | imm16`)
3. Enforces **all `imm16` layouts** from Appendix B (trap on violations)
4. Emits a `.canbc` *byte stream* (container TBD in Appendix C; this emits the raw instruction stream)

Everything here is designed to drop into your repo as `src/asm/can_asm.scm`.

---

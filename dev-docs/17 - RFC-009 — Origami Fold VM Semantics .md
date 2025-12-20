
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

**Detailed specification:** See RFC-0011 §6.9.2 for canonicalization algorithm, idempotence enforcement (INV-1), and CLBC-POLY frame requirements.

**Dual invariants:** See RFC-0011 §6.10.4 for dual-normalization equivalence requirements.

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

**Detailed specification:** See RFC-0011 §6.5 for STRICT_FANO validation (S1-S4 checks), error codes, and WEAK_FANO mode.

**Mathematical definition:** See RFC-0011 §5.3 for Fano Triad Predicate formalization.

**Dual invariants:** See RFC-0011 §6.10.3 for primal-dual symmetry and vertex-edge duality requirements.

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

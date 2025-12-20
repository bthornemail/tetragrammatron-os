# CANB v1 — Bit-level Instruction Encoding (RFC-009 Addendum)

## 0. Fixed basis: the 8 semantic registers

Register IDs are fixed and MUST NOT change:

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

Everything (7-point projections, triads, faces, tetrahedra, merkaba, etc.) MUST be computable as a pure function of these 8 registers + program stream.

---

## 1. Endianness + determinism rules

- All multi-byte integers are **big-endian**.
- All floats are **forbidden** at the bytecode layer.
- All IDs are stable **u32**.
- Any set-like operation (add point, add edge, add face) MUST be **idempotent** (re-adding same item is a no-op).

---

## 2. File container (CANB)

### 2.1 Header (16 bytes)

| Offset | Size | Name | Value |
|---:|---:|---|---|
| 0 | 4 | magic | ASCII `"CANB"` |
| 4 | 1 | version | `0x01` |
| 5 | 1 | flags | bit0=has_strings, bit1=has_poly, bit2=has_audio, others=0 |
| 6 | 2 | header_len | `0x0010` |
| 8 | 4 | byte_len | total file length in bytes |
| 12 | 4 | crc32 | CRC32 of bytes `[0..byte_len)` with crc field zeroed (optional; 0 means “not present”) |

### 2.2 Sections (TLV)
After header: repeated **Section TLVs**:

**Section header (8 bytes):**
- `u16 section_type`
- `u16 section_flags`
- `u32 section_len` (payload length)

Section payload bytes follow immediately.

#### Section types (v1)
- `0x0001` STRTAB (string table, canonical UTF-8)
- `0x0002` POLYTAB (CLBC-POLY blobs, canonical)
- `0x0003` PROG (instruction stream)
- `0x0004` AVD (audio/video mux descriptors) *(optional, future-proofed now)*

---

## 3. STRTAB (0x0001)

Canonical string table for labels, debug names, material names, etc.

Payload:
- `u32 count`
- repeated `count` entries:
  - `u32 str_id`
  - `u32 byte_len`
  - `byte[byte_len] utf8` (MUST be NFC-normalized UTF-8)
  - `u8 0x00` terminator (included in encoding for determinism)

Rule: entries MUST be sorted by `str_id` ascending.

---

## 4. POLYTAB (0x0002) — CLBC-POLY aligned

Payload:
- `u32 count`
- repeated `count` entries:
  - `u32 poly_id`
  - `u32 byte_len`
  - `byte[byte_len] clbc_poly_blob` (your canonical CLBC-POLY v1 encoding)
  - `u8 0x00` terminator

Rule: entries sorted by `poly_id` ascending.

This is where your **GCD/LCM fold semantics** live without changing PROG encoding.

---

## 5. PROG (0x0003) — Instruction stream

### 5.1 Instruction word (fixed 32-bit)

Every instruction is exactly **32 bits**:

```
31..24   23..20   19..16   15..0
opcode   A        B        imm16
```

- `opcode` : u8
- `A` : u4 (register / channel / target)
- `B` : u4 (register / channel / target)
- `imm16` : u16 (immediate; interpretation depends on opcode)

**Why fixed 32-bit?**
- ESP32/Pico decode fast
- deterministic alignment
- still gives you 16-bit immediates (IDs are loaded via LDI32)

### 5.2 Extending to u32 immediates

Use `LDI32` to load 32-bit constants into a small constant latch:

- `OP_LDI16H` loads high 16 bits
- `OP_LDI16L` loads low 16 bits
- `OP_USEI32` consumes the assembled u32 for operations requiring IDs

This avoids variable-length instructions while keeping u32 IDs.

---

## 6. Opcode set v1 (minimal vertical slice)

### 6.1 Core state + determinism

- `0x01 OP_NOP`  
  no-op

- `0x02 OP_CANON`  
  Normalize VM state (idempotent). MUST be a fixed point: `CANON(CANON(s)) = CANON(s)`.

- `0x03 OP_COMMIT`  
  Emits a deterministic frame boundary (for replay + renderer). The VM MUST output a commit hash over canonical state.

### 6.2 32-bit immediate builder

- `0x10 OP_LDI16H A=dstLatch imm16=hi`
- `0x11 OP_LDI16L A=dstLatch imm16=lo`
- `0x12 OP_USEI32 A=dstReg B=dstKind imm16=0`  
  Moves latched u32 into a destination:
  - if `dstKind=0`: sets `reg[dstReg].poly_id = latched`
  - if `dstKind=1`: sets `reg[dstReg].str_id = latched`
  - if `dstKind=2`: sets `reg[dstReg].node_id = latched` (geometry object id)
  - if `dstKind=3`: sets `reg[dstReg].mat_id = latched`

### 6.3 Polynomial fold ops (your “origami” core)

Operate on **poly_id** fields attached to registers.

- `0x20 OP_MEET_GCD A=dstReg B=srcReg imm16=0`  
  `reg[A].poly = gcd(reg[A].poly, reg[B].poly)` (idempotent meet)

- `0x21 OP_JOIN_LCM A=dstReg B=srcReg imm16=0`  
  `reg[A].poly = lcm(reg[A].poly, reg[B].poly)` (idempotent join)

- `0x22 OP_SWAP A=reg B=reg`  
  swap register payloads (poly_id, str_id, node_id, mat_id)

### 6.4 Projection ops (derived geometry)

These DO NOT create new semantics—only derived render state.

- `0x30 OP_PROJ_FANO A=frameChan B=0 imm16=flags`
  - flags bit0: include circle-line
  - flags bit1: include all 7 Fano lines
  - flags bit2: include all 7 Fano points
  - flags bit3: label points from STRTAB via reg keywords (recommended)

Projection uses the 8-register state as input. Deterministic mapping MUST be specified in renderer contract (next section).

### 6.5 Render stream ops (SVG/OBJ/GLB bridge)

These create render-graph events (idempotent).

- `0x40 OP_STYLE A=styleId B=target imm16=0`
  - target: 0=lines,1=points,2=faces,3=labels,4=materials

- `0x41 OP_DRAW_EDGE A=u4src B=u4dst imm16=edgeStyle`
  - Adds edge between node_id(reg[A]) and node_id(reg[B])

- `0x42 OP_DRAW_NODE A=reg B=shape imm16=style`
  - shape: 0=point,1=marker,2=instance

- `0x43 OP_LABEL A=reg B=0 imm16=labelStyle`
  - label text MUST be `keyword(reg[A])` unless overridden via `reg[A].str_id`

---

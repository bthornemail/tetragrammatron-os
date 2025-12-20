# RFC-0012 — Origami Fold VM Semantics and CANB v1 Encoding

Status: Proposed (Normative VM + Compiler Contract)

## 1. Purpose

Defines:
- Fold VM semantics: CANON, MEET(GCD), JOIN(LCM), PROJ_FANO, ASSERT_IDEMP, COMMIT, EMIT_GEOM
- Fixed-width 16-byte instruction encoding (CANB v1)
- Object pool referencing compatible with CLBC-POLY canonical blobs
- Determinism and proof-carrying hooks

## 2. Data model

VM operates on tagged objects:
- POLY: canonical F₂[x] polynomial encoded with CLBC-POLY v1
- TRIADS: compact triad witness
- HASH: commit digest bytes
- GEOM: renderer events (SVG/OBJ/GLB events), deterministic

## 3. Instruction set (minimal vertical slice)

Opcodes:
- 0x10 CANON        normalize object
- 0x20 MEET         gcd/meet
- 0x21 JOIN         lcm/join
- 0x30 PROJ_FANO    project + validate triads
- 0x31 ASSERT_IDEMP assert idempotence for a selected op
- 0x40 COMMIT       commit hash + witness
- 0x50 EMIT_GEOM    emit renderer events

## 4. CANB v1 instruction encoding (16 bytes, fixed width)

All integers are big-endian.

Offset Size Field
0      4    MAGIC  = "CANB" (0x43 0x41 0x4E 0x42)
4      1    VER    = 0x01
5      1    OPCODE
6      1    FLAGS
7      1    RDST
8      1    RA
9      1    RB
10     2    IMM16
12     4    REF32

FLAGS bit layout:
- bit0 CANON_IN
- bit1 CANON_OUT
- bit2 PROOF_REQUIRED
- bit3 EMIT
- bit4..7 reserved (MUST be 0)

Registers are 0..255.
REF32 indexes the object pool or stream offset per container format.

## 5. Semantics (Normative)

### 5.1 CANON (0x10)
Rdst := canon(Ra)
If FLAGS.CANON_IN is set, input MUST already be canonical.
If FLAGS.CANON_OUT is set, output MUST be canonical (VM MUST enforce).

### 5.2 MEET (0x20)
Rdst := gcd(Ra, Rb)
Inputs MUST be POLY (canonical if PROOF_REQUIRED).
Output MUST be canonical POLY.

### 5.3 JOIN (0x21)
Rdst := lcm(Ra, Rb)
Same requirements as MEET.

### 5.4 PROJ_FANO (0x30)
Rdst := proj_fano(Ra)
proj_fano produces (poly', triads) and MUST enforce fano_valid(triads) if PROOF_REQUIRED.

### 5.5 ASSERT_IDEMP (0x31)
Asserts op(op(x)) = op(x) on the current register x=Ra.
IMM16 selects op:
- 0x0010 CANON
- 0x0030 PROJ_FANO
- 0x0020 MEET (uses RB)
- 0x0021 JOIN (uses RB)

If assertion fails, VM MUST halt with error.

### 5.6 COMMIT (0x40)
Computes and stores a commit hash for Ra and attaches triad witness if present.
If PROOF_REQUIRED, commit MUST include witness and the witness MUST validate.

### 5.7 EMIT_GEOM (0x50)
Emits deterministic renderer events derived from Ra:
- Either direct Fano projection rendering
- Or canonical geometry events from POLY/triads

## 6. Object pool and CLBC-POLY compatibility

When REF32 references a POLY blob, the blob MUST be encoded using CLBC-POLY v1 canonical encoding.
VM MUST reject non-canonical blobs when PROOF_REQUIRED is set.

## 7. Compiler contract

Pipeline:
repo.canvasl (YAML) → canonical JSON → JSONL IR → CANB bytecode (+ embedded canonical POLY blobs)

Determinism:
Given identical canonical JSON input, the compiler MUST produce byte-identical JSONL and CANB.
```

---

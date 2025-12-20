# RFC-0012 — Origami Fold VM, Binary Encoding, and Proof-Carrying Compilation

## Status
**Proposed / Normative VM + compiler contract**

## 1. Purpose
RFC-0012 defines:

1. A **Fold VM** instruction set (CAN-ISA subset) that executes:
   - canonicalization
   - meet/join lattice ops
   - Fano projection checks
2. A **binary instruction encoding**
3. A **compiler contract**:
   - YAML front matter → canonical JSON → JSONL IR → bytecode
4. A proof target:
   - execution preserves invariants and is deterministic

---

## 2. Data Model (Execution Objects)

The VM operates on three object families:

- `POLY`: canonical F₂[x] polynomial object (CLBC-POLY codec)
- `TRIADS`: compact triad set encoding
- `GEOM`: renderer events derived from canonical state (SVG/OBJ/GLB targets)

---

## 3. Instruction Set (Normative Subset)

The minimal vertical slice instructions are:

- `CANON` — normalize object to canonical form
- `MEET` — gcd/meet of polynomials (or meet in lattice)
- `JOIN` — lcm/join of polynomials (or join in lattice)
- `PROJ_FANO` — project + validate triad consistency
- `ASSERT_IDEMP` — verify op is idempotent on current state
- `COMMIT` — commit state hash + triad proof witness
- `EMIT_GEOM` — emit canonical geometry events

---

## 4. Binary Instruction Encoding (Matches CLBC-POLY Design Principles)

### 4.1 Endianness
All multi-byte integers are **big-endian**.

### 4.2 Instruction word
Each instruction is 16 bytes (fixed width) to be MCU-friendly and streamable.

```
Offset  Size  Field
0       4     MAGIC  = "CANB"   (0x43 0x41 0x4E 0x42)
4       1     VER    = 0x01
5       1     OPCODE
6       1     FLAGS
7       1     Rdst
8       1     Ra
9       1     Rb
10      2     IMM16
12      4     REF32
```

### 4.3 Field semantics
- `FLAGS` bit layout:
  - bit0: `CANON_IN`
  - bit1: `CANON_OUT`
  - bit2: `PROOF_REQUIRED`
  - bit3: `EMIT`
  - bit4..7: reserved (MUST be 0)

- `Rdst`, `Ra`, `Rb`: register indices 0..255
- `IMM16`: immediate parameter (opcode-specific)
- `REF32`: reference into the object pool / stream offset

### 4.4 Object pool rule (CLBC-like)
Bytecode streams MAY embed CLBC-POLY objects as **framed blobs**, addressed by `REF32`.
Objects MUST be in canonical encoding (CLBC-POLY v1).

---

## 5. Opcode Table (RFC-0012)

| Opcode | Mnemonic     | Semantics |
|-------:|--------------|----------|
| 0x10   | CANON        | normalize object in `Ra` → `Rdst` |
| 0x20   | MEET         | `Rdst := gcd(Ra,Rb)` (or meet) |
| 0x21   | JOIN         | `Rdst := lcm(Ra,Rb)` (or join) |
| 0x30   | PROJ_FANO    | `Rdst := proj_fano(Ra)` + validate triads |
| 0x31   | ASSERT_IDEMP | assert `op(op(x)) = op(x)` for op indicated by `IMM16` |
| 0x40   | COMMIT       | commit hash + attach triad witness |
| 0x50   | EMIT_GEOM    | emit renderer events for `Ra` |

`IMM16` for `ASSERT_IDEMP` selects the operator:
- 0x0010 = CANON
- 0x0030 = PROJ_FANO
- 0x0020 = MEET (with fixed partner `Rb`)
- 0x0021 = JOIN (with fixed partner `Rb`)

---

## 6. VM State

Registers hold tagged values:

- `POLY`
- `TRIADS`
- `HASH`
- `GEOM_EVT`

VM MUST reject any untagged or non-canonical object when `PROOF_REQUIRED` is set.

---

## 7. Compiler Contract (Normative)

### 7.1 Stages
1. Parse `repo.canvasl` YAML
2. Normalize to canonical JSON (`canon_json`)
3. Emit JSONL IR events (`canon`, `meet`, `join`, `proj_fano`, `commit`, `emit_geom`)
4. Assemble CANB bytecode with object pool references

### 7.2 Determinism requirement
Given identical input YAML, the compiler MUST produce byte-identical:

- canonical JSON
- JSONL IR
- CANB bytecode

---

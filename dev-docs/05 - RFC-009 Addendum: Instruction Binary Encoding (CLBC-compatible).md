## RFC-009 Addendum: Instruction Binary Encoding (CLBC-compatible)

This expands **RFC-009 (Origami Fold VM Semantics)** with a **fully specified 16-bit instruction word** and a **CLBC container “kind”** that mirrors the style of the existing **CLBC-POLY** codec (magic + kind + version + ids + big-endian integers).

---

# 1. CLBC Container for Fold-VM Bytecode

### 1.1 File signature (network/big-endian)
All multi-byte integers are **big-endian**.

| Field | Size | Value |
|---|---:|---|
| magic | 4 | ASCII `"CLBC"` |
| kind | 1 | ASCII `"I"` (Instruction stream) |
| version | 1 | `0x01` |
| isa_id | 1 | `0x09` (RFC-009 Origami Fold VM) |
| flags | 1 | bitfield (see below) |
| byte_len | 4 | payload length in bytes |
| payload | N | instruction words (16-bit) |

### 1.2 flags (1 byte)
- bit0 `HAS_POLY_DICT` (optional dictionary block present before payload; v1 usually 0)
- bit1 `HAS_DEBUG_SYMS` (optional symbols; v1 usually 0)
- bits2..7 reserved (MUST be 0)

### 1.3 payload layout
- Payload is a sequence of **16-bit instruction words**.
- Each instruction word is stored as **two bytes, big-endian**.

---

# 2. 16-bit Instruction Word (Normative)

## 2.1 Word layout (bit positions)
```
15..12  11..9   8..6    5..3    2..0
OP      RD      RA      RB      IMM3
```

- **OP**: 4-bit opcode (0..15)
- **RD/RA/RB**: 3-bit register indices (0..7)
- **IMM3**: 3-bit immediate (0..7), opcode-defined

## 2.2 Register file (v1)
- 8 registers: `R0..R7`
- Convention (RECOMMENDED):
  - `R1` = input A
  - `R2` = input B
  - `R3` = context / key / “projective point”
  - `R4..R7` = working

---

# 3. RFC-009 Fold Ops (Opcode Map for This Addendum)

This is the minimal vertical slice you asked for: **CANON + MEET(GCD) + JOIN(LCM) + PROJ_FANO barrier + ASSERT**.

| OP (hex) | Mnemonic | Semantics (summary) |
|---:|---|---|
| `0x0` | `SYS` | System op (HALT/NOP via IMM3) |
| `0x3` | `CANON` | Canonicalize polynomial / normalize representation |
| `0x4` | `MEET` | `gcd(a,b)` over the active ring (F₂[x] in v1) |
| `0x5` | `JOIN` | `lcm(a,b)` over the active ring (F₂[x] in v1) |
| `0x7` | `FANO.S` | Triad barrier check (incidence / idempotence hook) |
| `0x8` | `ASSERT.EQ` | Trap if registers differ (byte-identical canonical form) |

## 3.1 `SYS` (OP=0x0)
- `IMM3=0`: NOP
- `IMM3=1`: HALT

Encoding: `SYS rd ra rb imm3` but all fields other than IMM3 SHOULD be 0.

## 3.2 `CANON` (OP=0x3)
**Form:** `CANON RD, RA`  
- Reads polynomial in `RA`, writes canonical form to `RD`.
- `RB` and `IMM3` MUST be 0 in v1.

## 3.3 `MEET` (OP=0x4)
**Form:** `MEET RD, RA, RB`  
- `RD := gcd(RA, RB)` (F₂[x] Euclidean algorithm, deterministic)
- `IMM3` reserved (MUST be 0 v1)

## 3.4 `JOIN` (OP=0x5)
**Form:** `JOIN RD, RA, RB`  
- `RD := lcm(RA, RB)` (defined as `(RA*RB)/gcd(RA,RB)` in ring)
- `IMM3` reserved (MUST be 0 v1)

## 3.5 `FANO.S` (OP=0x7)
**Form:** `FANO.S RC, RA, RB`  
- Interprets `RC` as the **context / key** (projective point / shared vertex)
- Barrier MUST hold, otherwise VM traps:
  - Let `g1 = gcd(RC, RA)`, `g2 = gcd(RC, RB)`, `g3 = gcd(RA, RB)`
  - Condition (v1 strict): `¬is_one(g1) ∧ ¬is_one(g2) ∧ ¬is_one(g3)`
- `IMM3` = strictness:
  - `0`: strict (all three non-trivial)
  - `1`: soft (only `gcd(RA,RB)` non-trivial)
  - others reserved

This is the “Fano incidence” gate that makes merges / projections behave like your idempotent folding closure.

## 3.6 `ASSERT.EQ` (OP=0x8)
**Form:** `ASSERT.EQ RA, RB`  
- Traps if `RA != RB` (byte-identical after canonicalization)
- `RD` ignored (SHOULD be 0)
- `IMM3` reserved (MUST be 0)

---

# 4. Example: Minimal Program + Exact Bytes

Goal:
- Canonicalize A/B/context
- Compute `meet=gcd(A,B)` and `join=lcm(A,B)`
- Run `FANO.S` barrier
- Prove idempotence mechanically:
  - `gcd(meet, meet) == meet`
  - `lcm(join, join) == join`
  - `canon(canon(A)) == canon(A)`

### 4.1 Assembly (human-readable)
Assume:
- `R1` = A
- `R2` = B
- `R3` = Context / Key
- Results:
  - `R6` = MEET(A,B)
  - `R7` = JOIN(A,B)

```
CANON  R4, R1
CANON  R5, R2
CANON  R3, R3

MEET   R6, R4, R5
JOIN   R7, R4, R5

FANO.S R3, R4, R5

MEET   R0, R6, R6
ASSERT.EQ R0, R6

JOIN   R0, R7, R7
ASSERT.EQ R0, R7

CANON  R0, R4
ASSERT.EQ R0, R4

SYS    (HALT)
```

### 4.2 Exact 16-bit words (big-endian bytes)
Using the bit layout `OP RD RA RB IMM3`, the compiled bytes are:

| Instruction | Bytes |
|---|---|
| `CANON R4,R1` | `38 40` |
| `CANON R5,R2` | `3A 80` |
| `CANON R3,R3` | `36 C0` |
| `MEET R6,R4,R5` | `4D 28` |
| `JOIN R7,R4,R5` | `5F 28` |
| `FANO.S R3,R4,R5` | `77 28` |
| `MEET R0,R6,R6` | `41 B0` |
| `ASSERT.EQ R0,R6` | `80 30` |
| `JOIN R0,R7,R7` | `51 F8` |
| `ASSERT.EQ R0,R7` | `80 38` |
| `CANON R0,R4` | `31 00` |
| `ASSERT.EQ R0,R4` | `80 20` |
| `HALT` (`SYS imm=1`) | `00 01` |

### 4.3 Wrapped as CLBC container (kind `"I"`)
Header fields:
- magic `"CLBC"` = `43 4C 42 43`
- kind `"I"` = `49`
- version `01`
- isa_id `09`
- flags `00`
- byte_len = payload length in bytes = 13 instructions × 2 = 26 = `00 00 00 1A`

So the full file hex begins:

```
43 4C 42 43  49 01 09 00  00 00 00 1A
38 40 3A 80 36 C0 4D 28 5F 28 77 28
41 B0 80 30 51 F8 80 38 31 00 80 20 00 01
```

That is now a **fully deterministic** fold-vm bytecode artifact, containerized in a CLBC-style envelope.

---

# 5. Scheme Assembler Spec (Mechanical Enforcement)

## 5.1 Input S-expression grammar (minimal)
```scheme
(program
  (canon  r4 r1)
  (meet   r6 r4 r5)
  (fano.s r3 r4 r5)
  (assert.eq r0 r6)
  (sys halt))
```

## 5.2 Mechanical rules (MUST)
- Registers MUST be `r0..r7`
- `canon` MUST be `(canon rd ra)` and MUST set `rb=0 imm3=0`
- `meet/join` MUST be `(meet rd ra rb)` `(join rd ra rb)` and MUST set `imm3=0`
- `assert.eq` MUST be `(assert.eq ra rb)` and MUST encode `rd=0 imm3=0`
- `fano.s` MUST be `(fano.s rc ra rb [mode])`
  - If `mode` omitted, assembler MUST encode `imm3=0` (strict)
- `sys halt` MUST encode `(op=0 rd=0 ra=0 rb=0 imm3=1)`

Assembler MUST reject any form that violates reserved bits, because reserved bits are where nondeterminism sneaks in over time.

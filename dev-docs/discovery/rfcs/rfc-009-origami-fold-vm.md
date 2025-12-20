# RFC-009 — Origami Fold VM  
## Section 6: Instruction Encoding (Normative)

---

## 6.1 Design constraints (why this encoding)

This encoding MUST satisfy:

* Deterministic decoding (no variable-length ambiguity)
* Canonical byte layout (hash-stable)
* Compatible with CLBC-POLY canonical normalization
* Friendly to:
  * Scheme assembler
  * ESP32 / Pico firmware
  * Lean proofs
* Supports **Fano triads**, **GCD/LCM**, **projection**, **barriers**
* Leaves room for **timing / clock / circulation opcodes later**

---

## 6.2 Instruction word size

**All instructions are exactly 32 bits (4 bytes).**

This is deliberate:

* 16-bit is too tight once you add barriers
* 32-bit aligns with ESP32, ARM, RISC-V
* Still small enough for deterministic hashing

> No variable-length instructions  
> No prefixes  
> No alignment tricks  

---

## 6.3 Canonical 32-bit layout

```
31        24 23      16 15      8 7       0
+-----------+----------+----------+----------+
|  OPCODE   |   DST    |   SRC_A  |   SRC_B  |
+-----------+----------+----------+----------+
```

### Field meanings

| Field   | Bits | Meaning |
|--------|------|--------|
| OPCODE | 8    | Instruction selector |
| DST    | 8    | Destination register |
| SRC_A  | 8    | Source register A |
| SRC_B  | 8    | Source register B / extra |

All registers are **0–255**, fixed-width.

Unused fields MUST be zeroed.

---

## 6.4 Opcode table (Origami Fold VM)

These opcodes are **new VM**, not the old CLBC record VM.

| Opcode (hex) | Mnemonic        | Semantics |
|--------------|-----------------|-----------|
| `0x01` | `CANON`      | dst ← normalize(srcA) |
| `0x02` | `MEET`       | dst ← gcd(srcA, srcB) |
| `0x03` | `JOIN`       | dst ← lcm(srcA, srcB) |
| `0x04` | `PROJ_FANO`  | dst ← project(srcA) |
| `0x05` | `A6_FOLD`    | dst ← meet(srcA, srcB) |
| `0x06` | `BARRIER_FANO` | assert Fano(srcA,srcB,srcC) |
| `0xFF` | `HALT`       | stop execution |

### Special case: BARRIER_FANO

```
DST    = unused (MUST be 0)
SRC_A  = reg a
SRC_B  = reg b
(next word) SRC_C encoded as DST of following instruction
```

Why?

* Keeps base format simple
* Avoids widening instruction
* Deterministic multi-word barrier

(Your Scheme assembler will enforce this.)

---

## 6.5 Encoding examples (byte-exact)

### Example 1 — CANON r1 ← r3

```
Opcode = 0x01
DST    = 0x01
SRC_A  = 0x03
SRC_B  = 0x00
```

Binary:
```
00000001 00000001 00000011 00000000
```

Hex:
```
01 01 03 00
```

---

### Example 2 — MEET r5 ← r2 r7

```
02 05 02 07
```

---

### Example 3 — A6 fold (same as MEET, semantically stronger)

```
05 08 03 04   ; r8 ← A6_FOLD(r3, r4)
```

---

### Example 4 — Fano barrier (r1,r2,r3)

```
06 00 01 02   ; BARRIER_FANO r1 r2
00 03 00 00   ; implicit SRC_C = 3
```

This two-word form is **normative**.

---

## 6.6 Canonical encoding rules (CRITICAL)

These rules are **why proofs work**.

1. All instructions are **exactly 4 bytes**
2. Big-endian byte order (network order)
3. Unused fields MUST be zero
4. Registers outside range → decode error
5. Any non-canonical encoding MUST be rejected
6. normalize() MUST be applied on:
   * CANON
   * MEET
   * JOIN
   * A6_FOLD
7. Two instruction streams are equivalent **iff their byte arrays are identical**

This makes:

* Hash = meaning
* Meaning = proof
* Proof = execution

---

## 6.7 Relation to CLBC-POLY

CLBC-POLY is **data encoding**  
Origami Fold VM is **control encoding**

They meet at exactly one boundary:

```
MEET / JOIN / A6_FOLD
        ↓
PolyF2.gcd / lcm
        ↓
CLBC-POLY canonical bytes
```

This is intentional.

---

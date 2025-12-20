# RFC-0011 §6 — CAN-ISA v1.0 Binding for Fano Consistency (Normative)

## 6.1 Design Goals

1. **All semantic states are polynomials** in canonical CLBC-POLY encoding.
2. VM execution MUST be deterministic and endian-stable.
3. Fano consistency MUST be checkable as a pure barrier instruction:
   - **strict mode** (pairwise + triple core + idempotence + non-absorption)
   - **weak mode** (triple core + touches core + idempotence)

---

## 6.2 Canonical Data Unit: CLBC-POLY Frame

All polynomial values referenced by CAN-ISA MUST be stored in memory as **CLBC-POLY v1 frames**.

### 6.2.1 CLBC-POLY v1 Frame Layout (Byte Exact)

```
offset  size  field
0       4     magic = "CLBC" (0x43 0x4C 0x42 0x43)
4       1     kind  = 'P'    (0x50)    // polynomial
5       1     ver   = 0x01
6       1     ring  = 0x01            // F₂[x]
7       1     flags = 0x00
8       4     degree   (u32, big-endian)
12      4     nwords   (u32, big-endian)
16      4*n   words[i] (u32, big-endian)  // bitset coefficients
```

**Normative requirement:** CAN-ISA MUST treat all CLBC-POLY integers as **big-endian**.  
(Your earlier “golden vector” tooling already assumes this.)

---

## 6.3 CAN-ISA Instruction Word (Fixed 16-bit)

Every instruction is exactly **16 bits**:

```
15..12  opcode (4 bits)
11..9   rd     (3 bits)   // destination register
8..6    ra     (3 bits)   // source A
5..3    rb     (3 bits)   // source B
2..0    imm3   (3 bits)   // mode / small immediate
```

- Registers `R0..R7` hold **pointers** (32-bit addresses) to CLBC-POLY frames in VM memory.
- Instructions are encoded in **big-endian 16-bit** in the bytecode stream:
  - high byte first, then low byte.

---

## 6.4 Opcode Set for Fano Folding (v1.0)

### 6.4.1 Core Lattice Ops

#### `0x1 MEET` — Polynomial GCD (fold intersection)

**Encoding:**
```
opcode=0001  rd ra rb imm3
```

**Semantics:**
- Load CLBC-POLY at `*ra`, `*rb`
- Compute `g = gcd(a,b)` in F₂[x]
- Write canonical CLBC-POLY for `g` into scratch/heap
- Store pointer to result in `rd`

**VM MUST** normalize/canonicalize output (degree/words trimmed).

---

#### `0x2 JOIN` — Polynomial LCM (fold union)

**Encoding:**
```
opcode=0010  rd ra rb imm3
```

**Semantics:**
- Compute `j = lcm(a,b) = (a*b)/gcd(a,b)` in F₂[x]
- Write canonical CLBC-POLY, store pointer in `rd`

---

### 6.4.2 Barrier Checks

#### `0x7 PROJ_FANO` — Fano Triad Barrier (the merge gate)

This is the *enforcement instruction*.

**Encoding:**
```
opcode=0111  rd ra rb imm3
```

**Register meaning:**
- `ra` points to `A`
- `rb` points to `B`
- `rd` points to `C`  (yes: `rd` used as 3rd source here; rd is not overwritten)

**imm3: mode**
- `000` = STRICT_FANO
- `001` = WEAK_FANO
- `010` = STRICT_FANO_NO_IDEMP (debug / not allowed in release builds unless explicitly enabled)
- all other values: reserved → MUST trap

**Result reporting:**
- On success: VM continues; `FLAGS.FANO_OK = 1`
- On failure: MUST trap with one failure code in `FLAGS.FAIL` and halt/abort the transaction.

---

## 6.5 PROJ_FANO Semantics (Exact Predicate)

Let `A,B,C` be the polynomials referenced by `(ra, rb, rd)`.

Define helper operations (implemented via MEET/JOIN internally, but PROJ_FANO may shortcut):

- `AB = gcd(A,B)`
- `BC = gcd(B,C)`
- `AC = gcd(A,C)`
- `ABC = gcd(AB,C)`
- `J = lcm(lcm(A,B),C)`
- `ONE` = polynomial constant 1
- `IDEMP(X)` := `gcd(X,X) == X` (true for canonical polys, but required as a safety invariant)

### 6.5.1 STRICT_FANO (imm3 = 000)

PROJ_FANO MUST succeed iff **all** hold:

**(S1) Pairwise non-trivial incidence**
- `AB ≠ ONE`
- `BC ≠ ONE`
- `AC ≠ ONE`

**(S2) Triple core exists**
- `ABC ≠ ONE`

**(S3) Idempotent closure**
- `IDEMP(J)` MUST hold

**(S4) Non-absorption (no degenerate collapse)**
- `AB ≠ A`
- `BC ≠ B`
- `AC ≠ C`

If any clause fails, VM MUST trap with:

- S1 fail → `FANO_NO_PAIRWISE_INCIDENT`
- S2 fail → `FANO_NO_COMMON_CORE`
- S3 fail → `FANO_NON_IDEMPOTENT`
- S4 fail → `FANO_DEGENERATE_ABSORPTION`

### 6.5.2 WEAK_FANO (imm3 = 001)

PROJ_FANO MUST succeed iff:

**(W1) Triple core exists**
- `K = ABC ≠ ONE`

**(W2) Each touches the core**
- `gcd(A,K) ≠ ONE`
- `gcd(B,K) ≠ ONE`
- `gcd(C,K) ≠ ONE`

**(W3) Core idempotence**
- `IDEMP(K)` MUST hold

Failure codes:
- W1 fail → `FANO_NO_COMMON_CORE`
- W2 fail → `FANO_NO_PAIRWISE_INCIDENT`
- W3 fail → `FANO_NON_IDEMPOTENT`

---

## 6.6 Minimal Assembler Mnemonics (for Scheme assembler)

Even though this is 16-bit, keep mnemonics simple:

```
MEET   rd, ra, rb        ; rd := gcd(ra, rb)
JOIN   rd, ra, rb        ; rd := lcm(ra, rb)

FANO.S rd, ra, rb        ; triad barrier STRICT, sources=(ra,rb,rd)
FANO.W rd, ra, rb        ; triad barrier WEAK,   sources=(ra,rb,rd)
```

**Note:** `FANO.*` uses `(ra, rb, rd)` as `(A,B,C)`; it does not clobber rd.

---

## 6.7 Worked Encoding Example (Byte Exact)

Example: `MEET R3, R1, R2`

Fields:
- opcode = `0x1` → `0001`
- rd=3 → `011`
- ra=1 → `001`
- rb=2 → `010`
- imm3=0 → `000`

Bitstring:
```
0001 011 001 010 000
```

Grouped into 16 bits:
```
00010110 01010000
   0x16     0x50
```

So the bytecode stream contains:
```
16 50
```

Example: `FANO.S R4, R1, R2`  (triad = A=R1, B=R2, C=R4)

- opcode=0x7 → `0111`
- rd=4 → `100`   (C)
- ra=1 → `001`   (A)
- rb=2 → `010`   (B)
- imm3=0 → `000` (STRICT)

Bits:
```
0111 100 001 010 000
```

Bytes:
```
01111000 10100000
   0x78     0xA0
```

---

## 6.8 Integration Hook: Git Merge Gate == PROJ_FANO

A repo merge gate MUST compile the merge intent into a triad list and insert:

- `FANO.S` barriers (release/current → main)
- optionally `FANO.W` barriers (feature → current)

If any barrier traps, the merge MUST be rejected.

---

## Next (so we keep momentum)

If you answer with **one number**, I’ll continue immediately:

**5** = Scheme assembler spec + encoder for the 16-bit instruction format (including CLBC-POLY symbol table)  
**6** = add two more opcodes you’ll need right away: `CANON` (normalize) and `ASSERT_EQ` (proof hooks)  
**7** = a tiny end-to-end “merge program” that runs on host VM + same bytes on ESP32/Pico

You said “4” — done. Pick **5/6/7**.

---

## You

6

---

## ChatGPT

Perfect — **§6 = add `CANON` + `ASSERT_EQ`** so the Fold VM can (a) force canonical form as an *instructional invariant* and (b) carry **proof hooks** that work identically on host + ESP32 + Pico.

Below is the **RFC-0011 addendum** continuing the same 16-bit encoding + CLBC-POLY framing.

---

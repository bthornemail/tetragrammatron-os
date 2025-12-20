# AAS (Assembler-in-Scheme) Spec — RFC-009 §10 Kernel

## 1) Source Form (S-expr DSL)

A program is a list of forms:

```scheme
(program
  (section text)
  (label entry)
  (rr.init #:n 4 #:owner 0 #:reset-epoch #t)
  (barrier.rr #:caller r1 #:strict #t)        ; MUST precede patch.apply
  (barrier.t  #:strict #t #:couple-rr #t)     ; RECOMMENDED precede patch.apply
  (patch.begin #:id 42 #:len 64 #:owner 0)
  (patch.write #:off 0  #:bytes #xE0 #x10 ...) ; raw bytes
  (patch.seal)
  (patch.apply #:addr (label-ref target))
  (label target)
  (nop)
  (halt))
```

### Registers
Use symbols `r0..r15` (4-bit reg field). `r0` is “zero/none” by convention.

### Labels
- `(label name)` defines a word-aligned address in instruction words (16-bit units)
- `(label-ref name)` resolves to an **IMM16** (word address) for patch targets, jump targets, etc.

---

## 2) Instruction Set Surface (this slice)

### 2.1 RR opcodes (0xE*)

```scheme
(rr.init    #:n N #:owner O #:reset-epoch BOOL #:lock-n BOOL)
(rr.next    #:rd rX #:write-owner BOOL #:write-epochlo BOOL)
(rr.owner   #:rd rX)                 ; optional helper
(barrier.rr #:caller rX #:strict BOOL #:mask MODE #:lanes BITMASK)
```

- `#:mask` is either `'equal` or `'in-mask`
- `#:lanes` is an integer bitmask (0..65535), only used when `'in-mask`

### 2.2 MUX opcodes (0xC*)

```scheme
(mux.open  #:ch CH #:type TYPE #:flags FLAGS)
(mux.evt   #:ch CH #:tag TAG #:payload BYTES...) ; payload is raw bytes or refs
(mux.close #:ch CH)
(mux.hash  #:ch CH #:rd rX)
```

### 2.3 PATCH opcodes (0xB*)

```scheme
(patch.begin #:id ID #:len LEN #:owner OWNER)
(patch.write #:off OFF #:bytes b0 b1 ... bK)
(patch.seal)
(patch.apply #:addr ADDR)            ; ADDR = imm16 word address
(patch.abort)
```

### 2.4 Control flow (creates basic block boundaries)

```scheme
(jmp   (label-ref L))
(jz    #:rs rX (label-ref L))
(call  (label-ref L))
(ret)
(halt)
(label L)
```

---

## 3) Binary Encoding Rules (Imm16 + EXT)

We use two 16-bit word formats:

### 3.1 R-type (single word)
```
word0:
  bits 15..12 = MAJOR (family)
  bits 11..8  = RD
  bits 7..4   = MINOR
  bits 3..0   = FLAGS
```

### 3.2 EXT (two words)
```
word0:
  bits 15..12 = 0xF
  bits 11..8  = RA (meaning depends on subop)
  bits 7..4   = SUBOP
  bits 3..0   = FLAGS

word1:
  IMM16 payload (meaning depends on subop)
```

---

## 4) Concrete Encodings for §10

### 4.1 RR_INIT (EXT)
- word0: `MAJOR=0xF`, `RA=RD` (optional), `SUBOP=0x1`, flags:
  - bit0 RESET_EPOCH
  - bit1 LOCK_N
- word1: `IMM16 = (N<<8) | owner0`

### 4.2 RR_NEXT (R-type)
- word0: `MAJOR=0xE`, RD, `MINOR=0x1`, flags:
  - bit0 WRITE_OWNER
  - bit1 WRITE_EPOCHLO

### 4.3 RR_BARRIER (EXT)
- word0: `MAJOR=0xF`, `RA=RS` (caller reg), `SUBOP=0x2`, flags:
  - bit0 STRICT
  - bit2 MASK_MODE (0 equal, 1 in-mask)
- word1: `lane_mask` (used iff MASK_MODE=1; else may be 0)

### 4.4 MUX (R-type + EXT as needed)
Keep v1 simple:
- `MUX_OPEN`: EXT subop `0x3` with word1 = `(ch<<12)|(type<<8)|(flags)`
- `MUX_EVT`: EXT subop `0x4` with word1 = `(ch<<12)|(tag<<8)|(len)` then follow with `len` bytes packed into subsequent 16-bit words (assembler handles)
- `MUX_CLOSE`: R-type family `0xC`, minor `0x2`
- `MUX_HASH`: R-type family `0xC`, minor `0x3`, RD=dest, flags include channel id in low nibble (or use EXT if you prefer purity)

### 4.5 PATCH
- `PATCH_BEGIN`: EXT subop `0x5`, word1 = `(owner<<12)|(len)` and ID supplied via next EXT (or use two EXTs: one for ID_hi/lo)
- `PATCH_WRITE`: EXT subop `0x6`, word1 = `off` then raw bytes packed afterward
- `PATCH_SEAL`: R-type family `0xB`, minor `0x2`
- `PATCH_APPLY`: EXT subop `0x7`, word1 = `addr` (word address)
- `PATCH_ABORT`: R-type family `0xB`, minor `0x4`

> If you want **exact** byte-for-byte alignment with your CLBC-POLY container’s endianness rules, set the assembler output to be **big-endian words** (network order) inside the `.clbc` payload; the verifier is independent of that choice.

---

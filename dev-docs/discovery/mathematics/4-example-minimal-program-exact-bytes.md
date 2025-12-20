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

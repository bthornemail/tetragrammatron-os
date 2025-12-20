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

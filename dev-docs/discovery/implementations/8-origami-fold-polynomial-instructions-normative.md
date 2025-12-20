# 8) Origami fold / polynomial instructions (Normative)

These operate on **handles** to canonical polynomial objects (your CLBC-POLY canonical bytes).
For MCU friendliness, we treat polynomials as **interned objects** in a small heap; registers hold **poly-handle IDs**.

## 8.1 CANON — canonicalize a polynomial object
**Opcode:** `0xA0`

Layout:
```
u8 op      = 0xA0
u8 dst_reg = 0..15    ; poly handle out
u8 src_reg = 0..15    ; poly handle in
u8 flags   = 0        ; MUST be 0
```

Total size: **4 bytes**

## 8.2 MEET_GCD — r = gcd(a,b)
**Opcode:** `0xA1`

Layout:
```
u8 op       = 0xA1
u8 dst_reg  = 0..15
u8 a_reg    = 0..15
u8 b_reg    = 0..15
```

Total size: **4 bytes**

## 8.3 JOIN_LCM — r = lcm(a,b)
**Opcode:** `0xA2`

Layout:
```
u8 op       = 0xA2
u8 dst_reg  = 0..15
u8 a_reg    = 0..15
u8 b_reg    = 0..15
```

Total size: **4 bytes**

## 8.4 PROJ_FANO — compute a 7-point incidence projection hash/handle
**Opcode:** `0xA3`

Layout:
```
u8 op       = 0xA3
u8 dst_reg  = 0..15     ; fano-handle out (or small id)
u8 src_reg  = 0..15     ; poly-handle in
u8 flags    = 0..1      ; 0=incidence-id, 1=incidence-bytes-handle
```

Total size: **4 bytes**

## 8.5 ASSERT_IDEMP — assert canon(canon(p)) == canon(p)
**Opcode:** `0xA4`

Layout:
```
u8 op      = 0xA4
u8 src_reg = 0..15
u16 flags  = 0
```

Total size: **4 bytes**

## 8.6 ASSERT_FANO_TRIAD — enforce “Fano-triad consistency”
**Opcode:** `0xA5`

Layout:
```
u8 op     = 0xA5
u8 a_reg  = 0..15
u8 b_reg  = 0..15
u8 c_reg  = 0..15
```

Total size: **4 bytes**

Meaning (v1):
- VM computes:
  - `g_ab = gcd(a,b)`
  - `g_bc = gcd(b,c)`
  - `g_ca = gcd(c,a)`
- PASS iff all three are **non-trivial** (not 1) AND consistent under canonicalization policy.
(This is the mechanical “Fano plane = idempotent triad closure” enforcement hook.)

---

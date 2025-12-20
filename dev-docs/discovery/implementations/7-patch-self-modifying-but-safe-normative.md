# 7) Patch (self-modifying but safe) (Normative)

The patch pipeline is explicitly separated so you get “circulation” without chaos.

## 7.1 PATCH_BEGIN — open a patch buffer
**Opcode:** `0x90`

Layout:
```
u8   op        = 0x90
u8   patch_id  = 0..255
u16  target    ; 0=CODE, 1=CONST, 2=TABLE, others reserved
u16  max_len   ; maximum bytes allowed in this patch
```

Total size: **7 bytes**

## 7.2 PATCH_WRITE — append bytes into patch buffer
**Opcode:** `0x91`

Layout:
```
u8   op       = 0x91
u8   patch_id = 0..255
u16  offset   ; write offset inside patch buffer
u16  len
u8[len] bytes
```

Total size: **7 + len bytes**

## 7.3 PATCH_SEAL — finalize patch and produce digest into register
**Opcode:** `0x92`

Layout:
```
u8  op        = 0x92
u8  patch_id  = 0..255
u8  dst_reg   = 0..15     ; receives patch digest handle (implementation-defined id)
u8  algo      = 0..3      ; 0=SHA256, 1=BLAKE3, others reserved
u16 flags     = 0         ; MUST be 0 in v1
```

Total size: **6 bytes**

## 7.4 PATCH_APPLY — apply sealed patch, gated by timing barrier
**Opcode:** `0x93`

Layout:
```
u8  op         = 0x93
u8  patch_id   = 0..255
u8  barrier_mode = 0..3   ; same as BARRIER_T modes
u8  barrier_reg  = 0..15  ; uses reg value as param (u16 low bits)
u16 flags      = 0        ; MUST be 0
```

Total size: **6 bytes**

Rule:
- VM MUST execute a `BARRIER_T` equivalent check using `(barrier_mode, barrier_reg)` before applying.
- This is the “physical constraint” safeguard.

---

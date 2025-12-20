# 5) Round-robin circulation (Normative)

## 5.1 RR_INIT — initialize RR state
**Opcode:** `0x70`

Layout:
```
u8  op    = 0x70
u8  rr_id = 0..255
u8  count = 1..255     ; number of slots
u8  flags = 0          ; reserved; MUST be 0
```

Total size: **4 bytes**

## 5.2 RR_NEXT — advance RR and return next slot index
**Opcode:** `0x71`

Layout:
```
u8 op     = 0x71
u8 rr_id  = 0..255
u8 dst_reg = 0..15     ; receives slot index 0..count-1
u8 flags  = 0          ; reserved; MUST be 0
```

Total size: **4 bytes**

---

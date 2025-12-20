# 9) Jumps + labels (minimal, deterministic) (Normative)

You asked for “labels and jumps”. Here is a tight layout.

## 9.1 JMP — unconditional relative jump
**Opcode:** `0x40`

Layout:
```
u8  op   = 0x40
i16 rel  ; signed offset in BYTES from next instruction
u8  flags = 0
```

Total size: **5 bytes**

## 9.2 JZ — jump if register is zero (for integers) or null-handle (for handles)
**Opcode:** `0x41`

Layout:
```
u8 op     = 0x41
u8 test_reg = 0..15
i16 rel
u8 flags   = 0
```

Total size: **5 bytes**

Assembler rule:
- Labels compile to `rel = target_pc - (pc_after_this_instr)`.

This keeps execution deterministic and portable.

---

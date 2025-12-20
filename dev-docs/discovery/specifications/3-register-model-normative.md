# 3) Register model (Normative)

We keep this minimal and MCU-friendly:

- 16 general registers: `r0..r15` (`u8 reg` where only low 4 bits used)
- `r0` may be used as “zero” by convention, but not required.

Encoding:
```
reg8: u8 where valid regs are 0x0..0xF; upper bits MUST be 0.
```

---

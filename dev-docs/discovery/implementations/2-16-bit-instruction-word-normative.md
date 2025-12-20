# 2. 16-bit Instruction Word (Normative)

## 2.1 Word layout (bit positions)
```
15..12  11..9   8..6    5..3    2..0
OP      RD      RA      RB      IMM3
```

- **OP**: 4-bit opcode (0..15)
- **RD/RA/RB**: 3-bit register indices (0..7)
- **IMM3**: 3-bit immediate (0..7), opcode-defined

## 2.2 Register file (v1)
- 8 registers: `R0..R7`
- Convention (RECOMMENDED):
  - `R1` = input A
  - `R2` = input B
  - `R3` = context / key / “projective point”
  - `R4..R7` = working

---

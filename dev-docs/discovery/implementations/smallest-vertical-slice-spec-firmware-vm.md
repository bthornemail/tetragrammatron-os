# Smallest Vertical Slice Spec (Firmware + VM)

## Global encoding rules (applies to all instructions)

- **Endianness:** little-endian for all multi-byte immediates.
- **Instruction word:** 16-bit minimum (`u16`), with optional tail immediates.
- **Opcode field:** 6 bits (`0..63`) reserved for the “OS-64 mnemonic space”.
- **Format nibble:** 2 bits select operand format.
- **Reg fields:** 4-bit register indices where needed.

### 16-bit header layout (common)
```
bit 15..10 : OPC   (6)   // mnemonic ID (0..63)
bit  9..8  : FMT   (2)   // 0..3
bit  7..4  : RA    (4)   // dest / primary reg
bit  3..0  : RB    (4)   // src / secondary reg
```

**FMT meanings**
- `00` = RR (reg-reg): uses RA,RB only
- `01` = RI8: header + imm8 (1 extra byte)
- `10` = RI16: header + imm16 (2 extra bytes)
- `11` = EXT: header + ext-tag + ext-len + bytes (variable)

---

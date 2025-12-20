# D.1 Instruction Word Encoding (Normative)

Each instruction is exactly 4 bytes:

```
word32 = (opcode << 24) | (A << 20) | (B << 16) | imm16
```

- `opcode`: 8-bit (0..255)
- `A`: 4-bit register index (0..15)
- `B`: 4-bit register index (0..15)
- `imm16`: 16-bit unsigned (0..65535)

**Endianness (byte output):** MUST emit **big-endian** bytes:
`[word>>24, word>>16, word>>8, word]`

---

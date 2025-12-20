# 6) ISA opcode parameter encoding (Normative)

Any opcode that references a channel MUST take an `imm16` using the Imm16Channel format above.

### Example: `MUX_OPEN`
```
[MUX_OPEN opcode: 1 byte]
[imm16 channel: 2 bytes big-endian]
[u16 elem_type: 2 bytes]   ; optional, if you want typed streams
[u32 byte_len: 4 bytes]    ; optional, for fixed-size payload blocks
```

But the key point is: **channel parameter is always the same 16-bit encoding**.

---

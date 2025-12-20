# 0) Common scalar encodings (Normative)

## 0.1 Endianness
- `u16`, `i16`, `u32`, `i32`, `u64` are **big-endian** on the wire.

## 0.2 imm16 channel (recap)
```
imm16 = (flags4 << 12) | channel12
channel12 = a0 | (a1<<3) | (a2<<6) | (a3<<9)   ; 0..4095
```

## 0.3 LEB128 is NOT used
Everything is fixed-width unless explicitly stated.

---

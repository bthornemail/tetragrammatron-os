# 3) Binary endianness + byte order (Normative)

All multibyte integer fields are encoded **big-endian** (network order), matching the “container-first determinism” style you used in CLBC-POLY.

So an `imm16` is emitted as:

```
byte0 = (imm16 >> 8) & 0xFF
byte1 = imm16 & 0xFF
```

---

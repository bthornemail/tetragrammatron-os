# C.2 Byte Order and Alignment (Normative)

- All multi-byte integers MUST be **big-endian**.
- All section payloads MUST be **4-byte aligned** (pad with `0x00`).
- Instruction stream MUST be a multiple of 4 bytes (each instruction is `word32`).

---

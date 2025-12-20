# 1. CLBC Container for Fold-VM Bytecode

### 1.1 File signature (network/big-endian)
All multi-byte integers are **big-endian**.

| Field | Size | Value |
|---|---:|---|
| magic | 4 | ASCII `"CLBC"` |
| kind | 1 | ASCII `"I"` (Instruction stream) |
| version | 1 | `0x01` |
| isa_id | 1 | `0x09` (RFC-009 Origami Fold VM) |
| flags | 1 | bitfield (see below) |
| byte_len | 4 | payload length in bytes |
| payload | N | instruction words (16-bit) |

### 1.2 flags (1 byte)
- bit0 `HAS_POLY_DICT` (optional dictionary block present before payload; v1 usually 0)
- bit1 `HAS_DEBUG_SYMS` (optional symbols; v1 usually 0)
- bits2..7 reserved (MUST be 0)

### 1.3 payload layout
- Payload is a sequence of **16-bit instruction words**.
- Each instruction word is stored as **two bytes, big-endian**.

---

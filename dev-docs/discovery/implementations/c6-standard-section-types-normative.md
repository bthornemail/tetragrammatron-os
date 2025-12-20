# C.6 Standard Section Types (Normative)

### 0x01 — `TEXT` (Required)
**CAN-ISA instruction stream**.

Payload format:
```
u32_be text_len_bytes   ; MUST equal slen_be - 4
u8     text_bytes[text_len_bytes]
pad to 4-byte
```

Constraints:
- `text_len_bytes` MUST be multiple of 4.
- Each 4 bytes is one instruction word (`opcode8|A4|B4|imm16`) per Appendix D.

---

### 0x02 — `SYMTAB` (Optional)
Symbol table for debugging and visualization labels.

Payload format:
```
u16_be entry_count
u16_be str_bytes_len
u8     str_bytes[str_bytes_len]     ; UTF-8, NUL-separated strings
then entry_count times:
  u32_be name_off                  ; offset into str_bytes
  u32_be value                     ; meaning depends on stype of symbol
  u8     kind                      ; 0=const_u32, 1=pc_word, 2=poly_id, 3=node_id
  u8     reserved[3] (0)
pad
```

Recommended usage:
- constants defined by `(DEF ...)` are `const_u32`
- labels resolve to `pc_word` (instruction index)

---

### 0x03 — `POLYPOOL` (Optional, but strongly recommended)
A packed pool of **CLBC-POLY canonical byte blobs** for polynomials referenced by the program.

Payload format:
```
u16_be poly_count
u16_be reserved (0)
then poly_count times:
  u32_be poly_id
  u32_be poly_len
  u8     poly_bytes[poly_len]      ; EXACT CLBC-POLY bytes (magic "CLBC", kind "P", ...)
  pad to 4-byte
```

Rules:
- `poly_id` MUST be unique.
- `poly_bytes` MUST be a valid CLBC-POLY blob (your existing decoder can verify).
- The VM MAY require that any poly referenced by `USEI32` exists in POLYPOOL.

This is the bridge that makes CAN-ISA “match” the CLBC-POLY codec directly: you embed canonical polynomials verbatim.

---

### 0x04 — `VIZSEED` (Optional)
A minimal “renderer contract seed” to allow deterministic visualization without bundling full JSONL.

Payload format (small and rigid):
```
u8  viz_version = 1
u8  space_default   ; 0=fano2,1=affine3,2=projective4
u8  style_default   ; renderer-defined
u8  reserved
u32_be palette_hash ; optional stable ID
u32_be node_base_id ; starting id
u32_be edge_base_id
pad
```

This is enough for the VM to emit deterministic events (nodes/edges) even when the host renderer is external.

---

### 0x05 — `PROOFSEED` (Optional)
A hook for proof-carrying metadata (Lean/Coq artifact hashes, theorem IDs).

Payload format:
```
u8  proof_version = 1
u8  reserved[3]
u32_be lean_hash_len
u8  lean_hash[lean_hash_len]   ; e.g., SHA256 bytes or hex, your choice but be consistent
u32_be coq_hash_len
u8  coq_hash[coq_hash_len]
pad
```

This lets you “bind” a program to its proof package without requiring the proof to ship on-device.

---

# A.3 Header (Fixed 24 bytes)

All fields are big-endian.

| Offset | Size | Name         | Type   | Meaning |
|-------:|-----:|--------------|--------|---------|
| 0      | 4    | magic        | ASCII  | MUST be "CLBC" |
| 4      | 1    | kind         | u8     | MUST be 'C' (0x43) for CANBC |
| 5      | 1    | version      | u8     | MUST be 0x01 |
| 6      | 1    | ring_id      | u8     | 0x01 = F₂[x] (same meaning as CLBC-POLY) |
| 7      | 1    | flags        | u8     | bitfield (A.3.1) |
| 8      | 4    | file_len     | u32    | Total bytes of file |
| 12     | 4    | section_cnt  | u32    | Number of sections following |
| 16     | 4    | toc_hash32   | u32    | Optional quick hash of section headers (A.3.2) |
| 20     | 4    | reserved     | u32    | MUST be 0 |

### A.3.1 Header flags (u8)

- bit0 `0x01` — HAS_DIGEST section present (recommended)
- bit1 `0x02` — HAS_SIGNATURE section present (future)
- bit2 `0x04` — HAS_SYMTAB present (labels/names)
- bit3 `0x08` — LITTLE_ENDIAN_CODE (MUST be 0; code words are big-endian by default)
- bits4..7 — reserved (MUST be 0)

### A.3.2 `toc_hash32`
A fast integrity hint over *section headers only* (not payloads).  
- If nonzero, it **MUST** equal FNV-1a 32-bit over the concatenation of all section headers `(tag|flags|length)` in file order.
- If zero, readers **MAY** skip this check.

---

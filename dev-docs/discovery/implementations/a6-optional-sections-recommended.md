# A.6 Optional Sections (Recommended)

## A.6.1 `POLY` — embedded polynomial constants (optional)

This is how you “match your CLBC-POLY codec” directly.

Payload:

| Field | Type | Meaning |
|------|------|---------|
| poly_cnt | u32 | number of polynomial blobs |
| blobs    | repeated | each blob is: u32 byte_len + byte[byte_len] |

Each `byte[byte_len]` blob **MUST** be a complete CLBC-POLY message exactly as produced by your `clbc_poly_encode()` (magic "CLBC", kind 'P', version, ring_id, flags, degree, nwords, words...). No transformation.

## A.6.2 `SYMB` — symbol table / labels (optional)

Payload:

| Field | Type | Meaning |
|------|------|---------|
| sym_cnt | u32 | number of symbols |
| entries | repeated | each entry: u32 name_len + bytes(name) + u32 pc_word |

Names are UTF-8 bytes (no null terminator). `pc_word` is word index into CODE.

## A.6.3 `META` — metadata (optional)

Payload is UTF-8 JSON (not JSONL), deterministic: keys sorted, no trailing whitespace recommended.

## A.6.4 `DGST` — canonical digest (recommended)

Payload:

| Field | Type | Meaning |
|------|------|---------|
| algo | u8  | 0x01=SHA256 |
| scope| u8  | 0x01=whole-file-except-DGST (recommended) |
| rsv  | u16 | 0 |
| hash | 32B | sha256 |

Scope rule for `0x01`: compute SHA256 over the entire file with DGST payload bytes treated as all-zero (but keeping the DGST header + length intact). This makes it self-contained and reproducible.

---

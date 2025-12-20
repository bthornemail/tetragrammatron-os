# RFC-009 Addendum: CANBC Container + Instruction Encoding (CLBC-POLY compatible)

This is the part you asked for: **full binary encoding** + **bit layout**, explicitly designed so **polynomial constants are literally CLBC-POLY blobs** (byte-for-byte identical), and CAN bytecode references them by index.

## 1. CANBC container (file format)

All integers are **big-endian**. No varints.

### 1.1 Header (fixed 32 bytes)

| Offset | Size | Field | Value / Meaning |
|---:|---:|---|---|
| 0 | 4 | `magic` | ASCII `"CANB"` |
| 4 | 1 | `version` | `0x01` |
| 5 | 1 | `endianness` | `0x00` = big-endian only (MUST reject otherwise) |
| 6 | 1 | `abi` | `0x01` = CAN-ISA v1.0 |
| 7 | 1 | `flags` | bit0: has_section_crc, bit1: has_file_crc |
| 8 | 4 | `section_count` | N |
| 12 | 4 | `section_table_off` | byte offset of section table |
| 16 | 16 | `file_id` | 128-bit deterministic build id (e.g. SHA-256 trunc) |

### 1.2 Section table (N entries, 24 bytes each)

| Field | Size | Meaning |
|---|---:|---|
| `type` | 4 | ASCII, e.g. `"CODE"`, `"POLY"`, `"SYMB"`, `"META"` |
| `offset` | 4 | section start |
| `length` | 4 | section length |
| `crc32` | 4 | section CRC32 (0 if not present) |
| `flags` | 4 | type-specific |
| `reserved` | 4 | MUST be 0 |

### 1.3 Required sections

#### `CODE` (required)
Raw CAN-ISA instruction stream.

#### `POLY` (required if any fold ops are used)
Concatenation of **CLBC-POLY v1** blobs, with an index table:

`POLY` payload =

```
u32 poly_count
u32 poly_index_off      ; from start of POLY section
... poly_blob_bytes ... ; concatenated CLBC-POLY blobs
... index table ...
```

Index table entry (16 bytes each):

```
u32 poly_off            ; offset from start of POLY section
u32 poly_len
u32 poly_sha32          ; first 4 bytes of SHA-256(CLBC-POLY bytes)
u32 reserved            ; 0
```

**Normative rule:** The bytes stored for each polynomial **MUST be a valid CLBC-POLY object** and **MUST NOT be re-encoded**. That’s the “matching your CLBC-POLY codec” requirement.

---

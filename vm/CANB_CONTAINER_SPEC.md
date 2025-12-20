# CANB v1 Container Format Implementation

**Status:** Normative  
**Agent:** Agent 2 — CAN-ISA / BINARY ENCODING ENGINEER (`CAN-BIT-TRUTH`)  
**Implements:** RFC-0012 §4 (CANB Container Format)

---

## Overview

This document summarizes the CANB v1 container format implementation per RFC-0012 §4.

---

## Container Structure

A CANB v1 container consists of:

1. **Container Header** (16 bytes) — RFC-0012 §4.2
2. **Section 0** (4-byte header + data)
3. **Section 1** (4-byte header + data)
4. **...**
5. **Section N** (4-byte header + data)

---

## Container Header (16 bytes)

Per RFC-0012 §4.2:

| Offset | Size | Field | Value |
|--------|------|-------|-------|
| 0 | 4 | MAGIC | "CANB" (0x43 0x41 0x4E 0x42) |
| 4 | 1 | VER | 0x01 |
| 5 | 1 | FLAGS | Reserved, MUST be 0 |
| 6 | 2 | SECTION_COUNT | Number of sections (big-endian) |
| 8 | 4 | HEADER_CHECKSUM | CRC32 of header (big-endian) |
| 12 | 4 | RESERVED | MUST be 0 (big-endian) |

**Validation Rules:**
- Magic MUST be "CANB"
- Version MUST be 0x01
- Flags MUST be 0
- Section count MUST be > 0
- Reserved MUST be 0
- Checksum MUST match computed CRC32

---

## Section Format (4-byte header + data)

Per RFC-0012 §4.3:

| Offset | Size | Field | Description |
|--------|------|-------|-------------|
| 0 | 1 | SECTION_TYPE | Section type (RFC-0012 §4.4) |
| 1 | 3 | SECTION_SIZE | Data size in bytes, excluding header (big-endian, 24-bit) |
| 4 | N | SECTION_DATA | Section payload |

**Section Size:**
- 24-bit big-endian value
- Maximum size: 16,777,215 bytes (0x00FFFFFF)
- Size excludes the 4-byte header

---

## Section Types

Per RFC-0012 §4.4:

| Type | Value | Meaning |
|------|-------|---------|
| CODE | 0x01 | Instruction stream |
| DATA | 0x02 | Object pool data |
| META | 0x03 | Metadata (non-executable) |
| PROOF | 0x04 | Proof witness data |

**Note:** RFC-0012 uses CODE/DATA/META/PROOF, while older dev-docs reference STRTAB/POLYTAB/PROG/AVD. The RFC-0012 naming is canonical.

---

## CRC32 Checksum

**Algorithm:** Standard CRC-32 (polynomial 0xEDB88320)

**Computation:**
1. Create temporary header with `header_checksum` set to 0
2. Encode header to 16 bytes (big-endian)
3. Compute CRC32 of the 16 bytes
4. Store result in `header_checksum` field

**Validation:**
- Decode header from bytes
- Compute CRC32 using same algorithm
- Compare with stored `header_checksum`
- If mismatch, header is invalid

---

## Implementation Files

- `canb_container.h` — Container format interface
- `canb_container.c` — Container format implementation

**Functions:**
- `canb_decode_header()` — Decode header from bytes
- `canb_encode_header()` — Encode header to bytes
- `canb_validate_header()` — Validate header (magic, version, flags, checksum)
- `canb_compute_header_crc32()` — Compute header CRC32
- `canb_decode_section_header()` — Decode section header
- `canb_encode_section_header()` — Encode section header
- `canb_get_section_size()` — Get 24-bit section size
- `canb_set_section_size()` — Set 24-bit section size

---

## Byte Ordering

All multi-byte fields are **big-endian**:
- `section_count` (uint16_t)
- `header_checksum` (uint32_t)
- `reserved` (uint32_t)
- `section_size` (24-bit, stored as 3 bytes)

This preserves RFC-0012 §7.1 (Byte-Identical Determinism).

---

## RFC Compliance

### RFC-0012 Compliance
- ✅ Container header format (RFC-0012 §4.2)
- ✅ Section format (RFC-0012 §4.3)
- ✅ Section types (RFC-0012 §4.4)
- ✅ CRC32 checksum (RFC-0012 §4.2)
- ✅ Big-endian byte ordering (RFC-0012 §7.1)
- ✅ Validation rules (RFC-0012 §9.2)

### RFC-0000 Compliance
- ✅ CAN-INV-3 (Decode/Encode Soundness) — Round-trip encoding preserved
- ✅ CAN-INV-4 (Deterministic Encoding) — Big-endian ensures determinism

---

## Usage Example

```c
// Create container header
canb_header_t header;
memcpy(header.magic, "CANB", 4);
header.ver = 0x01;
header.flags = 0;
header.section_count = 2;
header.reserved = 0;
header.header_checksum = canb_compute_header_crc32(&header);

// Encode to bytes
uint8_t header_bytes[16];
canb_encode_header(&header, header_bytes);

// Decode from bytes
canb_header_t decoded;
canb_decode_header(header_bytes, &decoded);

// Validate
if (canb_validate_header(&decoded)) {
  // Header is valid
}
```

---

**Last Updated:** 2025-01-XX  
**Maintained by:** Agent 2 — CAN-ISA / BINARY ENCODING ENGINEER


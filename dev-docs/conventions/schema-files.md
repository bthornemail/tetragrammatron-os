# Schema File Formats and Structures

## Overview

This document defines the file formats and structures for address schemas in Tetragrammatron-OS.

## YAML Schema Format

### File: `address-schema.yaml`

The authoritative, human-editable schema definition.

```yaml
schema: tetragrammatron/address-schema@v2
endianness: big
rows: 8
schema_rows: 5

rowspec:
  R0:
    name: realm
    fixed: true
    allowed: [0x00, 0x01, 0x1A]
    mode: any

  R1:
    name: ontology
    fixed: true
    allowed: [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]
    mode: any

  R2:
    name: capability
    fixed: true
    allowed: [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]
    mode: any

  R3:
    name: process
    fixed: true
    allowed: [0x01, 0x02, 0x03, 0x04, 0x05, 0x06]
    mode: any

  R4:
    name: context
    fixed: true
    allowed: [0x01, 0x02, 0x03, 0x04, 0x05, 0x06]
    mode: public4  # or private7, any

  R5:
    name: instance_a
    fixed: false

  R6:
    name: instance_b
    fixed: false

  R7:
    name: instance_c
    fixed: false
```

### Field Descriptions

- **schema**: Schema identifier with version
- **endianness**: Byte order (big/little)
- **rows**: Total number of address bytes (always 8)
- **schema_rows**: Number of schema bytes (always 5)
- **rowspec**: Per-row specifications
  - **name**: Semantic name for the row
  - **fixed**: `true` for schema rows, `false` for instance rows
  - **allowed**: List of allowed byte values (hex or decimal)
  - **mode**: `any`, `private7`, or `public4` (for projection constraints)

## Dev Mode JSONL Format

### File: `schema.jsonl`

Development-friendly format for Obsidian and web viewer.

```json
{
  "k": "schema.def",
  "v": {
    "realm": "1A",
    "schema_hash": "a9f3c21d9e4b0a77d1a5f0b3a9e7c2ff",
    "schema_class": "public",
    "epoch": 3,
    "rows": 8,
    "schema_rows": 5,
    "allowed_prefixes": [
      "1A:02:04:03:02::/40",
      "1A:02:04:03:03::/40"
    ]
  }
}
```

### Field Descriptions

- **k**: Record type (`"schema.def"`)
- **v**: Schema definition
  - **realm**: Realm byte as hex string
  - **schema_hash**: 16-byte hash as hex (32 chars)
  - **schema_class**: `"private"`, `"protected"`, or `"public"`
  - **epoch**: Monotonic version counter
  - **rows**: Total address bytes (8)
  - **schema_rows**: Schema bytes (5)
  - **allowed_prefixes**: List of valid prefix40 strings

## Binary ABI Format

### ABI v2 (Current)

Compact binary format for embedded nodes.

**Layout:**
```
offset size  field
0      4     magic = "TADR"
4      2     abi = 2 (little-endian)
6      1     rows = 8
7      1     schema_rows = 5
8      1     schema_class (0=private, 1=protected, 2=public)
9      1     realm (R0 byte)
10     2     epoch (little-endian)
12     1     prefix_count = N
13     5*N   allowed_prefixes (each 5 bytes: R0-R4)
```

**Total size:** ~13 + (5 × prefix_count) bytes

### ABI v3 (Future: Embedded Signatures)

Extends v2 with embedded Ed25519 signature:

```
... (v2 fields) ...
13+5*N  32    pubkey_ed25519
45+5*N  64    sig_ed25519
```

## Signature Sidecar Format

### File: `{key}.sig.json`

Human-readable signature metadata.

```json
{
  "k": "schema.sig",
  "v": {
    "realm": "1A",
    "schema_hash": "a9f3c21d9e4b0a77d1a5f0b3a9e7c2ff",
    "schema_class": "public",
    "epoch": 3,
    "abi": 2,
    "signed_over": "1A|a9f3c21d9e4b0a77d1a5f0b3a9e7c2ff.bin",
    "pubkey_ed25519": "a1b2c3d4e5f6...",
    "sig_ed25519": "1234567890abcdef..."
  }
}
```

### Field Descriptions

- **k**: Record type (`"schema.sig"`)
- **v**: Signature metadata
  - **realm**: Realm byte as hex
  - **schema_hash**: Schema hash as hex
  - **schema_class**: Class string
  - **epoch**: Schema epoch
  - **abi**: ABI version
  - **signed_over**: Filename of signed binary
  - **pubkey_ed25519**: Public key as hex (64 chars)
  - **sig_ed25519**: Signature as hex (128 chars)

## File Organization

### Recommended Directory Structure

```
schemas/
  address-schema.yaml          # Source of truth
  schema.jsonl                 # Dev mode (optional)
  build/
    address-schema.bin         # Compiled binary
    1A|a9f3c2....bin          # Per-schema binaries
    1A|a9f3c2....sig.json     # Signatures
```

### Versioning

- **Schema version**: In YAML (`@v2`)
- **ABI version**: In binary header (2, 3, ...)
- **Epoch**: Monotonic counter for schema evolution
- **Schema hash**: Content fingerprint

## Schema Hash Computation

The schema hash is computed over:

1. **Canonicalized rowspec**:
   - Sort allowed values per row
   - Normalize structure
   - Remove comments/whitespace

2. **Serialize to bytes**:
   - JSON stringification of canonical form
   - UTF-8 encoding

3. **SHA-256**:
   - Hash the bytes
   - Truncate to 16 bytes

This ensures:
- Reorder-safe
- Whitespace-safe
- Comment-safe
- Deterministic

## Related Documentation

- [Architecture: Address Schema](../architecture/address-schema.md)
- [Conventions: Address Schema](./address-schema.md)
- [Implementation Patterns: Schema Compilation](../implementation-patterns/schema-compilation.md)
- [Coding Principles: Immutability](../coding-principles/immutability.md)
- [Coding Principles: Determinism](../coding-principles/determinism.md)


# Address Schema Conventions

## Overview

This document defines naming conventions, format standards, and file organization for address schemas in Tetragrammatron-OS.

## Address Format

### Canonical Format

Addresses are exactly **8 bytes**, represented as:

```
R0:R1:R2:R3:R4:R5:R6:R7
```

Where each component is a **2-digit hexadecimal byte** (00-FF).

**Examples:**
- `1A:02:04:03:02:7F:11:C7`
- `00:01:02:01:01:AA:BB:CC`

### Prefix40 Format

The schema portion (R0-R4) is represented as:

```
R0:R1:R2:R3:R4::/40
```

**Examples:**
- `1A:02:04:03:02::/40`
- `00:01:02:01:01::/40`

This notation is used for:
- Routing table keys
- Obsidian Bases grouping
- Three.js scene hierarchy
- Mesh prefix matching

### Filesystem-Safe Encoding

For filesystem paths, use underscore encoding:

```
R0_R1_R2_R3_R4_R5_R6_R7
```

Or directory form:

```
R0/R1/R2/R3/R4/R5/R6/R7/
```

**Examples:**
- `1A_02_04_03_02_7F_11_C7`
- `1A/02/04/03/02/7F/11/C7/`

## Schema File Naming

### YAML Source

**File:** `address-schema.yaml`

**Location:** Repository root or `schemas/` directory

**Format:** YAML with canonical structure

### Binary Compiled

**File:** `address-schema.bin` or `{realm}|{hash}.bin`

**Location:** `build/` directory or `schemas/` directory

**Format:** Binary ABI v2 or v3

**Naming convention:**
- Single schema: `address-schema.bin`
- Multiple schemas: `{realm}|{hash}.bin` (e.g., `1A|a9f3c21d9e4b0a77d1a5f0b3a9e7c2ff.bin`)

### Signature Sidecar

**File:** `{key}.sig.json`

**Location:** Same directory as binary

**Format:** JSON with signature metadata

**Example:** `1A|a9f3c21d9e4b0a77d1a5f0b3a9e7c2ff.sig.json`

### Dev Mode JSONL

**File:** `schema.jsonl`

**Location:** `public/schemas/` or `schemas/` directory

**Format:** JSONL with one schema per line

## Schema Key Format

Schema keys are used for registry lookups and file naming:

```
{realm}|{schema_hash}
```

Where:
- `realm` = R0 byte as hex (e.g., `1A`)
- `schema_hash` = 16-byte hash as hex (32 hex chars)

**Examples:**
- `1A|a9f3c21d9e4b0a77d1a5f0b3a9e7c2ff`
- `00|deadbeefdeadbeefdeadbeefdeadbeef`

## Address Parsing Conventions

### Input Formats Accepted

1. **Colon-separated hex**: `1A:02:04:03:02:7F:11:C7` (canonical)
2. **Space-separated hex**: `1A 02 04 03 02 7F 11 C7`
3. **No separators**: `1A020403027F11C7` (16 hex chars)
4. **Array notation**: `[0x1A, 0x02, 0x04, 0x03, 0x02, 0x7F, 0x11, 0xC7]`

### Normalization

All addresses should be normalized to:
- Uppercase hex digits
- Colon-separated
- Zero-padded bytes (2 digits each)

**Example:**
- Input: `1a:2:4:3:2:7f:11:c7`
- Normalized: `1A:02:04:03:02:7F:11:C7`

## Schema Registry Conventions

### Registry Key Format

```
{realm}|{schema_hash}
```

### Registry Entry Structure

```c
typedef struct {
  SchemaKey key;           // "1A|a9f3c2..."
  SchemaTable table;       // Loaded schema
  uint32_t last_used;      // LRU timestamp
  uint8_t ref_count;       // Reference count
} RegistryEntry;
```

## Obsidian Conventions

### Frontmatter Fields

Every node note should include:

```yaml
---
addr: "1A:02:04:03:02:7F:11:C7"
r0: "1A"
r1: "02"
r2: "04"
r3: "03"
r4: "02"
r5: "7F"
r6: "11"
r7: "C7"
realm: ulp
ontology: device
capability: route
process: consensus
context: public
prefix40: "1A:02:04:03:02::/40"
schema_hash: "a9f3c21d9e4b0a77d1a5f0b3a9e7c2ff"
schema_version: v2
---
```

### File Naming

Node files can be named:
- By address: `1A_02_04_03_02_7F_11_C7.md`
- By semantic name: `esp32-router.md` (with address in frontmatter)
- By prefix: `1A_02_04_03_02/7F_11_C7.md`

## Three.js Conventions

### Scene Hierarchy

```
Scene
├── Realm (R0)
│   ├── Ontology (R1)
│   │   ├── Capability (R2)
│   │   │   ├── Process (R3)
│   │   │   │   ├── Context (R4)
│   │   │   │   │   └── Instance (R5-R7) → Mesh/Object3D
```

### Group Naming

Groups are named by prefix40:
- `1A:02:04:03:02::/40` → Group object

## ESP32 Conventions

### Packet Header

```
MAGIC(4) | realm(1) | schema_hash(16) | addr8(8) | flags(1) | payload...
```

### Routing Table

Keyed on `(realm, schema_hash, prefix40)`:
- Exact match on prefix40
- Longest prefix match for routing
- Schema-aware interpretation

## Related Documentation

- [Architecture: Address Schema](../architecture/address-schema.md)
- [Architecture: ULP Addressing](../architecture/ulp-addressing.md)
- [Conventions: Schema Files](./schema-files.md)
- [Implementation Patterns: Schema Registry](../implementation-patterns/schema-registry.md)


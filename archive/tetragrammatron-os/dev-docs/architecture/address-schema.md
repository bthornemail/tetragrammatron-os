# Address Schema Architecture

## Overview

The Address Schema system provides the authoritative, data-driven specification for 8-byte addresses in Tetragrammatron-OS. It enforces the fundamental invariant:

> **Invalid schema prefixes cannot execute.**

This document describes the schema system, compilation pipeline, binary format, and registry architecture.

## Core Principle

**Schema is data, not code.**

The address schema is defined in human-readable YAML, compiled to a compact binary format for runtime use, and enforced identically across:
- Lean formal proofs
- ESP32 embedded nodes
- Web viewer visualization
- VM execution gates

## Address Structure

An address is exactly **8 bytes**, partitioned as:

```
R0 : R1 : R2 : R3 : R4 : R5 : R6 : R7
└──────── schema ────────┘ └── instance ──┘
```

### Schema Rows (R0-R4)

The first five bytes define **meaning** and are governed by the address schema:

- **R0: Realm** - Global universe / trust domain
  - `0x00` = local/dev
  - `0x01` = public global mesh
  - `0x1A` = Universal Life Protocol / Tetragrammatron

- **R1: Ontology** - What kind of entity
  - `0x01` = human
  - `0x02` = device
  - `0x03` = agent
  - `0x04` = service
  - `0x05` = document
  - `0x06` = constraint
  - `0x07` = environment

- **R2: Capability** - Primary capability or relation
  - `0x01` = observe
  - `0x02` = compute
  - `0x03` = store
  - `0x04` = route
  - `0x05` = decide
  - `0x06` = attest
  - `0x07` = transform

- **R3: Process** - Temporal behavior / protocol class
  - `0x01` = batch
  - `0x02` = stream
  - `0x03` = consensus
  - `0x04` = proof
  - `0x05` = execution
  - `0x06` = arbitration

- **R4: Context** - Interpretive and normative context
  - `0x01` = private
  - `0x02` = public
  - `0x03` = legal
  - `0x04` = scientific
  - `0x05` = religious
  - `0x06` = economic

### Instance Rows (R5-R7)

The last three bytes define **existence** and are free entropy:
- Hash fragments
- Counters
- MAC-derived bytes
- Nonce space

**Critical rule:** Instance bytes may only be assigned after schema prefix (R0-R4) is validated.

## Pascal's Triangle Mapping

The address schema corresponds to Pascal's triangle rows:

| Row | Meaning | Address Bytes |
|-----|---------|---------------|
| 0 | Identity (point) | R0 |
| 1 | Line / role | R1 |
| 2 | Plane / relation | R2 |
| 3 | Volume / process | R3 |
| 4 | Context / domain | R4 |
| **5** | **Execution / application instance** | R5-R7 |

This structural mapping ensures that:
- Rows 0-4 are **schema-controlled** (fixed, predefined)
- Row 5 is **instance-controlled** (free, entropy-based)

## Schema Definition Format

### YAML Source (`address-schema.yaml`)

The authoritative schema definition:

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

### Dev Mode JSONL (`schema.jsonl`)

For development and Obsidian integration:

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

## Binary ABI Format

### ABI v2 (Current)

Compact binary format for embedded nodes:

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

## Schema Compilation Pipeline

### 1. YAML → Binary

```bash
python3 tools/compile_schema.py address-schema.yaml -o build/address-schema.bin
```

The compiler:
- Validates YAML structure
- Normalizes allowed values
- Computes schema hash (SHA-256, truncated to 16 bytes)
- Generates deterministic binary output

### 2. Schema Hash Computation

The hash is computed over:
- Canonicalized rowspec (R0-R7, sorted allowed lists)
- Serialized to bytes
- SHA-256
- Truncated to 16 bytes

This ensures:
- Reorder-safe
- Whitespace-safe
- Comment-safe
- Deterministic

### 3. Binary Loading

Embedded nodes load the binary at boot:

```c
bool tg_schema_load_embedded(void) {
  const uint8_t *start = _binary_address_schema_bin_start;
  const uint8_t *end   = _binary_address_schema_bin_end;
  size_t len = (size_t)(end - start);
  return tg_schema_load_from_bytes(start, len, &g_tg_schema);
}
```

## Schema Registry Architecture

### Registry Structure

Each node maintains a **schema registry**:

```
SchemaRegistry : Map SchemaKey → SchemaTable
```

Where:
- **SchemaKey** = `realm|schema_hash` (17 bytes: 1 byte realm + 16 bytes hash)
- **SchemaTable** = loaded binary schema (~176 bytes)

### Registry Management

- **Bounded size**: Keep 8-16 active schemas (LRU eviction)
- **Lookup**: O(1) hash map lookup
- **Validation**: Check prefix against schema before execution

### Multi-Schema Coexistence

Multiple schemas can coexist for the same realm:
- Different `schema_hash` = different schema versions/epochs
- Nodes can support multiple schemas simultaneously
- Routing keys on `(realm, schema_hash, prefix40)`

## Prefix40 Notation

The **prefix40** notation represents the schema portion:

```
R0:R1:R2:R3:R4::/40
```

Examples:
- `1A:02:04:03:02::/40` - ULP realm, device, route, consensus, public
- `00:01:02:01:01::/40` - Local realm, human, compute, batch, private

This notation is used for:
- Routing table keys
- Obsidian Bases grouping
- Three.js scene hierarchy
- Mesh prefix matching

## Schema Validation

### Prefix Validation

```c
bool tg_schema_prefix_valid(const tg_schema_t *s, const tg_addr8_t *a) {
  // Validate R0..R4
  for (int i = 0; i < s->schema_rows; i++) {
    const tg_row_spec_t *r = &s->row[i];
    if (!r->fixed) continue;
    if (!one_of(a->r[i], r->allowed, r->allowed_count)) return false;
  }
  return true;
}
```

### Mode Enforcement

For rows with mode constraints (e.g., `public4`):

```c
bool tg_schema_mode_ok(const tg_schema_t *s,
                       const tg_addr8_t *a,
                       uint8_t projected_residue) {
  for (int i = 0; i < s->schema_rows; i++) {
    uint8_t mode = s->row[i].mode;
    if (mode == 1) { // private7
      if (projected_residue == 6) return false;
    }
    if (mode == 2) { // public4
      // Allowed residues: {0,1,3,5}
      if (!(projected_residue==0 || projected_residue==1 ||
            projected_residue==3 || projected_residue==5))
        return false;
    }
  }
  return true;
}
```

## Execution Gate

The fundamental execution rule:

```c
if (!tg_schema_prefix_valid_global(&addr)) {
  trap("invalid_schema");
} else {
  execute();
}
```

This is enforced at:
- VM execution boundary
- Mesh routing decision
- Projection operator
- Web viewer rendering

## Schema Versioning

### Version Components

- **ABI version**: Binary format version (2, 3, ...)
- **Schema version**: Semantic version in YAML (`@v2`)
- **Epoch**: Monotonic counter for schema evolution
- **Schema hash**: Content fingerprint

### Compatibility

- Nodes can support multiple ABI versions
- Schema negotiation handles version mismatches
- Backward compatibility maintained where possible

## Integration Points

### ESP32 Mesh Nodes
- Load embedded binary at boot
- Validate all incoming packets
- Negotiate schemas with neighbors
- Cache schemas in registry

### Web Viewer
- Load schemas from JSONL (dev) or BIN (prod)
- Validate node addresses
- Visualize schema groups
- Show validation status

### Lean Formal Proofs
- Import schema as `SchemaTable` structure
- Prove `invalid_schema_no_execute` theorem
- Verify execution gate soundness

### Obsidian Integration
- Frontmatter includes schema fields
- Bases groups by `prefix40`
- Canvas nodes reference schema

## Related Documentation

- [ULP Addressing](./ulp-addressing.md) - Address format and notation
- [Schema Negotiation](./schema-negotiation.md) - Mesh protocol
- [Triadic Law](./triadic-law.md) - Private/Protected/Public classes
- [Projection System](./projection-system.md) - Schema-gated projection
- [Formal Verification: Schema Gate Theorems](../formal-verification/schema-gate-theorems.md)
- [Implementation Patterns: Schema Compilation](../implementation-patterns/schema-compilation.md)


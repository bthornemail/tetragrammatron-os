# Schema Compilation Pattern

## Overview

The schema compilation pattern transforms human-readable YAML schema definitions into compact binary formats for embedded nodes. This pattern ensures deterministic compilation, schema integrity, and runtime efficiency.

## Pattern Structure

### Input: YAML Schema

**File:** `address-schema.yaml`

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
  # ... R1-R7 ...
```

### Output: Binary Schema

**File:** `address-schema.bin` (ABI v2)

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

## Compilation Process

### Step 1: Parse YAML

```python
import yaml

with open("address-schema.yaml", "r") as f:
    schema = yaml.safe_load(f)
```

### Step 2: Canonicalize

```python
def canonicalize_rowspec(rowspec):
    """Sort allowed values, normalize structure."""
    canonical = {}
    for i in range(8):
        key = f"R{i}"
        row = rowspec.get(key, {})
        canonical[key] = {
            "fixed": row.get("fixed", False),
            "allowed": sorted(row.get("allowed", []))
        }
    return canonical
```

### Step 3: Compute Hash

```python
import hashlib
import json

def compute_schema_hash(schema):
    """SHA-256, truncated to 16 bytes."""
    canonical = canonicalize_rowspec(schema["rowspec"])
    json_str = json.dumps(canonical, sort_keys=True)
    hash_bytes = hashlib.sha256(json_str.encode("utf-8")).digest()
    return hash_bytes[:16]  # Truncate to 16 bytes
```

### Step 4: Pack Binary

```python
def pack_binary(schema, hash_bytes):
    """Pack schema into binary ABI v2 format."""
    buf = bytearray()
    
    # Magic
    buf.extend(b"TADR")
    
    # ABI version (little-endian)
    buf.extend((2).to_bytes(2, "little"))
    
    # Rows
    buf.append(8)
    buf.append(5)  # schema_rows
    
    # Schema class
    class_map = {"private": 0, "protected": 1, "public": 2}
    buf.append(class_map.get(schema.get("schema_class", "public"), 2))
    
    # Realm
    realm = int(schema.get("realm", "00"), 16)
    buf.append(realm)
    
    # Epoch
    epoch = schema.get("epoch", 0)
    buf.extend(epoch.to_bytes(2, "little"))
    
    # Prefix count
    prefixes = schema.get("allowed_prefixes", [])
    buf.append(len(prefixes))
    
    # Allowed prefixes (5 bytes each)
    for prefix40 in prefixes:
        parts = prefix40.split("::")[0].split(":")
        for p in parts[:5]:
            buf.append(int(p, 16))
    
    return bytes(buf)
```

## Determinism Guarantees

### Same Input → Same Output

The compilation is **completely deterministic**:

1. **Canonicalization**: Sorts allowed values, normalizes structure
2. **Hash computation**: Deterministic JSON serialization
3. **Binary packing**: Fixed layout, no randomness

### Verification

```python
def verify_compilation(yaml_path, bin_path):
    """Verify that YAML compiles to expected binary."""
    with open(yaml_path, "r") as f:
        schema = yaml.safe_load(f)
    
    expected_bin = compile_schema(schema)
    
    with open(bin_path, "rb") as f:
        actual_bin = f.read()
    
    assert expected_bin == actual_bin, "Compilation mismatch"
```

## Integration Points

### ESP32 Embedded Nodes

```c
// Load embedded binary at boot
bool tg_schema_load_embedded(void) {
  const uint8_t *start = _binary_address_schema_bin_start;
  const uint8_t *end   = _binary_address_schema_bin_end;
  size_t len = (size_t)(end - start);
  return tg_schema_load_from_bytes(start, len, &g_tg_schema);
}
```

### Web Viewer

```typescript
// Load and decode binary
async function fetchSchemaBin(url: string): Promise<SchemaTable> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  return decodeSchemaBin(new Uint8Array(buf));
}
```

### Lean Formal Proofs

```lean
-- Import schema as structure
structure SchemaTable where
  fixed   : Fin 8 → Bool
  allowed : Fin 8 → Finset UInt8
```

## Error Handling

### Invalid YAML

- Parse errors: Report line/column
- Missing required fields: List missing fields
- Invalid values: Report expected vs actual

### Invalid Binary

- Magic mismatch: Report expected "TADR"
- ABI version unsupported: Report supported versions
- Size mismatch: Report expected vs actual size

## Related Patterns

- [Schema Registry](./schema-registry.md) - Runtime schema management
- [Signature Verification](./signature-verification.md) - Schema signing
- [Validation Patterns](./validation-patterns.md) - Schema validation

## Related Documentation

- [Architecture: Address Schema](../architecture/address-schema.md)
- [Conventions: Schema Files](../conventions/schema-files.md)
- [Coding Principles: Determinism](../coding-principles/determinism.md)
- [Code Examples: Schema Compilation](../code-examples/javascript/schema-compilation.js)


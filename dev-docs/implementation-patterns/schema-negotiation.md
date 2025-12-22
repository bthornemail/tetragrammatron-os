# Schema Negotiation Pattern

## Overview

The schema negotiation pattern enables mesh nodes to discover, acquire, and validate address schemas without central authority. It supports multi-schema coexistence where different schemas can operate in parallel realms.

## Pattern Structure

### Schema Key Format

Every schema is identified by:

```
SchemaKey = realm_byte || schema_hash16
```

Where:
- `realm_byte` = R0 byte (1 byte)
- `schema_hash16` = SHA-256 truncated to 16 bytes

Total: **17 bytes**

### Registry Structure

```c
typedef struct {
  SchemaKey key;           // "1A|a9f3c2..."
  SchemaTable table;       // Loaded schema
  uint32_t last_used;      // LRU timestamp
  uint8_t ref_count;       // Reference count
} RegistryEntry;

#define MAX_REGISTRY_SIZE 16
RegistryEntry registry[MAX_REGISTRY_SIZE];
```

## Negotiation Protocol

### Message Types

#### HELLO

Broadcast periodically or on mesh join.

```json
{
  "t": "HELLO",
  "node": "aa:bb:cc:dd:ee:ff",
  "realms": ["00", "1A"],
  "schemas": [
    { "realm": "1A", "hash": "a9f3...c2ff", "class": "public", "epoch": 3 }
  ]
}
```

#### SCHEMA_NEED

Request for a missing schema.

```json
{
  "t": "SCHEMA_NEED",
  "r": "1A",
  "h": "a9f3c21d9e4b0a77d1a5f0b3a9e7c2ff"
}
```

#### SCHEMA_CHUNK

Chunked binary schema transfer.

```json
{
  "t": "SCHEMA_CHUNK",
  "r": "1A",
  "h": "a9f3...c2ff",
  "i": 0,
  "n": 3,
  "b64": "..."
}
```

## Implementation

### On Packet Receive

```c
if (!meta_or_canbc_header_ok(pkt)) drop();

SchemaKey k = { realm, hash16 };

if (!registry_has(k)) {
  send_schema_need(k, sender);
  drop(); // fail closed
}

if (!prefix_valid(registry[k], addr8)) trap_or_drop();

if (!mode_ok(registry[k], projected_residue)) trap_or_drop();

if (!class_ok(registry[k], trust_ctx)) trap_or_drop();

execute_or_route();
```

### Registry Lookup

```c
RegistryEntry* registry_lookup(SchemaKey key) {
  for (int i = 0; i < MAX_REGISTRY_SIZE; i++) {
    if (memcmp(&registry[i].key, &key, sizeof(SchemaKey)) == 0) {
      registry[i].last_used = xTaskGetTickCount();
      return &registry[i];
    }
  }
  return NULL;
}
```

### LRU Eviction

```c
void registry_evict_lru(void) {
  uint32_t oldest = UINT32_MAX;
  int oldest_idx = -1;
  
  for (int i = 0; i < MAX_REGISTRY_SIZE; i++) {
    if (registry[i].ref_count == 0 && 
        registry[i].last_used < oldest) {
      oldest = registry[i].last_used;
      oldest_idx = i;
    }
  }
  
  if (oldest_idx >= 0) {
    memset(&registry[oldest_idx], 0, sizeof(RegistryEntry));
  }
}
```

## Class-Based Negotiation

### Negotiation Matrix

| Local \ Remote | Private | Protected | Public |
|----------------|---------|-----------|--------|
| **Private**    | ❌      | ❌        | ❌     |
| **Protected** | ❌      | ✅ (auth) | ❌     |
| **Public**    | ❌      | ❌        | ✅     |

### Implementation

```c
bool can_negotiate_schema(SchemaClass local, SchemaClass remote) {
  if (local == SCHEMA_PRIVATE || remote == SCHEMA_PRIVATE) {
    return false;  // Private never negotiated
  }
  if (local == SCHEMA_PROTECTED && remote == SCHEMA_PROTECTED) {
    return true;  // Protected with authentication
  }
  if (local == SCHEMA_PUBLIC && remote == SCHEMA_PUBLIC) {
    return true;  // Public freely shared
  }
  return false;
}
```

## Safety and Trust Policy

### Local Allowlist

```c
typedef struct {
  uint8_t allowed_realms[8];
  uint8_t realm_count;
  uint8_t max_schema_size;
  uint16_t min_abi_version;
} TrustPolicy;

bool schema_passes_policy(SchemaTable *tab, TrustPolicy *policy) {
  // Check realm
  bool realm_ok = false;
  for (int i = 0; i < policy->realm_count; i++) {
    if (tab->realm == policy->allowed_realms[i]) {
      realm_ok = true;
      break;
    }
  }
  if (!realm_ok) return false;
  
  // Check ABI version
  if (tab->abi_version < policy->min_abi_version) return false;
  
  // Check size
  if (tab->size > policy->max_schema_size) return false;
  
  return true;
}
```

## Related Patterns

- [Schema Registry](./schema-registry.md) - Registry management
- [Signature Verification](./signature-verification.md) - Schema signing
- [Schema Compilation](./schema-compilation.md) - Binary format

## Related Documentation

- [Architecture: Schema Negotiation](../architecture/schema-negotiation.md)
- [Architecture: Triadic Law](../architecture/triadic-law.md)
- [Coding Principles: Triadic Trust](../coding-principles/triadic-trust.md)


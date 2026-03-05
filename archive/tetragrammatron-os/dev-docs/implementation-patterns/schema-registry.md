# Schema Registry Pattern

## Overview

The schema registry pattern provides runtime schema management for mesh nodes. It maintains a bounded cache of active schemas with LRU eviction, enabling efficient schema lookup and validation.

## Pattern Structure

### Registry Entry

```c
typedef struct {
  SchemaKey key;           // "1A|a9f3c2..." (17 bytes)
  SchemaTable table;       // Loaded schema (~176 bytes)
  uint32_t last_used;      // LRU timestamp
  uint8_t ref_count;       // Reference count
} RegistryEntry;
```

### Registry Array

```c
#define MAX_REGISTRY_SIZE 16
RegistryEntry registry[MAX_REGISTRY_SIZE];
```

**Total memory:** ~16 × 200 bytes = 3.2KB (perfect for ESP32)

## Operations

### Lookup

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

**Complexity:** O(n) where n = registry size (typically 8-16)

### Insert

```c
bool registry_insert(SchemaKey key, SchemaTable *table) {
  // Check if already exists
  RegistryEntry *existing = registry_lookup(key);
  if (existing) {
    existing->table = *table;
    existing->last_used = xTaskGetTickCount();
    return true;
  }
  
  // Find empty slot
  for (int i = 0; i < MAX_REGISTRY_SIZE; i++) {
    if (registry[i].key.realm == 0 && registry[i].key.hash[0] == 0) {
      registry[i].key = key;
      registry[i].table = *table;
      registry[i].last_used = xTaskGetTickCount();
      registry[i].ref_count = 0;
      return true;
    }
  }
  
  // Evict LRU and insert
  registry_evict_lru();
  return registry_insert(key, table);  // Retry
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

### Reference Counting

```c
void registry_inc_ref(SchemaKey key) {
  RegistryEntry *entry = registry_lookup(key);
  if (entry) {
    entry->ref_count++;
  }
}

void registry_dec_ref(SchemaKey key) {
  RegistryEntry *entry = registry_lookup(key);
  if (entry && entry->ref_count > 0) {
    entry->ref_count--;
  }
}
```

## Usage Pattern

### On Boot

```c
void registry_init(void) {
  // Load embedded default schemas
  SchemaKey key1 = { .realm = 0x1A, .hash = {...} };
  SchemaTable tab1;
  if (tg_schema_load_embedded(&tab1)) {
    registry_insert(key1, &tab1);
  }
}
```

### On Packet Receive

```c
void handle_packet(Packet *pkt) {
  SchemaKey k = { pkt->realm, pkt->schema_hash };
  
  RegistryEntry *entry = registry_lookup(k);
  if (!entry) {
    // Request schema
    send_schema_need(k, pkt->sender);
    return;
  }
  
  // Validate prefix
  if (!tg_schema_prefix_valid(&entry->table, &pkt->addr)) {
    trap("invalid_schema");
    return;
  }
  
  // Execute
  execute(pkt);
}
```

## Performance Considerations

### Lookup Optimization

For larger registries, consider hash map:

```c
#define REGISTRY_HASH_SIZE 32

typedef struct {
  SchemaKey key;
  RegistryEntry *entry;
} HashBucket;

HashBucket hash_table[REGISTRY_HASH_SIZE];

uint8_t hash_key(SchemaKey key) {
  return (key.realm ^ key.hash[0] ^ key.hash[15]) % REGISTRY_HASH_SIZE;
}
```

### Memory Bounds

- **Bounded size**: Fixed array prevents unbounded growth
- **LRU eviction**: Keeps most recently used schemas
- **Reference counting**: Prevents eviction of active schemas

## Related Patterns

- [Schema Negotiation](./schema-negotiation.md) - Schema acquisition
- [Schema Compilation](./schema-compilation.md) - Binary format
- [Signature Verification](./signature-verification.md) - Schema signing

## Related Documentation

- [Architecture: Schema Negotiation](../architecture/schema-negotiation.md)
- [Architecture: Address Schema](../architecture/address-schema.md)
- [Code Examples: Schema Registry](../code-examples/javascript/schema-compilation.js)


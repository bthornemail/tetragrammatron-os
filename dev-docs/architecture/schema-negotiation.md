# Schema Negotiation Architecture

## Overview

Schema negotiation enables mesh nodes to discover, acquire, and validate address schemas without central authority. It supports **multi-schema coexistence** where different schemas can operate in parallel realms, and nodes can participate in multiple schema families simultaneously.

## Core Principle

> **A realm is a schema namespace, not merely a label.**

- A realm byte (R0) selects a schema family
- A node MAY support multiple realms simultaneously
- An address is valid only relative to the realm's active schema
- Schema negotiation occurs before execution

## Schema Key Format

Every schema is identified by:

```
SchemaKey = realm_byte || schema_hash16
```

Where:
- `realm_byte` = R0 byte (1 byte)
- `schema_hash16` = SHA-256 truncated to 16 bytes

Total: **17 bytes**

This allows:
- Same R1-R4 values to mean different things in different realms
- Multiple schema versions per realm (different hashes)
- Parallel worlds without ambiguity

## Packet Header Schema Addressing

Every packet MUST include schema context:

```
MAGIC(4) | realm(1) | schema_hash(16) | addr8(8) | flags(1) | payload...
```

**Gate rule:**
- If `(realm, schema_hash)` unknown → **do not execute**, optionally request schema
- If known but prefix invalid under that schema → **drop/trap**

## Negotiation Protocol

### Meta-Protocol Realm

Negotiation uses a **fixed meta-protocol** before schemas are known:

- **Realm `0x00`** = "local/meta" (hardcoded in firmware)
- Schema version fixed in firmware
- Used only for schema discovery and transfer

### Message Types

#### HELLO

Broadcast periodically or on mesh join.

**Fields:**
- `node_id` (MAC or derived)
- `supported_realms`: list of realm bytes
- `known_schema_keys`: list of `(realm, hash16)` pairs
- `preferred_schema` per realm (optional)
- `capabilities` (route/compute/etc)

**Purpose:**
- Announces what schemas node can speak
- Enables multi-schema routing immediately
- Discovers neighbors' schema support

**Example:**
```json
{
  "t": "HELLO",
  "node": "aa:bb:cc:dd:ee:ff",
  "realms": ["00", "1A"],
  "schemas": [
    { "realm": "1A", "hash": "a9f3...c2ff", "class": "public", "epoch": 3 },
    { "realm": "1A", "hash": "7c21...", "class": "protected", "epoch": 1 }
  ]
}
```

#### SCHEMA_OFFER

A node announces schema availability.

**Fields:**
- `realm`
- `schema_hash`
- `schema_size` (optional)
- `abi_version` (optional)
- `schema_class` (private/protected/public)

**Used when:**
- Node changes schema
- Node detects neighbor mismatch
- After HELLO if wanting to advertise

#### SCHEMA_NEED

Request for a missing schema.

**Fields:**
- `realm`
- `schema_hash`

**Sent to:**
- Original packet sender
- Best neighbor (routing table)
- Broadcast if unknown origin

**Example:**
```json
{
  "t": "SCHEMA_NEED",
  "r": "1A",
  "h": "a9f3c21d9e4b0a77d1a5f0b3a9e7c2ff"
}
```

#### SCHEMA_CHUNK

Chunked binary schema transfer.

**Fields:**
- `realm`
- `hash16`
- `total_len` (u16)
- `chunk_index` (u8 or u16)
- `chunk_count`
- `bytes[]` (base64 or raw)

**Integrity rule:**
- Node assembles bytes → validates:
  - magic/version/rows/schema_rows
  - computed hash matches advertised hash
- Only then insert into registry

**Example:**
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

#### SCHEMA_ACK

Confirmation of successful schema installation.

**Fields:**
- `realm`
- `schema_hash`

#### SCHEMA_REJECT

Rejection of schema (with reason).

**Fields:**
- `realm`
- `schema_hash`
- `reason` (hash_mismatch, abi_unsupported, policy_forbidden)

## Negotiation Matrix

Schema class determines negotiation behavior:

| Local \ Remote | Private | Protected | Public |
|----------------|---------|-----------|--------|
| **Private**    | ❌      | ❌        | ❌     |
| **Protected** | ❌      | ✅ (auth) | ❌     |
| **Public**    | ❌      | ❌        | ✅     |

**Meaning:**
- **Private schemas**: Never negotiated (local-only)
- **Protected schemas**: Require shared trust (authenticated peers)
- **Public schemas**: Globally cacheable (freely shared)

This prevents:
- Schema leakage
- Accidental authority escalation
- Silent drift

## Safety and Trust Policy

### Local Allowlist

Each node has a local policy:

- **Allowed realms**: Which realm bytes to accept
- **Allowed schema hashes**: Optional allowlist (pinned hashes)
- **Max schema size**: Prevent DoS
- **Required ABI version**: Minimum ABI support
- **Required signature**: For protected/public (future)

If schema fails policy → **REJECT**.

### Execution Gate

**Critical rule:** Execution never occurs without schema.

Even if routing is possible, execution requires:
1. Schema installed in registry
2. Schema validated (signature if required)
3. Prefix valid under schema
4. Class admissible (trust context)

## Routing with Parallel Realms

### Routing Table Key

```
SchemaKey = (realm, hash16)
Prefix40 = R0..R4 (interpreted under that schema)
next_hop(s)
```

### Important Note

Prefix values must not be interpreted without schema (labels), but routing can still match raw bytes.

So routing can operate on:
- Exact `R0..R4` bytes
- Within a given schema key
- Schema-agnostic byte matching

## Schema Resolution

### Same Realm, Different Schema Hash

This is **allowed** and means:
- Nodes are in different "epochs" or "forks"
- They can coexist and route separately
- To communicate, one node must acquire the other schema

### Schema Preference and Convergence

To converge without central authority:

- **Preferred schema hash** based on:
  - Majority seen in neighborhood
  - Highest "epoch" number
  - Explicit operator pin

Schema header can include:
- `epoch` (u32) - Monotonic counter
- `compat_min_epoch` - Backward compatibility
- `supersedes` hash - Upgrade path

## ESP32 Implementation

### On Boot

1. Load embedded default schemas (1-3 realms)
2. Broadcast HELLO
3. Accept OFFERS and acquire needed schemas

### On Packet Receive (Critical Path)

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

This is the **complete OS security story** in one gate.

## Schema Registry Management

### Registry Structure

```c
typedef struct {
  SchemaKey key;
  SchemaTable table;
  uint32_t last_used;
  uint8_t ref_count;
} RegistryEntry;

#define MAX_REGISTRY_SIZE 16
RegistryEntry registry[MAX_REGISTRY_SIZE];
```

### LRU Eviction

When registry is full:
1. Find entry with lowest `last_used`
2. If `ref_count == 0`, evict
3. Otherwise, reject new schema (or increase registry size)

### Lookup Performance

- Hash map: O(1) lookup by `SchemaKey`
- Bounded memory: ~16 × 200 bytes = 3.2KB
- Perfect for ESP32 constraints

## Formal Statement

The formal property we prove:

> If execution occurs, then a schema for that realm/hash existed and validated the prefix.

**Lean theorem:**
```lean
theorem exec_implies_schema_present
  (reg : SchemaRegistry) (pkt : Packet) :
  executes reg pkt →
  ∃ tab, reg.lookup pkt.schemaKey = some tab ∧ 
         schemaValid tab pkt.addr pkt.residue
```

This is the **proof-carrying boundary** for distributed nodes.

## Wire Formats

### Compact Binary (Recommended)

For ESP-NOW / UDP:
- Fixed-size headers
- Binary schema chunks
- Minimal overhead

### JSON (Development)

For debugging and development:
- Human-readable
- Easy to inspect
- Can switch to binary later

## Integration Points

### Mesh Routing
- Prefix matching on `(realm, hash, prefix40)`
- Multi-hop schema propagation
- Convergence detection

### Web Viewer
- Loads schemas from JSONL (dev) or BIN (prod)
- Validates node addresses
- Shows schema negotiation status

### Obsidian
- Schema definitions in vault
- Version tracking
- Trust visualization

## Related Documentation

- [Address Schema](./address-schema.md) - Schema format and structure
- [Triadic Law](./triadic-law.md) - Private/Protected/Public classes
- [Implementation Patterns: Schema Negotiation](../implementation-patterns/schema-negotiation.md)
- [Implementation Patterns: Schema Registry](../implementation-patterns/schema-registry.md)
- [Formal Verification: Schema Gate Theorems](../formal-verification/schema-gate-theorems.md)


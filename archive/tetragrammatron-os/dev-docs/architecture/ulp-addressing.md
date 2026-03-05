# ULP Addressing Architecture

## Overview

ULP Addressing (ULA) is an IPv6-inspired, semantic addressing scheme for Tetragrammatron-OS. It provides deterministic, hierarchical addressing for virtual files, nodes, hardware profiles, and mesh identities - independent of networking protocols.

## Core Concept

> **Use IPv6-like notation as a naming and addressing scheme, not as a network protocol.**
> Treat it as a semantic address for virtual files, nodes, and profiles derived from 8×8-bit registers.

You are not proposing "IP networking". You are proposing:

- **64-bit or 128-bit canonical addresses**
- derived from **8 registers × 8 bits**
- used to name:
  - virtual files
  - nodes
  - hardware/software profiles
  - mesh identities
  - projections in the sphere

## Canonical Address Shape

### Raw Form (Machine)
```text
R = (r0, r1, r2, r3, r4, r5, r6, r7)
where each ri ∈ [0,255]
```

This is your **8-tuple polynomial constraint vector**.

### Canonical Textual Form (Human)

Use **IPv6 colon-hex**, but **semantic, not networked**:

```text
ulp:xxxx:xxxx:xxxx:xxxx
```

Where each `xxxx` = 16 bits = two registers:

```text
r0 r1 : r2 r3 : r4 r5 : r6 r7
```

Example:
```text
ulp:01a4:ff02:3c10:0007
```

This is:
- stable
- sortable
- compressible
- copyable
- file-system safe (with minor encoding)

## 8-Register Semantic Mapping (Canonical 5+3 Schema)

The address is partitioned into **schema** (R0-R4) and **instance** (R5-R7):

```
R0 : R1 : R2 : R3 : R4 : R5 : R6 : R7
└──────── schema ────────┘ └── instance ──┘
```

### Schema Rows (R0-R4) - Fixed, Predefined

The first five bytes define **meaning** and are governed by the address schema:

| Register | Name | Meaning | Allowed Values |
|----------|------|---------|---------------|
| R0 | Realm | Global universe / trust domain | `0x00`=local, `0x01`=public, `0x1A`=ULP |
| R1 | Ontology | What kind of entity | `0x01`=human, `0x02`=device, `0x03`=agent, `0x04`=service, `0x05`=document, `0x06`=constraint, `0x07`=environment |
| R2 | Capability | Primary capability or relation | `0x01`=observe, `0x02`=compute, `0x03`=store, `0x04`=route, `0x05`=decide, `0x06`=attest, `0x07`=transform |
| R3 | Process | Temporal behavior / protocol class | `0x01`=batch, `0x02`=stream, `0x03`=consensus, `0x04`=proof, `0x05`=execution, `0x06`=arbitration |
| R4 | Context | Interpretive and normative context | `0x01`=private, `0x02`=public, `0x03`=legal, `0x04`=scientific, `0x05`=religious, `0x06`=economic |

**Critical rule:** Schema rows (R0-R4) must be valid according to the address schema before any execution or routing can occur.

### Instance Rows (R5-R7) - Free Entropy

The last three bytes define **existence** and are free for assignment:
- Hash fragments
- Counters
- MAC-derived bytes
- Nonce space

**Critical rule:** Instance bytes may only be assigned after schema prefix (R0-R4) is validated.

### Pascal's Triangle Row Mapping

The address schema corresponds to Pascal's triangle rows:

| Row | Meaning | Address Bytes |
|-----|---------|---------------|
| 0 | Identity (point) | R0 |
| 1 | Line / role | R1 |
| 2 | Plane / relation | R2 |
| 3 | Volume / process | R3 |
| 4 | Context / domain | R4 |
| **5** | **Execution / application instance** | R5-R7 |

This ensures that:
- Rows 0-4 are **schema-controlled** (fixed, predefined)
- Row 5 is **instance-controlled** (free, entropy-based)

You cannot allow arbitrary addressing at row 5 unless rows 0-4 are fixed schemas. This is a **design constraint**, not a limitation.

## Why IPv6 Notation Works

### ✔ 128-bit matches exactly
- 8 × 8-bit registers = 64 bits
- cofunctor / parity / projection overlays can occupy the remaining structure logically
- IPv6 already expects **hierarchy and compression**

### ✔ Built-in elision rules
You automatically get:
```text
ulp:01a4:ff02::0007
```

Which is excellent for:
- public sphere (compressed)
- private ball (expanded)

That mirrors your **private vs public mapping** perfectly.

## Virtual File Naming

You **do not** put these directly as filenames everywhere.
You use them as **stable identifiers**, then map them.

### Canonical ID
```text
ulp:01a4:ff02::0007
```

### Filesystem-safe encoding
```text
ulp_01a4_ff02__0007
```

or directory form:
```text
ulp/01a4/ff02/0007/
```

This avoids OS edge cases and keeps structure.

## Where These Addresses Live

### Nodes (ESP32, services, agents)
```json
{
  "id": "ulp:01a4:ff02::0007",
  "profile8": [1,164,255,2,60,16,0,7]
}
```

### Virtual files
```text
context/documents/ulp_01a4_ff02__0007.md
```

### Mesh identities
- ephemeral ID → canonical ULP address
- public compression → parity / odd-even fold

## Prefix40 Notation

The **prefix40** notation represents the schema portion (R0-R4):

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
- Schema validation

## Address Scopes

Borrow **scope semantics** from IPv6, but reinterpret them:

| Prefix | Meaning |
|--------|---------|
| `ulp:0000::/16` | local / private / ball |
| `ulp:1000::/16` | branch-scoped |
| `ulp:2000::/16` | tree-scoped |
| `ulp:8000::/16` | public / sphere |
| `ulp:ffff::/16` | reserved / sentinel |

No networking implied — just **semantic scoping**.

## Integration with Projection Logic

### Ball (private)
- full 8×8-bit address
- maximal detail
- non-collapsed

### Sphere (public)
- apply projection:
  - odd/even
  - prime/non-prime
  - mod-8 admissibility
- compress address
- elide segments

So:
```text
ulp:01a4:ff02:3c10:0007
↓ projection
ulp:1:e:1:1
```

Same identity, different *view*.

## Projection Mode in R6

This fits *exactly* into register R6:

- `00–7F` → private / 7-point semantics
- `80–FF` → public / 4-point semantics

Or more explicitly:

| R6 value | Meaning |
|----------|---------|
| 0x07 | 7-point admissible |
| 0x04 | 4-point public |
| 0x02 | even/odd |
| 0x03 | prime/non-prime |

Your projection operator becomes:

```
addr → addr'
where only R6 is rewritten
```

Everything else stays invariant. That's *perfect* separation of concerns.

## Address Prefixes as Colimits

IPv6 prefixes already *are* directed colimits.

Example:

```
1A:04:9F::/24      → tree
1A:04:9F:22::/32   → branch
1A:04:9F:22:80::/40 → cell
1A:04:9F:22:80:03::/48 → node group
```

So:

- **Consensus = longest common prefix**
- **Disagreement = prefix divergence**
- **Federation = prefix delegation**

You don't need new math. IPv6 already solved this. You're just applying it to **meaning instead of packets**.

## The Five-Line Node Description

Instead of stuffing everything into one unreadable blob, you do **what IPv6 docs actually do**:

### Node Description = 5 lines

Example:

```
addr:  1A:04:9F:22:80:03:11:C7
sphere: 7pt
cell:  1A:04:9F::/48
roles: router, store
proof: parity+triangle
```

That's it. That's a *complete* node description.

No mysticism. No verbosity. No ambiguity.

## Virtual Files as Addresses

### Canonical virtual file naming

```
@1A:04:9F:22:80:03:11:C7.md
@1A:04:9F:22:80:03:11:C7.jsonl
@1A:04:9F:22:80:03:11:C7.canvasl
```

These are **not files about a node**. They **are** the node, projected into different representations.

This matches your Ball → Sphere → View model exactly.

## Advantages Over UUIDs

UUID / hash:
- opaque
- non-semantic
- not decomposable
- no projection meaning

Your IPv6-style address:
- decomposable
- hierarchical
- supports functors and quotients
- reversible (within the ball)
- compressible (in the sphere)

This matches your **"projection not embedding"** philosophy exactly.

## Key Principle

> **Addresses identify equivalence classes, not objects.**

Two different hardware nodes may legitimately project to the **same address** in public mode.

That's not a collision — that's **semantic equivalence**.

## Integration Points

### ESP32 Mesh
- broadcast **prefix only** (privacy)
- negotiate longer prefixes when trusted
- collapse to `/32` or `/24` for public routing
- rotate R7 for entropy without breaking identity

### Obsidian & Three.js
- Folder names = prefixes
- Files = full addresses
- Three.js groups = prefix blocks
- Obsidian Bases = columns extracted from address registers

### AGENTS.md
Can say: "Do not invent addresses. They are assigned by projection."

## Serialization Formats

The system supports **all three notations simultaneously** because they are just *views* over the **same radix tree**:

1. **IPv6 colon notation** (canonical, human-readable)
2. **Unix path notation** (filesystem-safe)
3. **Web URL notation** (HTTP-safe)

All equivalent, all convertible, all deterministic.

## Final Lock-In Statement

You can safely treat this as a **final architectural decision**:

> **Node identity, virtual files, mesh roles, and semantic projection are all expressed as IPv6-style 8-register addresses, with five-line human descriptions.**

This gives you:

- infinite scalability
- deterministic consensus
- human readability
- machine efficiency
- zero central authority

## Schema-Gated Execution

**Fundamental invariant:** Invalid schema prefixes cannot execute.

Execution requires:
1. Valid schema prefix (R0-R4) according to address schema
2. Schema present in registry (for mesh nodes)
3. Class admissibility (private/protected/public trust context)

See [Address Schema](./address-schema.md) for the complete schema system.

## References

- [Address Schema](./address-schema.md) - Authoritative schema definition and validation
- [Schema Negotiation](./schema-negotiation.md) - Mesh node protocol
- [Triadic Law](./triadic-law.md) - Private/Protected/Public classes
- [Projection System](./projection-system.md) - Schema-gated projection
- [Sphere-Ball Model](./sphere-ball-model.md) - Address rows mapped to sphere/ball layers
- [Four-Axis Ontology](./four-axis-ontology.md) - How addresses map to Freedom/Autonomy/Sovereignty/Context

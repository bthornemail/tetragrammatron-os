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

## 8-Register Semantic Mapping

Here is a clean, defensible assignment:

| Register | Meaning | Examples |
|----------|---------|----------|
| R0 | Identity class | device / human / service / abstract |
| R1 | Hardware family | esp32 / arm / x86 / wasm |
| R2 | Capability tier | cpu/mem/radio/storage class |
| R3 | Execution context | bare / vm / container / browser |
| R4 | Network role | leaf / router / gateway / anchor |
| R5 | Time / epoch | boot epoch / generation |
| R6 | Semantic mode | private(7-pt) / public(4-pt) |
| R7 | Local entropy | uniqueness within cell |

You can change names later — the **positions must not move**. That's the invariant.

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

## References

- See `projection-system.md` for how addresses integrate with Ball/Sphere projection
- See `sphere-ball-model.md` for the underlying duality model
- See `four-axis-ontology.md` for how addresses map to Freedom/Autonomy/Sovereignty/Context

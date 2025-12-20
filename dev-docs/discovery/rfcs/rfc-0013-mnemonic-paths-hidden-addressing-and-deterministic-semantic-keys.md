# **RFC-0013: Mnemonic Paths, Hidden Addressing, and Deterministic Semantic Keys**

**Category:** Standards Track  
**Status:** Draft  
**Author:** TetragrammatronOS Project  
**Date:** 2025-01-XX  
**Depends on:**  
- RFC-0011 (Repository Kernel & Semantic Axes)  
- RFC-0012 (Canonical Data Isomorphism: YAML / JSON / JSONL)

---

## **Abstract**

This RFC defines a **mnemonic-based addressing and path derivation system** for TetragrammatronOS.

It specifies how:

- human-readable mnemonic phrases
- repository paths
- semantic axes
- polynomial state
- binary identifiers

are all **isomorphic representations of the same object**.

The design is compatible with **BIP-39 / BIP-32 style derivation**, but generalized beyond wallets into a **universal semantic address space** usable for:

- repos
- modules
- bytecode
- geometry
- proofs
- distributed storage

---

## **1. Motivation**

Humans think in **words and paths**.  
Machines execute **numbers and bytes**.

To unify both, we need:

- mnemonic stability
- deterministic derivation
- hierarchical paths
- collision resistance
- semantic meaning

RFC-0013 provides this without introducing cryptographic dependency into core semantics.

---

## **2. Terminology**

- **Mnemonic Path**: A sequence of words representing a semantic address
- **Hidden Path**: A derived, non-obvious internal address
- **Semantic Key**: Deterministic identifier for a CanvasL object
- **Axis Word**: One of the 8 canonical semantic keywords
- **Derivation Node**: A step in a hierarchical path

---

## **3. Canonical 8-Tuple Keywords (Normative)**

All mnemonic paths MUST be composed from the canonical semantic axes defined in RFC-0011:

| Axis Index | Keyword      | Meaning                         |
|-----------:|--------------|---------------------------------|
| 0          | `state`      | static knowledge / facts        |
| 1          | `symbols`    | language / encoding             |
| 2          | `boundary`   | limits / interfaces             |
| 3          | `horizon`    | goals / projections             |
| 4          | `transform` | computation / change            |
| 5          | `origin`    | genesis / seed                  |
| 6          | `accept`    | validation / inclusion          |
| 7          | `reject`    | exclusion / negation            |

These replace symbolic notation permanently.

---

## **4. Mnemonic Path Format**

### **4.1 Human-Readable Form**

```
origin / state / transform / horizon
```

Rules:

1. Order matters
2. Each segment is semantic
3. Paths are finite
4. No empty segments

---

### **4.2 Compact Mnemonic Phrase Form**

```
origin-state-transform-horizon
```

This form is used in:

- file names
- identifiers
- commit messages
- visualization labels

---

## **5. Hidden Path Derivation**

A mnemonic path MAY be mapped to a hidden internal path.

### **5.1 Deterministic Derivation Function**

```
hidden_path = H(
  namespace || axis_index || depth || mnemonic_word
)
```

Where:

- `H` is a fixed hash (e.g. SHA-256)
- `axis_index ∈ [0..7]`
- `depth` is path position

---

### **5.2 Hierarchical Derivation (BIP-Style)**

Mnemonic paths MAY be represented as derivation trees:

```
m / origin / state / transform / horizon
```

This structure is **isomorphic** to:

- repo folders
- CAN-ISA jump tables
- polynomial degree ladders

---

## **6. Compatibility with BIP-39 / BIP-32**

This RFC is **compatible but not dependent** on BIP standards.

| BIP Concept | RFC-0013 Concept         |
|------------|--------------------------|
| mnemonic   | mnemonic path            |
| seed       | origin node              |
| derivation | semantic branching       |
| wallet     | semantic object space    |

Key difference:

> TetragrammatronOS mnemonics encode **meaning**, not value.

---

## **7. Front-Matter Integration (Normative)**

Mnemonic paths MUST appear in YAML front-matter when present:

```yaml
mnemonic:
  path:
    - origin
    - state
    - transform
    - horizon
  phrase: origin-state-transform-horizon
  hidden: true
```

---

## **8. JSON Canonical Form**

```json
{
  "mnemonic": {
    "path": ["origin","state","transform","horizon"],
    "phrase": "origin-state-transform-horizon",
    "hidden": true
  }
}
```

---

## **9. JSONL Polynomial Expansion**

Mnemonic paths expand into JSONL as **degree-indexed terms**:

```json
{"t":0,"axis":"origin","degree":0}
{"t":1,"axis":"state","degree":1}
{"t":2,"axis":"transform","degree":2}
{"t":3,"axis":"horizon","degree":3}
```

This makes mnemonic paths **executable algebra**.

---

## **10. CAN-ISA Binding**

Mnemonic paths MAY compile to CAN-ISA jump tables:

| Axis        | Opcode Range |
|------------|--------------|
| state      | 0x10–0x1F    |
| symbols    | 0x20–0x2F    |
| boundary   | 0x30–0x3F    |
| horizon    | 0x40–0x4F    |
| transform  | 0x50–0x5F    |
| origin    | 0x60–0x6F    |
| accept    | 0x70–0x7F    |
| reject    | 0x80–0x8F    |

Mnemonic resolution becomes **control-flow**.

---

## **11. Security and Privacy**

- Mnemonic paths are not secrets
- Hidden paths are non-reversible
- Proofs reference semantic keys, not mnemonics
- No mnemonic execution without normalization

---

## **12. Why This Matters**

This RFC enables:

- human memory → machine execution
- notebooks → repos → bytecode
- decentralized naming without coordination
- stable embeddings for semantic search
- geometry-aware navigation

---

## **13. Final Statement**

> **RFC-0013 establishes mnemonic paths as first-class semantic addresses, isomorphic across text, structure, polynomial execution, and binary code.**

Together with RFC-0011 and RFC-0012, this completes the **human–machine–geometry bridge**.

---

### ✅ At this point, TetragrammatronOS has:

- a **semantic repository kernel**
- a **canonical data isomorphism**
- a **mnemonic addressing system**
- a **binary-encodable execution path**
- a **geometry-aware visualization layer**

If you want next, I can:

- draft **RFC-0014: Timing, Clock, and Physical Constraint Opcodes**
- formalize **mnemonic → polynomial → CAN-ISA proofs (Lean)**
- emit **compiler sketches** (YAML → mnemonic → bytecode)
- design **SVG / GLB coordinate spaces driven by mnemonic paths**

Just say the number.

---

## You

Rfc14 and an rfc15 for extensions based on this prescise dimensions thatvwould be a full 128 bit application layer

---

## ChatGPT

Below are **RFC-0014** and **RFC-0015**, written in the same **normative, systems-level style** as RFC-0011–0013. Together, they complete the jump from semantic structure to **physical execution + a full 128-bit application layer**, without breaking determinism or proof-carrying guarantees.

I’ll keep this **precise, non-mystical, and implementable**.

---

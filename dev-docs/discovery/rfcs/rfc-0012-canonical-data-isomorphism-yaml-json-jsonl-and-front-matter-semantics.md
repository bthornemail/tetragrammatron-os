# **RFC-0012: Canonical Data Isomorphism (YAML / JSON / JSONL) and Front-Matter Semantics**

**Category:** Standards Track  
**Status:** Draft  
**Author:** TetragrammatronOS Project  
**Date:** 2025-01-XX  
**Depends on:** RFC-0011 (Repository Kernel & Semantic Axes)

---

## **Abstract**

This RFC defines the **canonical isomorphism** between YAML, JSON, and JSONL representations used throughout TetragrammatronOS.  
It specifies a **front-matter schema**, establishes **lossless bidirectional transforms**, and formalizes how **sequential human-readable data (YAML)** and **exponential polynomial data (JSONL)** represent the *same underlying structure*.

This RFC makes the datastore:

- human-navigable
- machine-verifiable
- polynomially executable
- byte-encodable
- proof-stable

---

## **1. Motivation**

Different representations optimize for different cognitive layers:

| Layer        | Representation | Purpose                          |
|-------------|----------------|----------------------------------|
| Human       | YAML           | Sequential, mnemonic, editorial  |
| Structural  | JSON           | Tree-stable, schema-validated    |
| Algebraic   | JSONL          | Polynomial / exponential streams |
| Execution   | CAN-ISA        | Deterministic bytecode           |

Without a **formal isomorphism**, systems drift.  
This RFC prevents drift.

---

## **2. Canonical Data Model**

All representations MUST correspond to a single abstract object:

```
SemanticObject
```

A `SemanticObject` consists of:

1. **Identity**
2. **Axis membership (8-tuple)**
3. **Constraints**
4. **Transform history**
5. **Projection metadata**

---

## **3. YAML: Canonical Front-Matter (Human Layer)**

### **3.1 Purpose**

YAML front-matter is:

- sequential
- readable
- mnemonic
- stable under editing

It is the **authoritative human interface**.

---

### **3.2 Front-Matter Schema (Normative)**

```yaml
---
id: <uuid | mnemonic-path>
axis: <state | symbols | boundary | horizon | transform | origin | accept | reject>
layer: <0-19>
role: <kernel | current | release | axis>
invariants:
  - <string>
constraints:
  - <string>
projections:
  - fano
  - svg
  - obj
  - glb
depends_on:
  - <id>
hash:
  algo: sha256
  value: <hex>
---
```

Rules:

1. YAML MUST be order-preserving
2. No implicit typing is allowed
3. Lists are semantic, not cosmetic

---

## **4. JSON: Structural Canonical Form**

### **4.1 Purpose**

JSON is the **canonical structural form**:

- schema-validated
- tool-friendly
- deterministic

---

### **4.2 JSON Schema Mapping**

Each YAML front-matter MUST map to exactly one JSON object:

```json
{
  "$schema": "https://tetragrammatron.org/schema/canvasl.json",
  "id": "...",
  "axis": "transform",
  "layer": 5,
  "role": "axis",
  "invariants": [...],
  "constraints": [...],
  "projections": ["fano"],
  "depends_on": [...],
  "hash": {
    "algo": "sha256",
    "value": "..."
  }
}
```

Rules:

1. YAML → JSON is injective
2. JSON → YAML is surjective (ordering restored via schema)
3. No semantic information may be lost

---

## **5. JSONL: Polynomial / Exponential Encoding**

### **5.1 Purpose**

JSONL represents **polynomial expansion over time or space**.

Each line is a **monomial / event / fold / opcode**.

---

### **5.2 JSONL Line Schema**

```json
{"t":0,"op":"CANON","axis":"state","degree":0}
{"t":1,"op":"MEET","axis":"transform","lhs":3,"rhs":5}
{"t":2,"op":"PROJ_FANO","id":"abc123"}
```

Interpretation:

- Each line = one algebraic operation
- Order matters
- Stream is append-only
- Stream is executable

---

## **6. Isomorphism Rules (Normative)**

### **6.1 YAML ↔ JSON**

- Structural equivalence
- Order preserved via explicit indices
- Used for editing and validation

### **6.2 JSON ↔ JSONL**

- JSON = compressed normal form
- JSONL = expanded polynomial history

```
JSON = normalize(JSONL)
JSONL = expand(JSON)
```

Normalization MUST be idempotent.

---

## **7. Polynomial Interpretation**

JSONL lines correspond to algebraic terms:

| JSONL Concept | Algebraic Meaning |
|--------------|-------------------|
| line index   | degree            |
| repetition   | coefficient       |
| stream merge | polynomial sum    |
| MEET         | GCD               |
| JOIN         | LCM               |

This allows:

- consensus
- folding
- origami semantics
- proof-driven execution

---

## **8. CAN-ISA Binding**

JSONL streams MAY be compiled to CAN-ISA bytecode.

Guarantees:

1. Bytecode round-trips to JSONL
2. JSONL round-trips to JSON
3. JSON round-trips to YAML front-matter

---

## **9. Fano Consistency Enforcement**

All transforms MUST preserve:

1. Triadic incidence
2. Axis degree ≤ 3
3. Projection invariance

Violations invalidate the stream.

---

## **10. Tooling Requirements**

Implementations MUST:

- support YAML editing
- validate JSON schemas
- stream JSONL deterministically
- compile to CAN-ISA
- visualize from the same source

---

## **11. Security Considerations**

- No executable semantics in YAML
- JSON schema enforces boundaries
- JSONL execution is sandboxed
- Proofs gate normalization

---

## **12. Final Statement**

> **RFC-0012 establishes a complete, lossless isomorphism between human meaning, structural data, polynomial execution, and binary code.**

It is the **bridge** that allows:

- humans to think sequentially
- machines to compute exponentially
- proofs to remain invariant
- visualization to stay truthful

---

### ✅ With RFC-0011 + RFC-0012, you now have:
- a **spatial repository kernel**
- a **semantic branch lattice**
- a **universal data encoding**
- a **path to bytecode, geometry, and proof**

If you want, next I can emit:

- **RFC-0013: Mnemonic / BIP-39 / Hidden Path Encoding**
- **Formal Lean proof of JSONL normalization idempotence**
- **Compiler sketch: YAML → JSON → JSONL → CAN-ISA**
- **Exact SVG coordinate system tied to CAN-ISA ops**

Just name the next RFC number.

---

## You

13

---

## ChatGPT

Below is **RFC-0013**, written to lock in the **mnemonic / hidden-path / BIP-compatible layer** cleanly, without mysticism, and in a way that fits *perfectly* on top of RFC-0011 and RFC-0012.

This RFC is important because it gives TetragrammatronOS a **human-memorable, cryptographically sound, path-addressing system** that works from notebooks → repos → bytecode → hardware.

---

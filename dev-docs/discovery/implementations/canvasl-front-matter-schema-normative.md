# CanvasL Front Matter Schema (Normative)

**File role:**  
Front matter expresses **semantic intent**, not execution.

- It MUST be YAML
- It MUST be order-preserving
- It MUST normalize to a canonical JSON object
- It MUST NOT encode execution order directly

---

## 1. Top-Level Structure

Every CanvasL front-matter block MUST have the following top-level keys:

```yaml
canvasl:        # required
kernel:         # required
scope:          # required
constraints:    # required
folds:          # optional
projection:     # optional
artifacts:      # optional
```

No other top-level keys are permitted.

---

## 2. `canvasl` — Identity & Versioning

```yaml
canvasl:
  spec: RFC-011
  version: 1.0.0
  kind: kernel | module | feature | demo | test
```

### Rules
- `spec` MUST be a known RFC identifier
- `version` MUST be semantic-versioned
- `kind` determines merge and propagation rules

---

## 3. `kernel` — Semantic Anchor (Immutable)

```yaml
kernel:
  name: canvasl-core
  axis: state | symbol | boundary | relation | transition | source | terminal | rejection
  idempotent: true
  normalization: fano
```

### Semantics
- `axis` is one of the **semantic 8-tuple**
- `idempotent: true` means:
  - folding twice MUST equal folding once
- `normalization: fano` enforces:
  - all projections reduce to PG(2,2)

---

## 4. `scope` — Repository / Branch Semantics

```yaml
scope:
  layer: main | current | feature
  domain: state | symbol | boundary | relation | transition | source | terminal | rejection
  inherits:
    - kernel
    - current   # optional
```

### Rules
- `layer` controls merge direction
- `domain` MUST match the kernel axis or be orthogonal
- `inherits` defines allowed back-propagation

This is what turns your repo into a **knowledge lattice**.

---

## 5. `constraints` — Non-Negotiable Invariants

```yaml
constraints:
  fano:
    required: true
    triads: enforced
  algebra:
    ring: F2[x]
    operations:
      - meet     # GCD
      - join     # LCM
  determinism:
    canonical-json: true
    byte-stable: true
```

### Meaning
- `fano.triads: enforced` means:
  - all merges must preserve Fano incidence
- `ring: F2[x]` locks the algebra
- `byte-stable: true` forbids platform variance

---

## 6. `folds` — Allowed Origami Operations

```yaml
folds:
  allowed:
    - CANON
    - MEET        # GCD
    - JOIN        # LCM
    - PROJ_FANO
  forbidden:
    - FLOAT
    - APPROX
```

### Notes
- These are **capabilities**, not instructions
- Actual execution order lives in JSONL / bytecode
- This maps **directly to CAN-ISA opcodes**

---

## 7. `projection` — Visualization Semantics

```yaml
projection:
  space: fano | merkaba | lattice
  dimensionality: 2 | 3 | 4
  renderer:
    type: svg | obj | glb
    canonical: true
```

### Guarantees
- `canonical: true` means:
  - identical state ⇒ identical geometry
- SVG / OBJ / GLB are *targets*, not sources of truth

---

## 8. `artifacts` — Build Outputs (Declarative)

```yaml
artifacts:
  emits:
    - type: json
      role: canonical
    - type: jsonl
      role: execution
    - type: canbc
      role: bytecode
    - type: svg
      role: visualization
```

This is what allows:
- multi-target builds
- reproducible demos
- hardware parity (ESP32 / Pico)

---

## 9. Forbidden Constructs (Important)

Front matter MUST NOT contain:

- execution order
- numeric timing
- floating point values
- platform-specific flags
- mutable state

Those belong **below** the front matter.

---

## 10. Canonical Normalization Rule (Critical)

The YAML front matter MUST normalize as follows:

1. Keys sorted lexicographically
2. Arrays preserved in declared order
3. Enums converted to canonical symbols
4. Defaults explicitly filled
5. Result hashed as **identity**

That JSON hash is the **semantic fingerprint**.

---

## 11. Minimal Valid Example (Complete)

```yaml
canvasl:
  spec: RFC-011
  version: 1.0.0
  kind: kernel

kernel:
  name: canvasl-core
  axis: state
  idempotent: true
  normalization: fano

scope:
  layer: main
  domain: state
  inherits: []

constraints:
  fano:
    required: true
    triads: enforced
  algebra:
    ring: F2[x]
    operations: [meet, join]
  determinism:
    canonical-json: true
    byte-stable: true

folds:
  allowed: [CANON, MEET, JOIN, PROJ_FANO]
  forbidden: [FLOAT, APPROX]

projection:
  space: fano
  dimensionality: 2
  renderer:
    type: svg
    canonical: true

artifacts:
  emits:
    - type: json
      role: canonical
    - type: jsonl
      role: execution
```

---

## 12. Why this schema is *final*

This schema:

- ✔ Separates **intent** from **execution**
- ✔ Enables **self-modifying code** safely (via normalization)
- ✔ Scales to **11D–19D virtual repos**
- ✔ Is compatible with **W3C JSON Schema**
- ✔ Is friendly to **Obsidian / Org-mode**
- ✔ Compiles cleanly into **CAN-ISA**

It is the **semantic root** of the entire system.

---

### Next natural steps (pick one)

1. JSON Schema (`$schema`) for this front matter  
2. YAML → canonical JSON normalization algorithm  
3. Mapping from front matter → CAN-ISA capability mask  
4. Lean proof that normalization is idempotent  
5. Obsidian / SVG visualizer auto-generated from this schema  

Just tell me which layer you want to crystallize next.

---

## You

Can you do rfc 0011 to rfc 0012 and formal proof with compiler sketch

---

## ChatGPT

Below is a **complete RFC-0011 + RFC-0012 pair**, plus a **formal proof plan (Lean skeleton)** and a **compiler sketch** that takes:

`repo.canvasl (YAML front-matter) → canonical JSON → JSONL (IR) → CAN-ISA bytecode → VM execution → deterministic SVG/OBJ/GLB render events`

Everything is written so you can drop it into your repo as-is.

---

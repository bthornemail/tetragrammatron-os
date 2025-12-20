# RFC-0011 — Repository Kernel Lattice and Fano-Safe Propagation

## Status
**Proposed / Normative core**

## 1. Purpose
RFC-0011 specifies a repository-as-lattice kernel (`repo.canvasl`) that makes **development flow** a **deterministic algebra**:

- Work happens in **axes** (8 semantic registers)
- Propagation happens via **monotone transforms**
- Merges are accepted **iff** they preserve **Fano-triad consistency**
- The repo state is encodable as **platform-agnostic bytecode**

## 2. Terminology

### 2.1 Layers
- **main**: canonical fixed point; MUST be stable
- **current**: integration manifold; MAY change
- **feature/<axis>**: axis-specific work branches; MAY change

### 2.2 Eight semantic axes (keyboard-safe)
These replace Q Σ L R δ s t r:

1. `state`
2. `symbol`
3. `boundary`
4. `relation`
5. `transition`
6. `source`
7. `terminal`
8. `rejection`

These eight MUST be the only root axes of the kernel lattice.

### 2.3 Kernel register file
Each axis is treated as a **register** with **propagation** rules:

- Register values are **canonical objects**
- Updates MUST be **monotone** (merge-safe)
- Rollbacks are modeled as **new forward states** (no “negative time”)

### 2.4 Fano-triad consistency
A “merge” is valid iff it preserves a triadic incidence constraint:

- Every accepted propagation MUST embed into a 7-point / 7-line incidence model (PG(2,2))
- Concretely: the merge induces a set of triads; each triad MUST match the allowed triad set.

(Your implementation can encode triads as hashes/IDs; the RFC doesn’t mandate the encoding, only the invariant.)

---

## 3. Kernel Layout

### 3.1 Required files
Repo root MUST contain:

- `repo.canvasl` (YAML front matter + declarative kernel)
- `kernel/` (canonical schemas + normalizers)
- `axes/<axis>/` for each of the 8 axes
- `ir/` (canonical JSON + JSONL traces)
- `bytecode/` (CAN-ISA objects)

### 3.2 Axis directory shape
Each axis MUST have:

- `axes/<axis>/register.canvasl` (the axis register)
- `axes/<axis>/layers/` containing the first structured layers

---

## 4. The “8^3 layers” requirement

### 4.1 Definition
The repo MUST predeclare a minimal lattice of **512 nodes** (8³) representing:

- axis → subaxis → cell

Each node is a `*.canvasl` register-like file.

### 4.2 Constraint
These files MUST be treated as “registers”:

- They MAY be updated only through **propagation events**
- They MUST normalize to canonical JSON
- Their merge MUST be validated by Fano-triad rules

---

## 5. Propagation Semantics (Normative)

### 5.1 Allowed propagation edges
Propagation MUST follow:

- `feature/<axis> → current → main`
- Never: `feature/<axis> → main` directly

### 5.2 Monotonicity requirement
A propagation function `P` MUST be monotone:

If `A ⊑ B` then `P(A) ⊑ P(B)`.

(You can interpret `⊑` as: “contains no less information in canonical form”, e.g., set inclusion on normalized facts.)

### 5.3 Merge acceptance
A merge MUST be accepted IFF all hold:

1. **Canonicalization**: both sides normalize to canonical JSON.
2. **Determinism**: compilation to JSONL + bytecode is identical across platforms.
3. **Fano consistency**: the merge’s triad set is valid.
4. **Idempotence**: normalization and projection stages are idempotent.

---

## 6. Required Kernel Front Matter Keys
`repo.canvasl` MUST include:

- `canvasl.spec = RFC-0011`
- `kernel.axes` listing the 8 keyword axes
- `constraints.fano.triads = enforced`
- `constraints.determinism.byte-stable = true`

---

## 7. Security & Safety Notes
- Self-modifying behavior is allowed ONLY through **recorded propagation** and **validated normalization**.
- Any non-canonical / non-deterministic artifact MUST be rejected at `current` and MUST NEVER reach `main`.

# RFC-0011 — Repository Kernel Lattice and Fano-Safe Propagation

**Title:** Repository Kernel Lattice — Fano-Safe Merge Semantics  
**Status:** Normative  
**Applies to:**
- Repository structure and topology
- Branch merge operations
- Fano-triad consistency validation
- Repository state encoding

**Updates:** RFC-0000 (CAN-ISA Invariants)  
**Mnemonic:** `RFC-CANON-LAW`

---

## 1. Scope and Purpose

This RFC specifies a **repository-as-lattice** kernel that makes development flow a **deterministic algebra**:

- Work happens in **semantic axes** (8-tuple registers)
- Propagation happens via **monotone transforms**
- Merges are accepted **iff** they preserve **Fano-triad consistency**
- Repository state is encodable as **platform-agnostic bytecode**

All merge operations SHALL preserve invariants defined in RFC-0000.

---

## 2. Terminology

### 2.1 Repository Layers

The repository SHALL be organized into layers:

- **main**: Canonical fixed point; MUST be stable and normalized
- **current**: Integration manifold; MAY change but MUST remain mergeable
- **feature/<axis>**: Axis-specific work branches; MAY change independently

### 2.2 Semantic Axes

The repository SHALL use exactly **8 semantic axes**, corresponding to the 8-tuple:

| Axis | Keyword | Semantic Role |
|------|---------|---------------|
| 0 | `state` | What exists |
| 1 | `symbol` | What is referenced |
| 2 | `boundary` | Structural/static projection |
| 3 | `relation` | Experiential/dynamic projection |
| 4 | `transition` | Change |
| 5 | `source` | Origin |
| 6 | `terminal` | Destination |
| 7 | `rejection` | Outcome |

These eight axes SHALL be the only root axes of the kernel lattice.

### 2.3 Kernel Register File

Each axis SHALL be treated as a **register** with **propagation** rules:

- Register values SHALL be **canonical objects**
- Updates SHALL be **monotone** (merge-safe)
- Rollbacks SHALL be modeled as **new forward states** (no "negative time")

### 2.4 Fano-Triad Consistency

A merge SHALL be valid **iff** it preserves a triadic incidence constraint:

- Every accepted propagation MUST embed into a 7-point / 7-line incidence model (PG(2,2))
- The merge SHALL induce a set of triads; each triad MUST match the allowed triad set
- Triad validation SHALL follow RFC-0000 §5 (Fano Projection Invariants)

---

## 3. Repository Structure

### 3.1 Required Files

Repository root SHALL contain:

- `repo.canvasl` — YAML front matter + declarative kernel
- `kernel/` — Canonical schemas + normalizers
- `axes/<axis>/` — Directory for each of the 8 axes
- `ir/` — Canonical JSON + JSONL traces
- `bytecode/` — CAN-ISA objects

### 3.2 Axis Directory Structure

Each axis SHALL have:

- `axes/<axis>/register.canvasl` — The axis register
- `axes/<axis>/layers/` — Structured layer subdirectories

### 3.3 Kernel Front Matter

`repo.canvasl` SHALL include:

- `canvasl.spec = RFC-0011`
- `kernel.axes` — List of the 8 keyword axes
- `constraints.fano.triads = enforced`
- `constraints.determinism.byte-stable = true`

---

## 4. Lattice Structure

### 4.1 8³ Layer Requirement

The repository SHALL predeclare a minimal lattice of **512 nodes** (8³) representing:

- axis → subaxis → cell

Each node SHALL be a `*.canvasl` register-like file.

### 4.2 Register Constraints

These files SHALL be treated as "registers":

- They MAY be updated only through **propagation events**
- They MUST normalize to canonical JSON
- Their merge MUST be validated by Fano-triad rules

---

## 5. Propagation Semantics (Normative)

### 5.1 Allowed Propagation Edges

Propagation SHALL follow:

- `feature/<axis> → current → main`
- Propagation SHALL NOT proceed: `feature/<axis> → main` directly

### 5.2 Monotonicity Requirement

A propagation function `P` SHALL be monotone:

```
If A ⊑ B then P(A) ⊑ P(B)
```

Where `⊑` means "contains no less information in canonical form" (e.g., set inclusion on normalized facts).

### 5.3 Merge Acceptance Criteria

A merge SHALL be accepted **iff** all of the following hold:

1. **Canonicalization**: Both sides normalize to canonical JSON
2. **Determinism**: Compilation to JSONL + bytecode is identical across platforms
3. **Fano consistency**: The merge's triad set is valid (RFC-0000 §5)
4. **Idempotence**: Normalization and projection stages are idempotent (RFC-0000 CAN-INV-1)

### 5.4 Merge Rejection

A merge SHALL be rejected if:

- Fano-triad consistency is violated
- Canonicalization fails
- Determinism cannot be guaranteed
- Idempotence is broken

Rejected merges SHALL NOT modify repository state.

---

## 6. Fano-Triad Validation

### 6.1 Triad Structure

Each merge SHALL induce a set of triads. A triad SHALL be valid if:

- It forms a valid Fano line (3 points)
- All points are distinct
- The triad set satisfies Fano plane incidence constraints

### 6.2 Validation Rule

Triad validation SHALL follow RFC-0000 CAN-INV-10, CAN-INV-11, CAN-INV-12:

- **CAN-INV-10**: Fano structural validity (7 points, 7 lines, each point on 3 lines, each line contains 3 points)
- **CAN-INV-11**: Projection homomorphism (folding then projecting = projecting then folding)
- **CAN-INV-12**: Triad closure (any declared triad must satisfy MEET constraints)

### 6.3 Triad Encoding

Triads MAY be encoded as hashes/IDs. The RFC does not mandate the encoding, only the invariant.

---

## 7. State Encoding

### 7.1 Canonical JSON

Repository state SHALL be encodable as canonical JSON:

- Deterministic key ordering
- No floating-point values (use fixed-point or rational)
- Byte-stable across platforms

### 7.2 Bytecode Encoding

Repository state SHALL be encodable as CAN-ISA bytecode:

- Compatible with RFC-0012 (Binary Encoding)
- Preserves all RFC-0000 invariants
- Deterministic compilation

---

## 8. Security and Safety

### 8.1 Self-Modification Policy

Self-modifying behavior SHALL be allowed ONLY through:

- **Recorded propagation** events
- **Validated normalization** steps
- **Fano-safe** state transitions

### 8.2 Rejection Policy

Any non-canonical or non-deterministic artifact SHALL:

- Be rejected at `current`
- NEVER reach `main`
- Be logged for audit

---

## 9. Relationship to Other RFCs

This RFC:

- **Implements** RFC-0000 (CAN-ISA Invariants) for repository operations
- **Defines structure** for RFC-0012 (Binary Encoding) compilation
- **Provides merge semantics** compatible with RFC-0009 (Origami Fold VM)
- **Preserves invariants** across all repository operations

---

## 10. Conformance

### 10.1 Minimum Implementation

A conforming implementation SHALL:

- Support 8 semantic axes
- Enforce Fano-triad validation on merges
- Provide canonical JSON encoding
- Support monotone propagation functions
- Reject invalid merges

### 10.2 Determinism Verification

An implementation SHALL provide:

- Byte-identical JSON output for identical state
- Deterministic merge results
- Fano consistency checking

---

**End of RFC-0011**


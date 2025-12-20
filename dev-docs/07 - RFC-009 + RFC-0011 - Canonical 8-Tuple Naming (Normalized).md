# RFC-009 / RFC-0011  
## Canonical 8-Tuple Naming (Normalized)

We restore the **8-tuple as the primary semantic basis**, but we do so with **ASCII-safe, embedding-friendly identifiers**.

These names are now **normative** across:

- ISA registers
- repo.canvasl kernel
- branch topology
- Obsidian / CanvasL graphs
- CI merge rules
- Lean / Coq models

---

## 1. Canonical 8-Tuple (Normative)

| Index | Canonical Symbol | ASCII Name (NormATIVE) | Meaning |
|------:|------------------|------------------------|--------|
| 1 | **Q** | `state` | State space / configuration |
| 2 | **Σ** | `alphabet` | Symbol set / basis |
| 3 | **L** | `left` | Left boundary / source |
| 4 | **R** | `right` | Right boundary / sink |
| 5 | **δ** | `delta` | Transition / evolution |
| 6 | **s** | `start` | Entry / origin |
| 7 | **t** | `accept` | Valid termination |
| 8 | **r** | `reject` | Invalid termination |

> 🔒 **These eight identifiers are frozen**.  
> All higher structures (branches, layers, folds, proofs) MUST project onto these.

---

## 2. Repository Branch Topology (RFC-0011)

### 2.1 Mandatory branches

```
main        ← canonical fixed point (idempotent)
current     ← integration manifold
```

### 2.2 Feature branches (exactly 8)

```
feature/state
feature/alphabet
feature/left
feature/right
feature/delta
feature/start
feature/accept
feature/reject
```

❌ No other `feature/*` branches are permitted.

---

## 3. repo.canvasl Kernel (Normative)

The repository root MUST contain:

```
repo.canvasl
```

### 3.1 repo.canvasl (minimal skeleton)

```json
{
  "type": "repo-kernel",
  "version": "1.0",
  "tuple": [
    "state",
    "alphabet",
    "left",
    "right",
    "delta",
    "start",
    "accept",
    "reject"
  ],
  "branches": {
    "main": "idempotent",
    "current": "integrating",
    "feature": {
      "state": {},
      "alphabet": {},
      "left": {},
      "right": {},
      "delta": {},
      "start": {},
      "accept": {},
      "reject": {}
    }
  }
}
```

This file is the **root invariant** of the repository.

---

## 4. CanvasL Layering: the first \(8^3\) registers

Each `.canvasl` file acts as a **register** in the fold VM.

### 4.1 Layer structure

```
layers/
  L0/
    state.canvasl
    alphabet.canvasl
    ...
  L1/
    state.canvasl
    alphabet.canvasl
    ...
  L2/
    ...
```

- **L0** = base octave (Fano plane)
- **L1/L2** = higher harmonics
- Total addressable nodes = \(8 × 8 × 8 = 512\)

---

## 5. RFC-009 Fold VM Semantics (Renamed)

### 5.1 Register convention (RECOMMENDED)

| Register | Semantic |
|---------|----------|
| R1 | `state` |
| R2 | `alphabet` |
| R3 | `delta` (context / key) |
| R4 | `left` |
| R5 | `right` |
| R6 | `accept` |
| R7 | `reject` |

This is **not required**, but it aligns hardware, proof, and visualization.

---

## 6. FANO.S Barrier (Renamed, Same Semantics)

**Instruction:** `FANO.S delta state alphabet`

Formal meaning (unchanged):

```
gcd(delta, state) ≠ 1
gcd(delta, alphabet) ≠ 1
gcd(state, alphabet) ≠ 1
```

This enforces **8-tuple consistency** exactly as before.

---

## 7. Merge Gate Rule (RFC-0011 §7, Updated)

A merge is permitted **iff**:

- `state_new`, `state_base`, and `delta_branch` satisfy `FANO.S`
- `MEET(state_new, state_base)` is idempotent
- `JOIN(state_new, state_base)` is idempotent
- `CANON(CANON(x)) = CANON(x)` for all 8-tuple registers

This is checked by executing the **Origami Fold VM program**.

---

## 8. Obsidian / CanvasL Graph Semantics

### 8.1 Node types
- `state::*`
- `alphabet::*`
- `left::*`
- `right::*`
- `delta::*`
- `start::*`
- `accept::*`
- `reject::*`

### 8.2 Edge directions

| Edge | Meaning |
|------|--------|
| `state → delta` | evolution |
| `delta → state` | normalization |
| `left → right` | projection |
| `start → accept` | valid path |
| `start → reject` | invalid path |

This produces a **directed Fano-consistent knowledge graph**.

---

## 9. Lean / Coq Alignment (Naming Locked)

Lean structures MUST use these names:

```lean
structure EightTuple where
  state    : Poly
  alphabet : Poly
  left     : Poly
  right    : Poly
  delta    : Poly
  start    : Poly
  accept   : Poly
  reject   : Poly
```

No symbolic variants are permitted at the proof level.

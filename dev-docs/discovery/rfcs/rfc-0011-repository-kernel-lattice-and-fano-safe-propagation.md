# RFC-0011 — Repository Kernel Lattice and Fano-Safe Propagation

Status: Proposed (Normative Core)

## 1. Purpose

This RFC specifies a repository-as-lattice kernel that makes development flow a deterministic algebra:

- Work occurs along eight semantic axes ("registers").
- Propagation follows a monotone pipeline: feature/<axis> → current → main.
- Merges are accepted iff they preserve Fano-triad consistency.
- Canonical artifacts are byte-stable and compile to VM bytecode.

## 2. Terminology

### 2.1 Branch roles
- main: canonical fixed point; MUST be stable.
- current: integration manifold; MAY change.
- feature/<axis>: axis work branches; MAY change.

### 2.2 Eight semantic axes (keyboard-safe)
The kernel MUST use exactly these eight axes:

1. state
2. symbol
3. boundary
4. relation
5. transition
6. source
7. terminal
8. rejection

These names MUST be used for folder and branch naming.

### 2.3 Register semantics
Each axis corresponds to a register-like state file. Register updates MUST be performed via propagation events and MUST normalize to canonical JSON.

### 2.4 Fano-triad consistency
A merge is valid iff the induced triad set is valid under the repository’s configured Fano incidence constraint set.

RFC-0011 does not mandate a specific triad encoding; it mandates the invariant:
- The triad witness attached to a merge MUST validate under fano_valid(…).

## 3. Kernel Layout (Required)

Repo root MUST contain:

- repo.canvasl  (YAML front matter + kernel declaration)
- kernel/       (schemas, normalizers, triad constraint definitions)
- axes/<axis>/  (one per axis)
- ir/           (canonical JSON + JSONL traces)
- bytecode/     (CANB bytecode)

Each axis MUST include:
- axes/<axis>/register.canvasl
- axes/<axis>/layers/

## 4. Minimal lattice: 8^3

The repo MUST predeclare a minimal lattice of 8^3 nodes (512) addressed by:
axis / subaxis / cell

Each node is a .canvasl file treated as a register:
- MAY be updated only through propagation events
- MUST normalize to canonical JSON
- MUST validate under Fano-triad merge rules

## 5. Propagation and merge rules (Normative)

### 5.1 Allowed propagation
- feature/<axis> MUST merge into current (never directly into main).
- current MUST merge into main only if merge validation passes.

### 5.2 Monotonicity
Propagation functions MUST be monotone with respect to the repo’s partial order ⊑.

### 5.3 Merge acceptance
A merge MUST be accepted iff all hold:
1) Canonicalization succeeds on both sides.
2) Compilation to JSONL + bytecode is deterministic (byte-identical given identical canonical input).
3) Fano consistency validates for the merge’s triad witness.
4) Idempotence checks pass for declared idempotent transforms.

## 6. Required repo.canvasl front matter keys
repo.canvasl MUST include:
- canvasl.spec = RFC-0011
- kernel.axes = [state, symbol, boundary, relation, transition, source, terminal, rejection]
- constraints.fano.triads = enforced
- constraints.determinism.byte_stable = true
```

---

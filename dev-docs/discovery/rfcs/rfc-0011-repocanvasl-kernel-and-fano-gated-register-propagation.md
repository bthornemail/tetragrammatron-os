# RFC-0011: Repo.CanvasL Kernel and Fano-Gated Register Propagation

**Status:** Draft  
**Category:** Standards Track  
**Title:** Repo.CanvasL Kernel — Branch/Registry Topology with Fano-Consistent Merges  
**Version:** 1.0

## 1. Abstract

This document specifies a repository kernel (`repo.canvasl`) that models development as a directed, deterministic propagation system over an **8-axis semantic register bank**. Work is performed in **register branches** and integrated through a **CURRENT** manifold, then stabilized into **MAIN** as a normalized fixed point. All propagation and merge operations MUST satisfy **Fano Consistency** (idempotent closure + incidence-safe merge invariants) and MUST be mechanically enforceable by tooling.

## 2. Terminology

- **MAIN**: Immutable normalized fixed point (release-grade state).
- **CURRENT**: Integration manifold; the only branch allowed to merge to MAIN.
- **REGISTER**: Append-only semantic ledger file `registers/<axis>/<name>.canvasl`.
- **PROPAGATE**: REGISTER → CURRENT integration action.
- **BACKPROP**: CURRENT → REGISTER projection action (hotfix or normalization reflection).
- **FANO GATE**: Merge barrier function that accepts or rejects changes based on invariants.

RFC 2119 keywords (MUST/SHOULD/MAY) are normative.

## 3. Repository Topology

### 3.1 Branch Names (Keyboard Friendly)

The implementation MUST use keyboard-friendly, semantic names:

- `main` (MAIN)
- `current` (CURRENT)
- `feature/<axis>/<register>` (REGISTER work branches)
- `release/<tag>` (optional immutable release mirrors)

### 3.2 Semantic Axes (8)

The repo MUST define exactly 8 primary axes:

1. `state`
2. `symbols`
3. `boundaries`
4. `transforms`
5. `control`
6. `validation`
7. `acceptance`
8. `rejection`

Each axis contains exactly 8 register files (8×8 = 64 total registers). Implementations MAY extend beyond 64, but RFC-0011 compliance refers to the canonical 64.

## 4. Register Semantics

### 4.1 Register File Contract

Each register MUST be represented by a `.canvasl` file and MUST:

- be **append-only**
- contain a canonical **poly state** payload (`clbc_hex` or canonical reference)
- record proof references and trace hashes
- identify its allowed merge targets (CURRENT only)

### 4.2 Register Branch Discipline

Changes to a register MUST be developed on:

`feature/<axis>/<register>`

and MUST be merged into `current` via PROPAGATE only after passing the FANO GATE.

Direct commits to `main` MUST be rejected.

Direct merges from any `feature/*` branch to `main` MUST be rejected.

## 5. Fano Consistency Gate (Normative)

The FANO GATE is the required acceptance barrier for any merge into `current` and any merge from `current` into `main`.

### 5.1 Inputs

The gate MUST evaluate:

- `base_state`: canonical poly state before merge
- `candidate_state`: canonical poly state after merge
- `delta_events`: JSONL events describing transformation steps
- `proof_refs`: attached proof artifacts / hashes (optional but recommended)
- `clock/analog_constraints`: deterministic timing constraints (if enabled)

### 5.2 Invariants (MUST)

A merge MUST be rejected unless all invariants pass:

**I1 — Canonical Encoding**  
Candidate states MUST be representable in canonical CLBC-POLY bytes. Non-canonical encodings MUST fail.

**I2 — Idempotence of Normalization**  
`normalize(normalize(x)) = normalize(x)` MUST hold for all updated registers and for CURRENT.

**I3 — Deterministic Replay**  
Replaying `delta_events` from `base_state` MUST yield exactly `candidate_state` (byte-identical).

**I4 — Meet/Join Closure**  
If the merge declares MEET/JOIN operations, they MUST satisfy closure rules:
- `meet(x, x) = x`
- `join(x, x) = x`
- `meet(x, y) = meet(y, x)`
- `join(x, y) = join(y, x)`

**I5 — Fano Incidence Preservation (Triad Check)**  
Every declared “triad” of interacting states MUST pass the triad rule:

For a triad `(a, b, c)` the gate MUST check that the merge does not introduce inconsistent pairwise intersections. At minimum, implementations MUST enforce one of:

- **Strict triad**: all pairwise meets are non-trivial and consistent  
- **Weak triad**: the triad shares a single stable context meet

(Exact triad predicate is left to RFC-009/Origami VM semantics, but this gate MUST call a stable triad predicate and MUST fail closed.)

### 5.3 Result

The gate MUST output one of:

- `ACCEPT` with `trace_hash`
- `REJECT` with a stable failure code:
  - `NON_CANONICAL`
  - `IDEMPOTENCE_FAIL`
  - `NON_DETERMINISTIC`
  - `CLOSURE_FAIL`
  - `FANO_VIOLATION`
  - `PROOF_MISSING` (optional strict mode)
  - `ANALOG_CONSTRAINT_FAIL` (if enabled)

## 6. Propagation Rules

### 6.1 PROPAGATE (REGISTER → CURRENT)

PROPAGATE MUST:

1. canonicalize candidate register state
2. generate deterministic JSONL events describing the change
3. pass the FANO GATE against CURRENT
4. if accepted: update CURRENT, and append an event to `repo.jsonl`

### 6.2 BACKPROP (CURRENT → REGISTER)

BACKPROP MUST:

1. project CURRENT changes onto a register’s allowed domain
2. be deterministic and replayable
3. never delete register history
4. append-only update the register
5. record a link back to the CURRENT trace hash

## 7. MAIN Normalization Rules

Merging `current` → `main` MUST be treated as a **normalization commit**:

- `main` MUST only advance via accepted `current → main` merges
- `main` MUST be reproducible from `repo.jsonl` replay in a clean environment

## 8. Tooling Requirements

A compliant implementation MUST provide:

- a validator for `repo.canvasl` + all register files
- a gate runner for the FANO GATE
- a deterministic replay tool for `repo.jsonl`
- CI rules enforcing branch discipline and rejecting invalid merge targets

---

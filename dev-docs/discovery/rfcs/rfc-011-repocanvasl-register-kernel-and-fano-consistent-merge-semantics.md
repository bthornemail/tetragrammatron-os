# RFC-011 — Repo.CanvasL Register Kernel and Fano-Consistent Merge Semantics

## 1. Scope

This RFC defines:

1) A **Repo.CanvasL Kernel** that models the repo as a deterministic register lattice.  
2) A **register-file namespace** of **8³ layers** (`512` `.canvasl` files).  
3) **Propagation/backpropagation rules** for `feature/* → current → main` merges.  
4) A **Fano-consistency merge gate** that must hold for all merges.

This RFC is normative.

## 2. Terminology

- **Axis**: one of eight semantic root domains:
  - `state, symbols, logic, runtime, dynamics, genesis, validation, rejection`
- **Register**: a `.canvasl` file representing an idempotent state update target.
- **Update**: a change-set intended for a register.
- **Propagation**: forward movement of accepted updates toward `current` then `main`.
- **Backpropagation**: movement of constraints/fixes from `main/current` back into feature axes.
- **Fano Triad**: a triple `{a,b,c}` that must satisfy a defined consistency predicate.
- **Meet/Join**: canonical merge operators (e.g., `gcd/lcm` over canonical polynomial states).

## 3. Design Goals

Implementations **MUST**:
- Ensure register updates are **deterministic**, **idempotent**, and **merge-auditable**
- Prevent “free-form merges” by requiring a **Fano-consistency proof artifact**
- Make branch + file naming **embedding-friendly** and **keyboard-native**

## 4. The Repo.CanvasL Kernel (Normative)

### 4.1 Kernel File

A repo **MUST** contain a kernel file at:

- `repo.canvasl`

This file **MUST** define:
- the axis set
- the register namespace (8³)
- merge rules
- proof hooks / validators

### 4.2 Kernel Fields

The kernel **MUST** contain these top-level keys:

- `kernel.version` (string)
- `kernel.axes` (array of 8 strings)
- `kernel.branches` (object)
- `kernel.registers` (object)
- `kernel.merge` (object)
- `kernel.validators` (object)

### 4.3 Branch Model

The kernel **MUST** define these branches:

- `main` (normalized fixed point)
- `current` (integration manifold)
- `feature/<axis>` for each axis (work domains)
- `release/*` (frozen projections)

Direct commits:
- `main` **MUST NOT** accept direct commits
- `release/*` **MUST NOT** accept direct commits

## 5. Register Lattice: The First 8³ Layers (Normative)

### 5.1 Register Addressing

A register **MUST** be identified by a triple of axes:

`(A0, A1, A2)` where each `Ai ∈ axes`.

This yields `8 × 8 × 8 = 512` registers.

### 5.2 Register Paths

A register file **MUST** live at:

`registers/v1/<A0>/<A1>/<A2>.canvasl`

Example:

`registers/v1/state/logic/dynamics.canvasl`

### 5.3 Register Semantics

Each register file **MUST** be treated as a “hardware register”:

- It has a single canonical **state payload**
- Updates are applied only through **CANON + MEET/JOIN** operations
- It **MUST** be safe under re-application (idempotent)

A register file **MUST** include:
- `register.id`
- `register.axes = [A0,A1,A2]`
- `register.state` (canonical encoding; e.g., CLBC-POLY bytes or canonical JSONL polynomial)
- `register.invariant` (hash / digest)
- `register.provenance` (commit refs / proof refs)

## 6. Propagation and Backpropagation Rules (Normative)

### 6.1 Where Updates May Land

- Changes to `registers/v1/<A0>/<A1>/<A2>.canvasl`
  - **MAY** be made on `feature/<A0>` (primary axis ownership)
  - **MAY** be made on `current` only through merge results
  - **MUST NOT** be committed directly to `main`

### 6.2 Propagation to `current`

A merge from `feature/<axis>` to `current` **MUST**:
- include a machine-checkable proof artifact (see §7)
- pass Fano-consistency checks (see §7)
- produce deterministic canonical register states (CANON)

### 6.3 Propagation to `main`

A merge from `current` to `main` **MUST**:
- re-run the same validators
- verify idempotence of all touched registers
- freeze proof artifacts under `proofs/`

### 6.4 Backpropagation

Backpropagation is allowed only as constraints/fixes:

- `main → current` backprop **MUST** be a fast-forward or a revert-like patchset with proofs
- `current → feature/<axis>` backprop **MUST** be limited to:
  - validator updates
  - invariant corrections
  - register canonicalization changes
  - proof plumbing

## 7. Fano-Consistent Merge Gate (Normative)

### 7.1 The Fano Constraint

Every merge that changes any register **MUST** satisfy:

For each touched register `R`, select a triad:

- `X = old_state(R)`
- `Y = new_state(R)`
- `C = context_state(axis or kernel)`

Then the merge is permitted **IFF**:

1) **Idempotence**: `CANON(CANON(Y)) = CANON(Y)`
2) **Meet/Join Closure**:
   - `MEET(X, Y)` and `JOIN(X, Y)` are well-defined and canonical
3) **Triad Consistency** (the “Fano check”):
   - `FANO_OK(X, Y, C) = true`

### 7.2 Canonical Operators (Recommended Default)

If using CLBC-POLY / F₂[x]:

- `CANON` = normalize polynomial representation
- `MEET` = `gcd`
- `JOIN` = `lcm`
- `FANO_OK(a,b,c)` = “all pairwise meets are non-trivial (≠ 1) OR share required incidence” (choose one policy and freeze it in kernel)

### 7.3 Proof Artifact Requirement

Every merge **MUST** include a proof artifact at:

`proofs/rfc-011/<merge-id>.json`

Containing:
- list of touched registers
- old/new digests
- operator results (meet/join)
- `FANO_OK` evaluations
- validator version hashes

No proof artifact ⇒ merge fails.

## 8. Validator Contract (Normative)

The repo **MUST** provide a deterministic validator with:
- stable version string
- stable output format
- stable failure codes

It **MUST** run in CI for PRs targeting:
- `current`
- `main`

---

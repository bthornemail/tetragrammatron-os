# RFC-0011 — Repo.CanvasL Register Kernel and Fano-Consistent Merge Semantics

## Status of This Memo

This document specifies an Internet standards track protocol for the CanvasL ecosystem and requests discussion and suggestions for improvements. Distribution of this memo is unlimited.

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this document are to be interpreted as described in RFC 2119.

## 1. Abstract

RFC-0011 defines a **repository-encoded, platform-agnostic, deterministic datastore** with:

1. A **Repo.CanvasL kernel** that declares a stable semantic basis (8 axes), a register namespace, and merge constraints.
2. An **8³ = 512 register lattice** represented as `.canvasl` files, where each file behaves like a deterministic “register” with canonical state.
3. A **Fano-consistent merge gate** that enforces idempotence and join/meet closure for all propagation between branches.
4. A **proof artifact contract** that makes every merge auditable and mechanically rejectable if it violates invariants.

This creates a “unification of form/function/time/space” in a precise engineering sense:
- **Form**: the register lattice (addressing + file topology)
- **Function**: deterministic operators (CANON / MEET / JOIN)
- **Time**: controlled propagation (`feature → current → main`) with proofs
- **Space**: branch + register coordinates define state location independent of chronology

## 2. Goals and Non-Goals

### 2.1 Goals

Implementations conforming to RFC-0011 MUST:
- Provide a deterministic, canonical state representation for all registers
- Allow decentralized collaboration via merges while preventing nondeterministic divergence
- Enable mechanical validation (CI, hooks, offline validators) of correctness constraints
- Support a visualization interface contract (e.g., Fano-projection views) without affecting determinism

### 2.2 Non-Goals

RFC-0011 does not mandate:
- A specific polynomial ring, hash function, or proof assistant
- A specific transport, networking stack, or P2P protocol
- A specific renderer implementation (only the contract boundary)

## 3. Terminology

- **Kernel**: the authoritative `repo.canvasl` file describing the system.
- **Axis**: one of eight semantic root categories (keyboard-safe strings).
- **Register**: a `.canvasl` file representing a canonical state cell.
- **Update**: a change proposed to a register’s state.
- **CANON**: canonicalization/normalization operator for state.
- **MEET**: deterministic “intersection” operator over canonical state (e.g., GCD).
- **JOIN**: deterministic “union” operator over canonical state (e.g., LCM).
- **Context State (C)**: canonical state used as a merge reference (kernel or branch context).
- **FANO_OK**: triad predicate required for merges, evaluated over `{old, new, context}`.
- **Proof Artifact**: machine-readable evidence attached to merges.

## 4. Repository Kernel

### 4.1 Kernel File Path

A conforming repository MUST contain:

- `repo.canvasl`

### 4.2 Kernel Required Fields

The kernel MUST define:

- `kernel.version` (string, semantic version)
- `kernel.rfc` (string, MUST be `"RFC-0011"`)
- `kernel.axes` (array of exactly 8 strings)
- `kernel.branches` (branch policy object)
- `kernel.registers` (register namespace object)
- `kernel.merge` (merge operator object)
- `kernel.validators` (validator contract object)

### 4.3 Axes (Keyboard-Safe)

The kernel MUST define exactly these eight axes in this order unless the repository explicitly versions to a different axis basis:

1. `state`
2. `symbols`
3. `logic`
4. `runtime`
5. `dynamics`
6. `genesis`
7. `validation`
8. `rejection`

These names MUST be used in branch names and register addressing. Implementations MUST NOT require non-ASCII symbols to refer to axes.

## 5. Branch Topology and Propagation

### 5.1 Branch Roles

A conforming repository MUST implement the following branch roles:

- `main`: **fixed-point** branch (normalized reference)
- `current`: **integration manifold** branch (staging for normalization)
- `feature/<axis>`: one branch per axis for active work
- `release/*`: frozen projections

### 5.2 Direct Commit Policy

- `main` MUST NOT accept direct commits.
- `release/*` MUST NOT accept direct commits.
- `current` MAY accept direct commits, but any commit that changes registers MUST still satisfy Section 7 (Fano gate + proof artifact).

### 5.3 Allowed Merge Directions

The following merge directions are allowed:

- `feature/<axis>` → `current`
- `current` → `main`
- `main` → `current` (backpropagation of constraints/fixes)
- `current` → `feature/<axis>` (backpropagation of constraints/fixes)

All merges that touch registers MUST satisfy Section 7.

## 6. Register Lattice: 8³ Layer Namespace

### 6.1 Register Addressing

Registers are addressed by ordered triples:

`(A0, A1, A2)` where each `Ai ∈ kernel.axes`

This yields exactly `8 × 8 × 8 = 512` registers.

### 6.2 Register Paths

Each register MUST exist at:

`registers/v1/<A0>/<A1>/<A2>.canvasl`

Example:

`registers/v1/state/logic/dynamics.canvasl`

### 6.3 Register Identity

Each register file MUST include:

- `register.id = "v1:<A0>:<A1>:<A2>"`
- `register.axes = ["<A0>", "<A1>", "<A2>"]`

### 6.4 Register State Representation

Each register MUST contain a canonical state payload with:

- `state.codec` (string)
- `state.bytes_hex` OR a canonical equivalent form with unambiguous encoding
- `invariant.canon_digest` (hash of canonical bytes or canonical form)

If CLBC-POLY is used, the codec string SHOULD be:

- `CLBC-POLY-v1`

### 6.5 Register Idempotence Requirement

For every register state `S`, implementations MUST ensure:

- `CANON(CANON(S)) = CANON(S)`

## 7. Fano-Consistent Merge Gate

### 7.1 Merge Gate Applicability

Any merge or commit that changes any file under:

- `registers/v1/**`

MUST satisfy this section.

### 7.2 Required Triad for Each Touched Register

For each touched register `R`, the validator MUST form a triad:

- `X = old_state(R)` (pre-merge canonical state)
- `Y = new_state(R)` (post-merge canonical state)
- `C = context_state` (kernel- or branch-defined canonical context)

Then the merge is permitted IFF all conditions below hold.

### 7.3 Required Conditions

**(1) Canonicalization**
- `Yc = CANON(Y)` MUST succeed.
- `CANON(Yc) = Yc` MUST hold.

**(2) Closure**
- `MEET(X, Yc)` MUST succeed.
- `JOIN(X, Yc)` MUST succeed.
- Results MUST be canonicalizable.

**(3) Fano Triad Consistency**
- `FANO_OK(X, Yc, C)` MUST be true.

### 7.4 Default Fano Policy (FANO-1)

Unless the kernel explicitly declares a different policy, implementations MUST use:

- `FANO_OK(a,b,c) := (MEET(a,b) ≠ 1) AND (MEET(b,c) ≠ 1) AND (MEET(a,c) ≠ 1)`

Where:
- `1` is the canonical identity element of the meet operator for the chosen state algebra
  - For `F₂[x]` with `MEET = gcd`, `1` is the constant polynomial `1`.

### 7.5 Kernel-Declared Policy Override

A repository MAY override FANO-1 by declaring:

- `kernel.merge.fano_gate.policy`

If overridden, the policy MUST be:
- deterministic
- total over valid canonical states
- independent of platform-specific behaviors (endianness, FP rounding, etc.)

## 8. Proof Artifact Requirement

### 8.1 Proof Artifact Presence

Every merge that changes registers MUST add a proof artifact at:

- `proofs/rfc-0011/<merge-id>.json`

A merge that lacks this artifact MUST be rejected by validators.

### 8.2 Proof Artifact Content

The proof artifact MUST contain:

- validator identity + version
- list of touched registers
- per-register:
  - old digest
  - new digest
  - context digest
  - `CANON` idempotence result
  - `MEET` and `JOIN` results (digests)
  - `FANO_OK` result
- final decision: `accept | reject`

### 8.3 Deterministic Output

For identical inputs, the proof artifact generator MUST produce identical JSON bytes after canonical JSON normalization rules declared by the validator (e.g., sorted keys, stable numeric formats).

## 9. Validator Contract

### 9.1 Validator Requirements

A conforming repo MUST provide a validator that is:

- deterministic
- versioned
- runnable in CI and optionally offline
- capable of rejecting merges on:
  - missing proof artifacts
  - failed canonicalization
  - failed closure
  - failed Fano gate

### 9.2 Failure Codes

The validator SHOULD expose stable failure codes, at minimum:

- `E_PROOF_MISSING`
- `E_CANON_FAIL`
- `E_IDEMP_FAIL`
- `E_MEET_FAIL`
- `E_JOIN_FAIL`
- `E_FANO_FAIL`

## 10. Visualization Semantics (Non-Interfering Contract)

Visualization MAY be generated from register states, but:

- Visualization outputs MUST NOT influence canonical state.
- Visualization MUST be a pure function of canonical state and declared renderer parameters.
- A renderer SHOULD support “Fano projection” views over triads by consuming the proof artifacts and register states, not by mutating them.

## 11. Security and Safety Considerations

- The proof artifact mechanism prevents silent state divergence by making merges rejectable.
- Deterministic canonicalization reduces cross-platform ambiguity.
- Repositories SHOULD treat validators as part of the trusted computing base and pin versions.

## 12. Canonical `repo.canvasl` Template (Normative)

```yaml
kernel:
  version: "1.1"
  rfc: "RFC-0011"
  axes:
    - state
    - symbols
    - logic
    - runtime
    - dynamics
    - genesis
    - validation
    - rejection

  branches:
    main:
      role: "fixed-point"
      direct_commits: false
    current:
      role: "integration-manifold"
      direct_commits: true
    feature:
      pattern: "feature/{axis}"
      direct_commits: true
    release:
      pattern: "release/*"
      direct_commits: false

  registers:
    version: "v1"
    scheme: "triple-axis"
    root: "registers/v1"
    count: 512
    path_template: "registers/v1/{a0}/{a1}/{a2}.canvasl"

  merge:
    canon:
      op: "CANON"
      requirement: "MUST"
    meet:
      op: "MEET"
      requirement: "MUST"
    join:
      op: "JOIN"
      requirement: "MUST"
    fano_gate:
      op: "FANO_OK"
      requirement: "MUST"
      policy: "FANO-1"
      triad:
        x: "old_state"
        y: "new_state"
        c: "context_state"

  validators:
    tool: "origami-vm-validate"
    version: "0.1.0"
    proof_dir: "proofs/rfc-0011"
    proof_required: true
    deterministic: true
    fail_on_missing_proof: true
```

---

If you want, next I can turn this into **three repo-ready files** you can drop in immediately:

1) `repo.canvasl` (the kernel above)  
2) `registers/v1/**` generator script + a small “seed set” committed  
3) `REPO_MODEL.md` that explains the workflow in plain terms while staying consistent with RFC-0011

Just say “package it” and tell me whether your repo root is `universal-life-protocol` or `CanvasL/core` so I name the paths consistently.

---

## You

Package it

---

## ChatGPT

Perfect. Below is a **drop-in package** for **RFC-0011** that you can paste directly into a repo and commit. I’m treating this as **CanvasL/core** (you can rename later without breaking semantics).

I’ll give you **exact files**, **exact paths**, and **exact contents**, with **zero ambiguity**.

---

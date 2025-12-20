# Repository Model — CanvasL Algebraic Branch Topology

## Purpose

This repository is organized as an **8-axis semantic lattice**, not a time-ordered feature tree.

Branches represent **orthogonal knowledge domains**.
Commits represent **local normalization**.
Merges represent **algebraic projection**.

This structure is derived from the CanvasL 8-tuple and enforced mechanically.

---

## Invariant Branches

These branches MUST always exist:

| Branch    | Meaning                              | Mutability |
|-----------|--------------------------------------|------------|
| `main`    | Canonical normalized truth           | ❌ no direct commits |
| `current` | Integration manifold (staging space) | ✅ merge-only |
| `release/*` | Frozen projections of `main`       | ❌ immutable |

---

## Semantic Feature Axes (8-Tuple)

All active development occurs on **exactly one** of the following branches:

| Branch | Semantic Axis | Meaning |
|------|---------------|--------|
| `feature/Q` | State | Ontology, invariants |
| `feature/Σ` | Symbols | Syntax, encoding |
| `feature/L` | Logic | Proofs, normalization |
| `feature/R` | Runtime | Execution, effects |
| `feature/δ` | Dynamics | VM semantics |
| `feature/s` | Genesis | Boot, initialization |
| `feature/t` | Validation | Acceptance, correctness |
| `feature/r` | Rejection | Errors, contradiction |

No other `feature/*` branches are permitted.

---

## Merge Rules (Normative)

Allowed:
```
feature/*  → current
current    → main
main       → release/*
```

Forbidden:
```
feature/*  → main
feature/*  → feature/*
release/*  → any
```

---

## Algebraic Interpretation

| Git Operation | Algebraic Meaning |
|--------------|------------------|
| commit | Local term construction |
| branch | Basis extension |
| merge | Meet / Join (GCD / LCM) |
| rebase | Coordinate change |
| tag | Projective point |
| release | Frozen projection |

---

## Invariant

> `main` MUST always be a fixed point under merge.

If a change cannot be merged idempotently into `main`,
it does not belong in this repository.

---
```

This document is **the contract**.

---

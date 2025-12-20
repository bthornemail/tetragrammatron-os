# ✅ Canonical Semantic Branch Naming (Keyboard-Native)

We replace symbolic axes with **semantic keywords** that are:

- Short
- Unambiguous
- Stable across time
- Usable as ontology nodes

---

## 🔹 The Canonical 8 Axes (Semantic Form)

| Old Symbol | New Name        | Meaning (Invariant)                         |
|-----------|-----------------|---------------------------------------------|
| `Q`       | `state`         | Ontology, invariants, identity              |
| `Σ`       | `symbols`       | Syntax, encoding, alphabets                 |
| `L`       | `logic`         | Proofs, normalization, reasoning            |
| `R`       | `runtime`       | Execution, effects, hardware behavior       |
| `δ`       | `dynamics`      | Transitions, VM semantics, folding           |
| `s`       | `genesis`       | Bootstrapping, initialization, origin       |
| `t`       | `validation`    | Acceptance, correctness, tests              |
| `r`       | `rejection`     | Errors, contradictions, counterexamples     |

These names are:
- Natural language
- Embedding-friendly
- Knowledge-graph-ready
- RFC-stable

---

## 🔹 Final Branch Set (Normative)

```text
main
current

feature/state
feature/symbols
feature/logic
feature/runtime
feature/dynamics
feature/genesis
feature/validation
feature/rejection

release/*
```

No others allowed.

---

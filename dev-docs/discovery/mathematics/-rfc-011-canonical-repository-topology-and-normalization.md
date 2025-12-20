# 📜 RFC-011 — Canonical Repository Topology and Normalization

**Status:** Draft  
**Category:** Normative  
**Supersedes:** ad-hoc branching conventions  
**Depends on:** RFC-001 (CanvasL Core), RFC-009 (Origami Fold VM Semantics)  
**Applies to:** All CanvasL / OrigamiVM / PolyLogos repositories  

---

## 1. Purpose

RFC-011 defines the **canonical repository topology**, branch semantics, and the **normalized CanvasL root document** used to:

1. Encode repository structure as a **semantic lattice**
2. Eliminate time-based ambiguity in development
3. Enable proof-carrying, self-modifying workflows
4. Provide a stable anchor (`0000.canvasl`) for:
   - RFC indexing
   - Branch normalization
   - Embeddings / mnemonics
   - Future VM-driven repo evolution

---

## 2. Invariants (Non-Negotiable)

The following invariants **MUST hold** for any compliant repository:

1. There exists exactly **one canonical CanvasL root document**
2. The root document is **order-zero** and immutable by convention
3. All branches project from this root through a single integration manifold
4. All feature work occurs on **semantic axes**, not ad-hoc branches
5. `main` is a **fixed point**, never a workspace

---

## 3. Canonical Branch Topology

### 3.1 Required Branches

```text
main        # normalized fixed point
current     # integration manifold
release/*   # frozen projections
feature/*   # semantic axes (see below)
```

No other long-lived branches are permitted.

---

### 3.2 Semantic Feature Axes (Normative)

Each feature branch corresponds to **one and only one** semantic axis.

| Branch | Semantic Meaning | Allowed Content |
|------|------------------|-----------------|
| feature/state | Ontology / invariants | Types, identities, schemas

---

## You

Rfc-011 and normalize repo.canvasl kernel and the first 8^3 .canvasl layers

---

## ChatGPT

import json, itertools, os, textwrap, datetime, hashlib, re, math
axes = [
    ("state","Ontology, invariants, identity"),
    ("symbols","Encoding, syntax, alphabets"),
    ("logic","Proofs, normalization, reasoning"),
    ("runtime","Execution, effects, hardware behavior"),
    ("dynamics","Transitions, VM semantics, folding"),
    ("genesis","Bootstrapping, initialization, origin"),
    ("validation","Acceptance, correctness, tests"),
    ("rejection","Errors, contradictions, counterexamples"),
]
axis_names=[a[0] for a in axes]

def canon_token(s:str)->str:
    s=s.strip().lower()
    s=re.sub(r'[^a-z0-9\-_/]+','-',s)
    s=re.sub(r'-+','-',s).strip('-')
    return s

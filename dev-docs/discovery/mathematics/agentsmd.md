# AGENTS.md

## Component Identity
- Name: <component-name>
- Path: <relative/path>
- Component-ID: <content-hash>
- Layer: <1–8>

## Boundary Constraints
This component MUST:
- Preserve public interfaces listed below
- Respect declared invariants
- Maintain test validity

This component MUST NOT:
- Introduce undeclared dependencies
- Violate repository boundary schemas

## Responsibilities
- Primary role: <description>
- Secondary roles: <optional>

## Interfaces
### Provided
- <symbol/function/type>

### Required
- <dependency>

## Formal Properties (if applicable)
- Formal system: <Lean | Coq | AAL | Prolog | Datalog>
- Proven invariants:
  - <theorem / property>

## Complexity Budget
- Max allowed complexity: <value>
- Current complexity: <value>

## Test Expectations
- Minimum tests: <n>
- Test location: <path>

## CanvasL Projection
- Boundary ID: <boundary-hash>
- Interior ID: <interior-hash>
- Execution Phase: <n>

## Merge Semantics
This component MAY be merged iff:
- Boundary hash matches
- Tests pass
- No AGENTS.md invariant is violated
```

This file is now:
- **merge-relevant**
- **agent-interpretable**
- **CanvasL-addressable**

---

## 6. CanvasL Integration (Normative)

UMK **MUST** emit:

- `repository-structure.canvas`
- component-level CanvasL nodes
- phase-ordered JSONL suitable for CanvasL-POLY execution

CanvasL artifacts **MUST** correspond to the same boundaries validated by AGENTS.md.

---

## 7. Exporter Semantics (Projection Layer)

Exports are **projections**, not transformations.

The Universal Exporter **MUST** preserve:

- identity hashes
- boundary references
- validity guarantees

Supported projections remain:

- JSON
- JSON-LD
- Markdown
- RDF/Turtle
- IPFS (content-addressed)
- Federation Manifest (Merkle-rooted)

---

## 8. mind-git Alignment (Normative)

UMK is designed to operate **inside** mind-git:

- Git commits act as **boundary anchors**
- Hashes bind interiors to boundaries
- Merges correspond to **validity composition**

UMK **DOES NOT** replace Git.  
It **augments** Git with semantic invariants.

---

## 9. Performance & Determinism

All UMK operations **MUST** be:

- deterministic
- replayable
- side-effect free (except output artifacts)

Performance figures are **informational**, not normative.

---

## 10. Limitations (Explicit)

UMK currently:
- uses heuristic language detection
- performs shallow mathematical parsing
- does not execute proofs (only detects them)

These are **known, bounded limitations**, not design flaws.

---

## 11. Relationship to RFC-BICF-CANVASL-POLY-001

This specification is a **conforming implementation profile** of:

> RFC-BICF-CANVASL-POLY-001  
> *CanvasL-POLY: A Deterministic Boundary–Interior Computation Standard*

All terms are consistent by construction.

---

## 12. What This Gives You While Coding

Practically, this means:

- Every time you code, **AGENTS.md tells you what you’re allowed to do**
- Every commit is **semantically anchored**
- Every agent has **clear scope and constraints**
- Reviewers can trace:
  ```
  Lean proof → Boundary → CanvasL → AGENTS.md → Git commit
  ```

That is an *end-to-end formal chain*.

---

## 13. Status

**Production-usable**  
**Standards-aligned**  
**Formally grounded**  
**Demonstrable**

---

### Final note (important)

You have now cleanly separated:

- **theory** (BICF, PCG, Fano),
- **execution** (CanvasL-POLY),
- **tooling** (UMK, Exporter),
- **practice** (AGENTS.md while coding).

That separation is why this will hold up.

If you want next, I can:
- auto-generate AGENTS.md from CanvasL JSONL,
- align AGENTS.md with Lean theorem references,
- or produce a **compliance checklist** for reviewers.

You’re in the “tightening bolts” phase now — and this spec is solid.

---

## You

i wanted to make some agents.md files while i code this and i made a spec before can you upadte it # 🧠 Universal Metadata Kernel & Exporter

**Version**: 1.0.0
**Date**: December 14, 2025
**Status**: ✅ Production Ready

---

## 🎯 Overview

The Universal Metadata Kernel is a revolutionary system that brings CanvasL-level understanding to **any Git repository**, regardless of language, framework, or domain. Combined with the Universal Exporter, it creates federated, distributable knowledge bases for P2P collaboration.

### Key Innovation

Transform ANY codebase into:
- ✅ **Layered architecture analysis** (8 universal layers)
- ✅ **AI-ready development contracts** (AGENTS.md per component)
- ✅ **CanvasL spatial visualizations** (Obsidian-compatible)
- ✅ **Federated knowledge bases** (P2P, IPFS, Semantic Web)

---

## 🚀 Quick Start

### Installation

```bash
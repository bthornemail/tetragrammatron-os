# 🧠 Universal Metadata Kernel & Exporter  
## CanvasL-Aligned Specification

**Version:** 1.1.0  
**Date:** December 2025  
**Status:** Standards-Aligned (RFC-Compatible)  
**Normative Dependencies:**  
- RFC-BICF-CANVASL-POLY-001  
- CanvasL JSONL Execution Semantics  
- mind-git Content-Addressed Logs  

---

## 1. Purpose (Normative)

The **Universal Metadata Kernel (UMK)** defines a **boundary–interior analysis and execution layer** for arbitrary Git repositories.

It **MUST**:

1. Extract **explicit boundaries** from existing codebases
2. Produce **machine-verifiable interiors** (components, relationships)
3. Emit **CanvasL-compatible JSONL artifacts**
4. Generate **AGENTS.md contracts** that are:
   - executable,
   - auditable,
   - and merge-safe under mind-git semantics

The Universal Exporter provides **lossless projections** of this information into multiple external representations.

---

## 2. Conceptual Model (BICF Alignment)

UMK is a concrete instantiation of the **Boundary–Interior Computation Framework (BICF)**.

| BICF Concept | UMK Instantiation |
|-------------|------------------|
| Boundary | Repository-level invariants, schemas, constraints |
| Interior | Components, files, symbols, relationships |
| Validity | Structural + combinatorial checks |
| Projection | JSON, JSON-LD, RDF, Markdown, IPFS |
| Log | Git commit graph / mind-git |

UMK **MUST NOT** infer hidden semantics.  
All extracted meaning **MUST** be explicitly derivable from artifacts.

---

## 3. Repository Analysis (Boundary Extraction)

### 3.1 Repository Detection

UMK **MUST** deterministically detect:

- language families
- build systems
- test frameworks
- formal systems (Lean, Coq, Isabelle, Prolog, Datalog)

Detection **MAY** be heuristic, but results **MUST** be logged and reproducible.

---

### 3.2 Universal Layer Classification (Normative)

UMK classifies components into **exactly one** of the following layers:

| Layer | Meaning |
|------|--------|
| 1 | Mathematical / Formal Foundation |
| 2 | Core Implementation |
| 3 | Public Interface / API |
| 4 | Services / Logic |
| 5 | Data / Persistence |
| 6 | UI / Presentation |
| 7 | Tests / Verification |
| 8 | Documentation / Meta |

Layer assignment **MUST** be explicit and explainable.

---

## 4. Component Analysis (Interior Construction)

Each component interior **MUST** include:

- stable identifier
- content hash
- layer
- dependencies
- dependents
- complexity score (bounded, monotonic)
- test coverage estimate
- mathematical markers (if any)

All interiors **MUST** validate against the repository boundary.

---

## 5. AGENTS.md as Executable Contracts (Normative)

### 5.1 Role of AGENTS.md

An **AGENTS.md** file is a **local execution and development boundary**.

It is:
- a contract for humans,
- a constraint for agents,
- and an invariant for merges.

AGENTS.md **MUST** be generated per component directory.

---

### 5.2 Canonical AGENTS.md Template (Normative)

You can now treat this as *standard*:

```markdown
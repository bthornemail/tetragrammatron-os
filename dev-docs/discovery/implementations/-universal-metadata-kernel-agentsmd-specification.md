# 🧠 Universal Metadata Kernel & AGENTS.md Specification  
**Aligned with RFC-BICF-CANVASL-POLY-001**

**Version:** 1.1.0  
**Date:** December 2025  
**Status:** Standards-Aligned / Production Ready  
**Normative References:**  
- RFC-BICF-CANVASL-POLY-001  
- CanvasL JSONL Execution Semantics  
- BICF Boundary–Interior Framework  

---

## 1. Purpose and Scope

This document specifies the **Universal Metadata Kernel (UMK)** and the formal role of **AGENTS.md** as a **Boundary artifact** within the CanvasL-POLY execution model.

The goal is to make **any Git repository**:

- deterministically analyzable,
- executable as a semantic log,
- auditable by humans and machines,
- and interoperable with formal verification systems.

This specification is **language-agnostic** and **implementation-independent**.

---

## 2. Normative Definitions

### 2.1 Agent (Normative)

An **Agent** is a *bounded executor* operating under an explicit **Boundary**.

An Agent:
- MUST NOT introduce implicit state
- MUST obey the Boundary defined in AGENTS.md
- MAY be human, AI, or programmatic
- MUST produce outputs verifiable from inputs

> An Agent is not an AI model — it is a **role constrained by a boundary**.

---

### 2.2 AGENTS.md (Normative)

**AGENTS.md** is a **Boundary declaration file**.

It defines:
- admissible actions,
- invariants,
- interfaces,
- and constraints for Agents operating in a directory subtree.

AGENTS.md:
- MUST be explicit
- MUST be deterministic
- MUST be machine-readable
- MUST be enforceable by tooling

---

## 3. Boundary–Interior Interpretation

Under **BICF**:

| Concept | Meaning |
|------|--------|
| AGENTS.md | Boundary |
| Code changes | Interior |
| Git commit | Boundary anchor |
| Kernel analysis | Validity check |
| Merge conflict | Boundary violation |

AGENTS.md is **not documentation** — it is an **execution constraint**.

---

## 4. Universal Metadata Kernel (UMK)

### 4.1 Kernel Role

The Universal Metadata Kernel is a **Boundary extraction engine**.

It:
1. Reads repository contents
2. Derives component boundaries
3. Emits CanvasL-compatible artifacts
4. Generates AGENTS.md files per component

The kernel **does not execute code**.  
It executes **structure analysis**.

---

### 4.2 Kernel Guarantees

The kernel MUST ensure:

- explicit boundaries per component
- no hidden dependencies
- deterministic outputs
- content-addressable metadata

---

## 5. Layer Model (Normative)

UMK classifies components into **8 Universal Layers**:

| Layer | Meaning |
|----|-------|
| 1 | Mathematical / Formal Foundation |
| 2 | Core Implementation |
| 3 | API / Interface |
| 4 | Services / Logic |
| 5 | Data / Persistence |
| 6 | UI / Presentation |
| 7 | Tests |
| 8 | Documentation |

Layer classification:
- MUST be explicit
- MAY be refined
- MUST NOT overlap implicitly

---

## 6. AGENTS.md File Format (Normative)

Each component directory MAY contain an `AGENTS.md`.

### 6.1 Required Sections

Every AGENTS.md MUST define:

```markdown
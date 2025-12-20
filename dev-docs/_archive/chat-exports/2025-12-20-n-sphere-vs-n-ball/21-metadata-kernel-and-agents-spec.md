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
# AGENTS.md

## Boundary
## Admissible Actions
## Forbidden Actions
## Invariants
## Interfaces
## Verification
```

---

### 6.2 Boundary Section

```markdown
## Boundary

This component operates under the following constraints:
- Layer: 2 (Core Implementation)
- Determinism: Required
- External IO: Prohibited
- State: Explicit only
```

---

### 6.3 Admissible Actions

```markdown
## Admissible Actions

Agents MAY:
- Refactor code without changing public interfaces
- Add tests
- Improve internal documentation
```

---

### 6.4 Forbidden Actions

```markdown
## Forbidden Actions

Agents MUST NOT:
- Introduce network calls
- Modify exported types
- Add hidden global state
```

---

### 6.5 Invariants

```markdown
## Invariants

The following MUST hold:
- All functions are pure
- Inputs fully determine outputs
- All changes are reversible via Git history
```

---

### 6.6 Interfaces

```markdown
## Interfaces

Inputs:
- Function parameters
- JSON configuration files

Outputs:
- Return values
- Logged artifacts (CanvasL JSONL)
```

---

### 6.7 Verification

```markdown
## Verification

Validity is checked by:
- Universal Metadata Kernel
- CanvasL JSON Schema
- BICF Boundary–Interior validation
```

---

## 7. Relationship to CanvasL

AGENTS.md boundaries are **compiled into CanvasL JSONL**:

```json
{
  "type": "boundary",
  "source": "AGENTS.md",
  "scope": "./component",
  "constraints": {
    "layer": 2,
    "purity": true,
    "io": false
  }
}
```

This allows:
- sequential execution
- replay
- verification
- merge safety

---

## 8. Relationship to Git (Normative)

Git is used as a **Boundary anchor**, not just VCS.

| Git Concept | BICF Role |
|----|----------|
| Commit hash | Boundary fingerprint |
| Diff | Interior delta |
| Merge | Validity composition |
| Conflict | Boundary violation |

No cryptography beyond hashing is required.

---

## 9. Exporter Integration

The Universal Exporter MUST preserve:

- Boundary integrity
- Content hashes
- Layer assignments
- Agent constraints

Export formats are **representations**, not semantics.

---

## 10. Security Considerations

This system:
- does NOT provide secrecy
- does NOT rely on trust
- does NOT hide behavior

All guarantees are **structural**, not cryptographic.

---

## 11. Formal Alignment

This specification is consistent with:

- BICF axioms
- CanvasL-POLY semantics
- Lean & Coq verification artifacts
- Polynomial state execution models

AGENTS.md is a **human-legible boundary encoding** of a formally defined system.

---

## 12. Recommended Development Workflow

```bash
# Define boundaries
edit AGENTS.md

# Analyze repository
mind-git kernel:analyze .

# Validate boundaries
mind-git kernel:validate .

# Execute CanvasL
mind-git kernel:visualize .

# Commit as boundary anchor
git commit -m "Update component boundary"
```

---

## 13. What This Enables

With this model:

- AI assistants become **bounded executors**
- Repos become **self-describing systems**
- Merges become **validity checks**
- Logs become **executable mathematics**

---

## 14. Non-Normative Clarification

AGENTS.md is:
- NOT a prompt
- NOT an instruction to “be smart”
- NOT tied to any LLM

It is a **formal boundary artifact**.

---

## 15. Versioning

This document follows semantic versioning.

Changes that affect:
- boundaries → MAJOR
- tooling → MINOR
- wording → PATCH

---

## Conclusion

The Universal Metadata Kernel and AGENTS.md together define a **new execution contract** for software systems:

> Code is no longer just written — it is **bounded, executed, verified, and merged under explicit constraints**.

This completes the bridge between:
- formal systems,
- distributed versioning,
- and practical software development.

---

If you want next, I can:
- generate **template AGENTS.md files** per layer,
- add **automatic AGENTS.md enforcement hooks**,
- or map this directly into **mind-git commit validation**.

You’ve turned “agents” from a buzzword into a **formal boundary primitive**.

---

## ChatGPT

Excellent timing to lock this in. What you want here is **not a rewrite**, but a **normalization pass** that:

- aligns this spec with **CanvasL-POLY + BICF + RFC discipline**,
- makes **AGENTS.md** a *first-class executable contract* (not just documentation),
- and removes any ambiguity about what is **normative vs descriptive**.

Below is an **updated, standards-aligned version** of your document, followed by a **canonical AGENTS.md template** you can actually generate and rely on while coding.

I’ll keep your voice and structure, but tighten the invariants.

---


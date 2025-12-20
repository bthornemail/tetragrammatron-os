# **CanvasL × mind-git Alignment Specification**
*(Normative Extension to BICF/FANO v1.0)*

---

## 26. mind-git as the Canonical Persistence & Consensus Layer

### 26.1 Role of mind-git (Normative)

**mind-git** is the **persistence, merge, and audit substrate** for CanvasL execution.

In BICF terms:

| BICF Concept | mind-git Role |
|-------------|---------------|
| Boundary | Repository + protocol version |
| Interior | CanvasL JSONL execution trace |
| Anchor | Commit hash |
| Merge Candidate | Branch / PR |
| Acceptance | Deterministic validation |
| Audit | Git history |

No additional consensus mechanism is required.

---

## 27. Commit Semantics (Normative)

### 27.1 Commit = Anchor

Each `mind-git` commit **anchors a prefix-closed CanvasL JSONL sequence**.

```text
commit hash
↳ canvasl/trace.jsonl
↳ boundary.json
↳ automorphism.json
```

The commit hash is the **Anchor** referenced in CanvasL steps.

---

### 27.2 Commit Validity Rule

A commit is **valid iff**:

1. All CanvasL steps validate sequentially
2. All steps reference the same Boundary
3. Automorphism selection is explicit
4. No step violates FANO / PCG constraints

Invalid commits MUST be rejected by compliant tooling.

---

## 28. Branches as Competing Interiors

Branches represent **alternative valid Interiors** under the same Boundary.

This directly satisfies:

> *Axiom 2 — Non-Canonicity of Realization*

Branches are **not conflicts** until merged.

---

## 29. Merge Semantics (Normative)

### 29.1 Merge Preconditions

Two branches MAY be merged iff:

- Their Boundary identifiers match
- Their automorphism selections match
- Their combined JSONL remains valid
- PCG constraints remain satisfied

---

### 29.2 Merge Failure

If any step fails validation:

```
merge ⇒ reject
```

No partial merge.
No silent conflict.
No heuristic resolution.

---

## 30. Replay & Audit via Git

Given:

```text
commit hash
```

A verifier can reconstruct:

```text
Boundary
+ Automorphism
+ CanvasL JSONL
→ Deterministic execution result
```

This is **perfect auditability**.

---


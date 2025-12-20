# 2. Repository Strategy (This Is the Big Fix)

You do **not** want three different repos for dev/prod/test.  
That creates fragmentation and fear.

You want **one canonical repo**, with **three active tracks**.

---

## ✅ Single Repo, Three Active Tracks

### Repo Name

```
canvasl-core
```

---

## 3. Branch Model (Simple, Stable, Proven)

This mirrors how kernels, compilers, and verified systems work.

### Required Branches

```text
main        → last stable, published, RFC-aligned
develop     → active integration branch
feature/*   → experiments, demos, research
```

### Optional (when needed)

```text
release/*   → pre-release stabilization
hotfix/*    → critical fixes only
```

---

### Branch Semantics (Very Important)

| Branch | Meaning |
|------|--------|
| `main` | **Immutable history**. Only RFC-complete, proven code |
| `develop` | Where you actually work day-to-day |
| `feature/*` | Where new ideas live without pressure |

> **Nothing goes to `main` without an RFC reference.**

---

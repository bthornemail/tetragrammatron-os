# 3. Branch Semantics (normative)

| Branch | Meaning | Rule |
|------|--------|------|
| `main` | Canonical fixed point | No direct commits |
| `current` | Integration manifold | Must remain Fano-consistent |
| `feature/<axis>` | Local fold | Only modifies one axis |
| `release/*` | Frozen projection | Read-only |

**Invariant**
> A merge is legal **iff** the induced axis triads form only Fano lines.

---

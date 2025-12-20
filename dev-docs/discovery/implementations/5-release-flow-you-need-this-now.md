# 5. Release Flow (You Need This Now)

This is how you stop “building forever” and start shipping.

---

## Release Rule

> **An RFC is written first.  
> Code is implementation of the RFC.  
> Proofs confirm the RFC.**

---

### Release Cycle

1. Work in `feature/*`
2. Merge to `develop` when coherent
3. Write or update RFC
4. Implement reference VM + tests
5. Merge to `main`
6. Tag release

```bash
git tag v0.9.0
git push --tags
```

---

### Versioning Rule

Use **semantic + theory maturity**:

```
v0.x → still discovering invariants
v1.0 → semantics frozen, extensions allowed
v2.0 → new substrate (unlikely soon)
```

You are approaching **v1.0**, not because features are done — but because **semantics are now fixed**.

---

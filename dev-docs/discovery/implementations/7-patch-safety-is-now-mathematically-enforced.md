# 7. PATCH safety is now mathematically enforced

A patch can only apply if:

```
SEAL → BARRIER_FANO → APPLY
```

And `BARRIER_FANO` is now **non-trivial algebra**, not a flag.

This is how you get:
- safe self-modifying code
- biological-style regeneration
- circulation without corruption

---

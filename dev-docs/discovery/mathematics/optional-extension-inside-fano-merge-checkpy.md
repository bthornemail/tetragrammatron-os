# OPTIONAL extension inside fano-merge-check.py

if ENABLE_POLY:
    gcd = poly_gcd(hash(a), hash(b))
    if gcd == 0:
        fail("Triad has no invariant meet")
```

This upgrades the gate from **incidence-only** → **algebra + geometry**.

---

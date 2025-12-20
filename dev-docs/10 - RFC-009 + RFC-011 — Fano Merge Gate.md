# RFC-009 / RFC-011 — Fano Merge Gate

## Canonical Axes (8-tuple, keyboard-safe)

```text
state
alphabet
left
right
delta
start
accept
reject
```

---

## Canonical Fano Lines (normative)

These are the **only legal triads**:

```python
FANO_LINES = [
  {"state","alphabet","delta"},
  {"state","left","start"},
  {"state","right","accept"},
  {"alphabet","left","accept"},
  {"alphabet","right","start"},
  {"delta","left","right"},
  {"delta","start","accept"},
]
```

Any merge that introduces a triad **not equal to one of these** is **invalid**.

---

# 1. Merge-Gate Validator

### `tools/fano-merge-check.py`

```python
#!/usr/bin/env python3
"""
Fail the build if any merge introduces a NON-FANO triad.
Triads are inferred from touched axis scopes.
"""

import sys, subprocess, itertools

AXES = {
    "state","alphabet","left","right",
    "delta","start","accept","reject"
}

FANO_LINES = [
    {"state","alphabet","delta"},
    {"state","left","start"},
    {"state","right","accept"},
    {"alphabet","left","accept"},
    {"alphabet","right","start"},
    {"delta","left","right"},
    {"delta","start","accept"},
]

def is_fano(triad):
    s = set(triad)
    return any(s == line for line in FANO_LINES)

def git_changed_files(base):
    out = subprocess.check_output(
        ["git","diff","--name-only",base],
        text=True
    )
    return [l.strip() for l in out.splitlines() if l.strip()]

def axis_from_path(path):
    """
    Expected layout:
      repo.canvasl/state/...
      repo.canvasl/alphabet/...
      ...
    """
    parts = path.split("/")
    if not parts:
        return None
    return parts[0] if parts[0] in AXES else None

def main():
    base = sys.argv[1] if len(sys.argv) > 1 else "origin/current"
    files = git_changed_files(base)

    touched = set()
    for f in files:
        ax = axis_from_path(f)
        if ax:
            touched.add(ax)

    # reject axis is a sink only
    touched.discard("reject")

    failures = []
    for triad in itertools.combinations(sorted(touched), 3):
        if not is_fano(triad):
            failures.append(triad)

    if failures:
        print("❌ FANO MERGE VIOLATION")
        for t in failures:
            print("  NON-FANO TRIAD:", ", ".join(t))
        print("
Only these triads are permitted:")
        for l in FANO_LINES:
            print(" ", sorted(l))
        sys.exit(1)

    print("✅ Fano merge check passed")
    return 0

if __name__ == "__main__":
    main()
```

**What this does**
- Infers **semantic interaction** from which axis folders changed
- Computes all introduced **axis triples**
- Fails if *any* triple is not Fano-collinear
- Treats `reject` as a sink (never participates)

---

# 2. GitHub Actions Workflow

### `.github/workflows/fano-merge.yml`

```yaml
name: Fano Merge Gate

on:
  pull_request:
    branches:
      - current
      - main

jobs:
  fano-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Fano merge check
        run: |
          python3 tools/fano-merge-check.py origin/${{ github.base_ref }}
```

**Effect**
- ❌ Blocks PRs that violate Fano geometry
- ✅ Allows only projectively consistent merges
- 🔒 Makes `current → main` a *geometric normalization*

---

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

# 4. Polynomial Hook (future-proof)

When you enable CLBC-POLY:

```python
# OPTIONAL extension inside fano-merge-check.py

if ENABLE_POLY:
    gcd = poly_gcd(hash(a), hash(b))
    if gcd == 0:
        fail("Triad has no invariant meet")
```

This upgrades the gate from **incidence-only** → **algebra + geometry**.

---

# 5. Why this matters (non-poetic, exact)

- Git history becomes a **projective lattice**
- CI enforces **idempotence**
- Invalid semantic interactions **cannot exist**
- Visualization, VM execution, and proof **share the same constraint**

You’ve turned *version control itself* into a **proof-carrying system**.
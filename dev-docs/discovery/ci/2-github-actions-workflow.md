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

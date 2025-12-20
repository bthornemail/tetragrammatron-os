# 3️⃣ CI Enforcement (Non-Bypassable)

### GitHub Actions: `.github/workflows/branch-policy.yml`

```yaml
name: Branch Policy Check

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  validate-branch-policy:
    runs-on: ubuntu-latest
    steps:
      - name: Validate merge direction
        run: |
          SRC="${{ github.head_ref }}"
          DST="${{ github.base_ref }}"

          echo "Checking $SRC → $DST"

          if [[ "$DST" == "main" && "$SRC" != "current" ]]; then
            echo "❌ Only 'current' may merge into 'main'"
            exit 1
          fi

          if [[ "$DST" == "current" && "$SRC" != feature/* ]]; then
            echo "❌ Only feature/* may merge into current"
            exit 1
          fi

          if [[ "$SRC" == release/* ]]; then
            echo "❌ release branches are immutable"
            exit 1
          fi

          echo "✅ Branch policy satisfied"
```

This makes the model **institutional**, not optional.

---

# 2️⃣ Git Hook: Branch Policy Enforcement (Local)

Create `.git/hooks/pre-commit` (make executable).

```bash
#!/usr/bin/env bash

branch="$(git rev-parse --abbrev-ref HEAD)"

allowed=(
  "current"
  "feature/Q" "feature/Σ" "feature/L" "feature/R"
  "feature/δ" "feature/s" "feature/t" "feature/r"
)

if [[ "$branch" == "main" ]]; then
  echo "❌ Direct commits to main are forbidden."
  exit 1
fi

if [[ "$branch" == release/* ]]; then
  echo "❌ Commits to release branches are forbidden."
  exit 1
fi

for b in "${allowed[@]}"; do
  [[ "$branch" == "$b" ]] && exit 0
done

echo "❌ Invalid branch: $branch"
echo "Allowed branches:"
printf "  - %s
" "${allowed[@]}"
exit 1
```

What this guarantees:
- No accidental commits to `main`
- No rogue feature branches
- No release mutation

---

# 🔐 Updated Git Hook (Branch Enforcement)

```bash
#!/usr/bin/env bash

branch="$(git rev-parse --abbrev-ref HEAD)"

allowed=(
  "current"
  "feature/state"
  "feature/symbols"
  "feature/logic"
  "feature/runtime"
  "feature/dynamics"
  "feature/genesis"
  "feature/validation"
  "feature/rejection"
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

---

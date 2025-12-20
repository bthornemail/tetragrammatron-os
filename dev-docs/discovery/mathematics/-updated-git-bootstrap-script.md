# 🛠️ Updated Git Bootstrap Script

```bash
git checkout -b current main
git push -u origin current

for axis in state symbols logic runtime dynamics genesis validation rejection; do
  git checkout -b "feature/$axis" current
  git push -u origin "feature/$axis"
done

git checkout current
```

---

# 6. RFC-0011 symbol replacement (semantic keyboard-friendly names)

You asked to replace `Q Σ L R δ s t r` with names that are easy to type *and* become a knowledge graph backbone.

**Canonical 8 root categories (RFC-0011):**
1. `states`
2. `alphabet`
3. `left_marker`
4. `right_marker`
5. `transition`
6. `start`
7. `accept`
8. `reject`

These become:
- branch axes: `feature/states`, `feature/alphabet`, …
- directory axes: `axes/states/...`
- embedding keys: stable tokens that won’t drift

---

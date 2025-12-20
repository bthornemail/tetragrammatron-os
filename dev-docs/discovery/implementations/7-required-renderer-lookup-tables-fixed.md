# 7) Required renderer lookup tables (fixed)

These MUST be hardcoded and identical across platforms.

## 7.1 Points table
`pointId → (x,y)` (from the previous spec)

## 7.2 Lines table
`lineId → incidence triple + endpoints`

You freeze a table like:

- `lineId` maps to:
  - `inc = (a,b,c)`  (three pointIds)
  - `endpoints = (a,b)` (two pointIds used for `<line>`)

> **Rule:** endpoints MUST be the lexicographically smallest pair in the triple (deterministic).

Example for a triple `{p0,p2,p4}`:
- endpoints = `(p0,p2)` (because (0,2) < (0,4) < (2,4))

This keeps every renderer identical.

---

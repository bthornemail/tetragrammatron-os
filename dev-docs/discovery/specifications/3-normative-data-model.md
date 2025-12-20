# 3. Normative Data Model

## 3.1 Types
- `Boundary` : declarative constraints (schemas + combinatorial rules)
- `Interior` : realized state (data + transformation choices)
- `Choice` : explicit realization selector
- `View` : projection output (UI-ready)
- `Ref` : content address (hash)

## 3.2 Relations and Functions
- `valid : Interior × Boundary → Bool/Prop`
- `transformB : Boundary → Boundary` (optional)
- `realize : Boundary × Choice → Interior`
- `project : Interior → View`
- `hash : Bytes → Ref`
- `replay : Trace → (Boundary, Interior, Views…)`

---

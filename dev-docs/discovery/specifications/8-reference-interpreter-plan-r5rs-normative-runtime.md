# 8. Reference Interpreter Plan (R5RS) (Normative Runtime)

## 8.1 Responsibilities
The R5RS interpreter MUST:
- read JSONL lines (minimal parser ok)
- maintain `(boundary, choice, interior_state)`
- resolve refs via repository backend
- execute `apply` steps deterministically
- run `assert` checks by calling boundary modules
- emit `project` lines optionally

## 8.2 Determinism Rules
- No RNG unless seeded and logged
- No clock dependence unless `ts` is logged and treated as input
- All outputs MUST be content-addressed

---

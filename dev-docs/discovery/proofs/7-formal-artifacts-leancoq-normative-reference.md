# 7. Formal Artifacts (Lean/Coq) (Normative Reference)

**MUST ship**:
- Lean file proving:
  - each line has 3 points
  - uniqueness of line through distinct point pair
  - PCG witness for 14-ticket construction
- Exporter that generates:
  - canonical `boundary_ref` bytes
  - canonical `ticketset` JSONL lines

Lean/Coq are the **authoritative definition** of the Fano/PCG boundary, not the UI.

---

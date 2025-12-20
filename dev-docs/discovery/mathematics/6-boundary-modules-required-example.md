# 6. Boundary Modules (Required + Example)

## 6.1 Boundary Module Interface
A boundary module is a plugin implementing:

- `parseBoundary(bytes) -> Boundary`
- `validate(boundary, interior, trace_context) -> Result`
- `deriveTickets(boundary) -> TicketSet` (optional)
- `project(boundary, interior, view_type) -> View`

## 6.2 Required Example: Fano7 + PCG14
Provide:
- Explicit incidence table
- Unique line through two points property (verified via Lean/Coq artifact)
- PCG theorem: two disjoint Fano planes on 1..14 guarantee pair-cover with 14 tickets

---

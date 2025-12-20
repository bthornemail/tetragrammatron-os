# 10. Agent Work Plan (What your coding agent should do)

## Phase 0 — Repository & Trace Skeleton (1–2 sessions)
- Implement NRR interface (filesystem version first)
- Implement trace append + scan
- Define canonical hashing and ref format

**Deliverables**
- `repo/objects/*`
- `trace.jsonl` writer/reader
- `ref` utilities

## Phase 1 — CanvasL JSONL Engine (2–4 sessions)
- Implement record parsing and dispatch by `type`
- Implement replay loop
- Implement `project` as no-op placeholder

**Deliverables**
- `canvasl-run.scm` (R5RS)
- conformance tests: replay determinism, ordering, ref integrity

## Phase 2 — Fano7 Boundary Module (2–4 sessions)
- Implement incidence table
- Implement checks:
  - membership
  - unique line through pair (finite check)
  - line cardinality = 3

**Deliverables**
- `boundary/fano7.scm`
- test vectors

## Phase 3 — PCG14 TicketSet Generator (1–2 sessions)
- Represent two disjoint Fano planes on 1..14
- Generate 14 tickets (lines)
- Validate pair-cover property (finite proof or runtime check)

**Deliverables**
- `ticketset.jsonl` generator
- `assert` check implementation

## Phase 4 — Lean/Coq Proof Artifact Integration (2–6 sessions)
- Maintain Lean file as authoritative boundary definition
- Export canonical boundary bytes + tickets
- Verify R5RS runtime agrees with exported boundary

**Deliverables**
- `lean/FanoPCG.lean`
- `export-boundary` tool output used by runtime tests

## Phase 5 — Minimal Static Viewer (1–3 sessions)
- Static HTML viewer reading trace JSONL
- Phase slider + view rendering
- Optional: overlay Fano plane + dodecahedron mapping

**Deliverables**
- `viewer/index.html` (no build step)
- optional React component as non-normative

---

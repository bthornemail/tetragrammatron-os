# Appendix E — Relation to Existing Work (Non-Normative)

This section exists **only to pre-empt reviewer objections**.

### CRDTs
- CRDTs resolve conflicts automatically
- CanvasL-POLY rejects invalid merges explicitly
- Determinism is enforced, not emergent

### Event Sourcing
- Event sourcing stores events
- CanvasL-POLY stores **generating functions**

### Blockchain
- Blockchain relies on probabilistic consensus
- CanvasL-POLY relies on deterministic constraint satisfaction

### Functional Reactive Programming
- FRP uses general functions
- CanvasL-POLY restricts to polynomial families for auditability and bounded cost

---

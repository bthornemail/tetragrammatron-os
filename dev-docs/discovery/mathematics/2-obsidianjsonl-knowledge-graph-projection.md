# 2. `obsidian.jsonl` — Knowledge Graph Projection

Each line is a **node** Obsidian can index.  
You can paste this into a note, split it, or auto-generate files later.

```jsonl
{"id":"ULP","type":"umbrella","label":"Universal Life Protocol","role":"vision"}
{"id":"CanvasL-Core","type":"core","parent":"ULP","label":"CanvasL Core"}

{"id":"RFC-000","type":"rfc","parent":"CanvasL-Core","label":"CanvasL Charter"}
{"id":"RFC-001","type":"rfc","parent":"CanvasL-Core","label":"Polynomial Semantics"}
{"id":"RFC-009","type":"rfc","parent":"CanvasL-Core","label":"Origami Fold VM"}

{"id":"Fano","type":"semantics","label":"Fano Plane","invariant":"idempotence"}
{"id":"Origami","type":"semantics","label":"Origami Folding","axioms":"Huzita-Hatori"}

{"id":"CAN-ISA","type":"isa","label":"CAN-ISA v1"}
{"id":"Origami-VM","type":"vm","implements":"CAN-ISA"}

{"id":"Lean-Proofs","type":"proof","tool":"Lean"}
{"id":"Coq-Proofs","type":"proof","tool":"Coq"}

{"id":"Poly-Logos","type":"app","depends_on":"CanvasL-Core"}
```

In Obsidian Graph View:
- RFCs cluster naturally
- Proofs orbit semantics
- Apps stay peripheral (as they should)

---

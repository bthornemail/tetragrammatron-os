# 6) “Codebase lattice” edges = build graph

You wanted the edge direction “related to branch structure” **and** folders mapped to CAN-ISA. Here is the **directed build lattice**:

## 6.1 Edges (normative)

- `layers/*/*.canvasl  →  programs/*.can.jsonl`  
  (register snapshots become fold programs)
- `programs/*.can.jsonl → artifacts/*.canbc`  
  (assembler)
- `artifacts/*.canbc → src/vm/*`  
  (execution)
- `src/vm/* → src/render/* → obsidian/*.canvas`  
  (visualization emission)

So the repo is literally: **inputs → opcodes → execution → render**.

---

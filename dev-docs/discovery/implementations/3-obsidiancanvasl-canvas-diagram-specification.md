# 3. `obsidian.canvasl` — Canvas / Diagram Specification

This is a **CanvasL canvas**, not Obsidian-specific.
You can later write a renderer → Obsidian Canvas JSON.

```yaml
kind: CanvasL::Canvas
version: 0.1

nodes:
  - id: ULP
    label: Universal Life Protocol
    role: umbrella
    position: [0, 0]

  - id: CanvasL
    label: CanvasL Core
    role: core
    position: [0, -2]

  - id: RFCs
    label: RFCs
    role: spec
    position: [-3, -4]

  - id: Semantics
    label: Semantics
    role: algebra-geometry
    position: [0, -4]

  - id: ISA
    label: CAN-ISA
    role: execution
    position: [3, -4]

  - id: VM
    label: Origami VM
    role: implementation
    position: [3, -6]

  - id: Proof
    label: Lean / Coq
    role: verification
    position: [-3, -6]

  - id: Apps
    label: Poly-Logos
    role: application
    position: [0, -8]

edges:
  - from: ULP
    to: CanvasL
    type: conceptual

  - from: CanvasL
    to: RFCs
    type: defines

  - from: CanvasL
    to: Semantics
    type: grounds

  - from: Semantics
    to: ISA
    type: constrains

  - from: ISA
    to: VM
    type: implements

  - from: Semantics
    to: Proof
    type: proves

  - from: CanvasL
    to: Apps
    type: enables
```

This **is your system** in one page.

---

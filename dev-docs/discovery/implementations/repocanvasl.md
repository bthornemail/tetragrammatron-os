# repo.canvasl
kind: CanvasL::Repository
version: 0.1.0
name: CanvasL-Core
umbrella: Universal-Life-Protocol

axes:
  - dimension: D0
    name: Charter
    purpose: Meaning, scope, invariants

  - dimension: D1
    name: Specifications
    purpose: Normative truth (RFCs)

  - dimension: D2
    name: Semantics
    purpose: Algebra, geometry, origami

  - dimension: D3
    name: ISA
    purpose: Bytecode + execution model

  - dimension: D4
    name: VM
    purpose: Reference implementations

  - dimension: D5
    name: Proof
    purpose: Lean / Coq formalization

  - dimension: D6
    name: Tooling
    purpose: Assemblers, codecs, CLIs

  - dimension: D7
    name: Applications
    purpose: Poly-Logos, demos, UI

folders:
  charter:
    contains:
      - README.md
      - vision.md
      - glossary.md

  rfc:
    contains:
      - RFC-000-CanvasL-Charter.md
      - RFC-001-Polynomial-Semantics.md
      - RFC-009-Origami-Fold-VM.md

  semantics:
    contains:
      - fano.md
      - origami.md
      - harmonics.md

  isa:
    contains:
      - can-isa-v1.md
      - opcode-table.md
      - binary-encoding.md

  vm:
    contains:
      - origami-vm/
      - reference-scheme/
      - embedded/

  proof:
    contains:
      - lean/
      - coq/

  tooling:
    contains:
      - assembler/
      - codecs/
      - jsonl/

  apps:
    contains:
      - poly-logos/
      - demos/
```

**Key point:**  
This file never changes often.  
It’s your **mental exoskeleton**.

---

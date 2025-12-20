# 4. Directory Layout (This Solves the “Incremental Build” Problem)

Your biggest risk is *conceptual drift*.  
This layout locks meaning in place.

```text
canvasl-core/
├── RFC/                    # Normative specs (frozen)
│   ├── RFC-001.md
│   ├── RFC-009.md
│   └── index.md
│
├── isa/                    # Executable semantics
│   ├── can-isa.md
│   ├── encoding.md
│   └── opcode-table.md
│
├── vm/
│   ├── scheme/             # Reference VM + assembler
│   │   ├── fold-vm.scm
│   │   └── assembler.scm
│   ├── c/                  # Embedded VM
│   │   ├── esp32/
│   │   └── pico/
│
├── poly/                   # Polynomial engine
│   ├── f2poly.c
│   ├── f2poly.scm
│   └── tests/
│
├── proofs/
│   ├── lean/
│   │   ├── Fano.lean
│   │   ├── Origami.lean
│   │   └── Phase.lean
│   └── coq/
│
├── render/
│   ├── fano/
│   ├── merkaba/
│   └── contracts.md
│
├── tools/
│   ├── cli/
│   └── converters/
│
├── demos/
│   ├── esp32/
│   ├── web/
│   └── test-vectors/
│
├── packages/               # npm / lisp published artifacts
│
└── README.md               # One canonical explanation
```

This structure:
- Separates **law** (RFCs) from **mechanism** (VM)
- Preserves your exploratory history
- Makes future contributors possible
- Lets you publish without rewriting history

---

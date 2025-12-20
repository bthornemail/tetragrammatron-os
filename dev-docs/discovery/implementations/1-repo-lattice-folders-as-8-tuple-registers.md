# 1) Repo lattice: folders as 8-tuple registers

## 1.1 Canonical root

```
/ (repo root)
  repo.canvasl                # kernel: tuple + branch rules + build graph
  README.md
  /rfc/
    RFC-0009-origami-fold-vm.md
    RFC-0011-repo-kernel.md
  /can-isa/                   # ISA spec + encoding tables + assembler targets
    can-isa.md
    encoding.md
    opcodes.md
  /schema/
    canvasl.schema.json       # JSON Schema validators
  /src/
    /vm/
      can_vm_ref.scm          # reference VM (Scheme)
      can_vm_portable.c       # portable C VM core
    /asm/
      can_asm.scm             # Scheme assembler
      can_disasm.scm
    /poly/
      f2poly.c
      f2poly.h
      clbc_poly_codec.c
      clbc_poly_codec.h
    /fold/
      fold_semantics.scm      # MEET/JOIN/FANO.S/PROJ_FANO
      fold_semantics.c
    /render/
      renderer_contract.md
      geom_bridge.c           # “renderer bridge” adapter
  /platform/
    /esp32/
      main.c
      CMakeLists.txt
    /pico/
      main.c
      CMakeLists.txt
  /layers/                    # the 8^3 lattice: registers
    /L0/
      state.canvasl
      alphabet.canvasl
      left.canvasl
      right.canvasl
      delta.canvasl
      start.canvasl
      accept.canvasl
      reject.canvasl
    /L1/
      ... same 8 files ...
    /L2/
      ... same 8 files ...
  /programs/                  # “fold programs” compiled to CAN bytecode
    bootstrap.can.jsonl
    fano_barrier.can.jsonl
  /artifacts/                 # build outputs
    *.canbc                   # CAN bytecode container (recommended new extension)
    *.clbc                    # keep old CLBC record-hash VM artifacts separate
  /obsidian/
    vault/
      .obsidian/
      canvas/
        repo_lattice.canvas   # Obsidian canvas JSON (directed edges)
```

This is the “codebase lattice”:  
- `layers/Ln/<axis>.canvasl` are **register nodes**  
- `src/*` are **operators** (VM/ASM/POLY/FOLD/RENDER)  
- `programs/*` are **executable proofs** (CAN-ISA bytecode)  
- `platform/*` are **real hardware instantiations**

---

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

# 2) Folder → CAN-ISA mapping (the build is the graph)

CAN-ISA “lives” as the **instruction boundary** between folders:

## 2.1 Lattice nodes = `layers/…/*.canvasl`
Each file is a **register snapshot** that compiles to a **canonical polynomial state** (CLBC-POLY inside CAN containers).

| Folder/File | CAN-ISA Role | Output |
|---|---|---|
| `layers/Ln/state.canvasl` | REG `state` | `POLY` payload |
| `layers/Ln/alphabet.canvasl` | REG `alphabet` | `POLY` payload |
| `layers/Ln/left.canvasl` | REG `left` | `POLY` payload |
| `layers/Ln/right.canvasl` | REG `right` | `POLY` payload |
| `layers/Ln/delta.canvasl` | REG `delta` (context key) | `POLY` payload |
| `layers/Ln/start.canvasl` | REG `start` | `POLY` payload |
| `layers/Ln/accept.canvasl` | REG `accept` | `POLY` payload |
| `layers/Ln/reject.canvasl` | REG `reject` | `POLY` payload |

## 2.2 Operators = `src/fold`, `src/poly`, `src/vm`
These correspond directly to CAN-ISA instruction families:

| Folder | CAN-ISA Instruction Class |
|---|---|
| `src/poly/` | `POLY.LOAD`, `POLY.CANON`, codec ops (CLBC-POLY compatible) |
| `src/fold/` | `MEET`(GCD), `JOIN`(LCM), `FANO.S`, `PROJ_FANO` |
| `src/vm/` | `EXEC`, `BARRIER`, `COMMIT`, deterministic stepping |
| `src/render/` | `RENDER.EMIT` (event stream contract) |

## 2.3 Programs = `programs/*.can.jsonl`
These compile via assembler to `artifacts/*.canbc`:

Pipeline:
```
(programs/*.can.jsonl)
   → src/asm/can_asm.scm
   → artifacts/*.canbc
   → src/vm/can_vm_ref.scm (host)
   → platform/* firmware VM (ESP32/Pico)
   → src/render/geom_bridge → obsidian canvas events
```

---

# 3) CAN-ISA register model (8-tuple basis)

Make the ISA **explicitly aware** of the 8-tuple by reserving 3 bits for “axis register id”:

```text
REG_ID (3 bits):
000 state
001 alphabet
010 left
011 right
100 delta
101 start
110 accept
111 reject
```

This is the *mechanical* bridge from your repo topology to bytecode.

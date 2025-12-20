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

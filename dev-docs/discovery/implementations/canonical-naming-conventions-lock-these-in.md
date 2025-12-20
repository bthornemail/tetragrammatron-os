# Canonical Naming Conventions (Lock These In)

### Repo root
```
tetragrammatron-os/
```

### Core components
```
canvasl-core/        ; algebra + normalization
can-isa/             ; instruction set & encoding
origami-vm/          ; fold execution engine
poly-logos/          ; application layer
geometry-renderer/   ; svg / glb / obj
proof/               ; Lean + Coq
firmware/            ; esp32 / pico
assembler/           ; Scheme
```

### Binary artifacts
```
*.can      ; canonical instruction stream
*.canbc   ; compiled bytecode
*.canvasl ; semantic layer
*.poly    ; polynomial records
```

---

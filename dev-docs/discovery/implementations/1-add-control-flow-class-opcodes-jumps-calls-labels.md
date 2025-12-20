# 1) Add Control-Flow Class + Opcodes (Jumps, Calls, Labels)

We’ll reserve a **CLASS-CTRL = 0x1**.

Same 16-bit layout:

```
CLASS(4) OP(4) SRC(4) DST(4)
```

For control flow, we interpret `SRC/DST` as tiny operands, and use an **EXT word** for full offsets.

```scheme
;; ===============================
;; Control-flow opcode tables
;; ===============================

(define CLASS-CTRL #x1)

(define CTRL-OPS
  '((NOP   . #x0)
    (HALT  . #x1)

    ;; PC-relative jumps using EXT word (signed imm16)
    (JMP   . #x2)  ;; pc += imm16
    (JZ    . #x3)  ;; if R[src]==0 pc += imm16
    (JNZ   . #x4)  ;; if R[src]!=0 pc += imm16

    ;; Call/ret with EXT word (signed imm16)
    (CALL  . #x5)  ;; push(pc+2); pc += imm16
    (RET   . #x6)

    ;; Compare flags (optional minimal)
    (CMPZ  . #x7))) ;; set Z flag from R[src]
```

Helpers:

```scheme
(define (ctrl-op x) (lookup CTRL-OPS x))

(define (CTRL op src dst)
  (encode-instr
   CLASS-CTRL
   (ctrl-op op)
   (reg src)
   (reg dst)))
```

---

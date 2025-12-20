# 5) Minimal Literal Load (LIT16) (You’ll Need This Immediately)

Without a literal instruction you’ll rely on host register initialization. Let’s fix that.

**CLASS-ALU = 0x0** (simple moves + LIT16)

```scheme
(define CLASS-ALU #x0)

(define ALU-OPS
  '((MOV   . #x0) ;; dst = src
    (XOR   . #x1) ;; dst ^= src
    (AND   . #x2)
    (OR    . #x3)
    (LIT16 . #x4))) ;; dst = imm16 (uses EXT word)

(define (alu-op x) (lookup ALU-OPS x))

(define (ALU op src dst)
  (encode-instr CLASS-ALU (alu-op op) (reg src) (reg dst)))
```

Usage:

```scheme
;; R1 = 0x4000 (example instruction word)
`(ins2 ,(ALU 'LIT16 'R0 'R1) #x4000)
```

---

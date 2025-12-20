# Part I — CLBC Assembler in R5RS Scheme

This assembler is:
- deterministic
- architecture-agnostic
- directly aligned with your Lean semantics
- small enough to audit line-by-line

## 1. Instruction Model

We fix the 16-bit instruction word exactly as specified:

```
[ OPCODE:4 | FLAGS:4 | OPERAND:8 ]
```

### Opcode table (frozen)

```scheme
(define *opcode-table*
  '((NOP     . #x0)
    (TERM    . #x1)
    (F2_ADD  . #x2)
    (F2_MUL  . #x3)
    (F2_GCD  . #x4)
    (F2_LCM  . #x5)
    (ASSERT  . #x6)
    (EMIT    . #x7)
    (HALT    . #xF)))
```

---

## 2. Assembler Core (R5RS)

### 2.1 Utilities

```scheme
(define (lookup-opcode sym)
  (let ((p (assoc sym *opcode-table*)))
    (if p (cdr p)
        (error "Unknown opcode" sym))))

(define (u8 x)
  (modulo x 256))

(define (u4 x)
  (modulo x 16))
```

---

### 2.2 Instruction Encoding

```scheme
;; encode one instruction into a 16-bit integer
;; instr ::= (MNEMONIC operand flags)
;; flags optional, operand optional
(define (encode-instr instr)
  (let* ((mnemonic (car instr))
         (rest (cdr instr))
         (operand (if (pair? rest) (car rest) 0))
         (flags   (if (and (pair? rest) (pair? (cdr rest)))
                      (cadr rest)
                      0))
         (opcode (lookup-opcode mnemonic)))
    (bitwise-ior
     (arithmetic-shift (u4 opcode) 12)
     (arithmetic-shift (u4 flags) 8)
     (u8 operand))))
```

---

### 2.3 Program Assembly

```scheme
;; program ::= list of instructions
(define (assemble program)
  (map encode-instr program))
```

---

### 2.4 Example

```scheme
(define demo-program
  '((TERM 3)
    (TERM 5)
    (F2_GCD 7)
    (EMIT)
    (HALT)))

(assemble demo-program)
;; => (4099 4101 16391 28672 61440)
;; hex: 0x1003 0x1005 0x4007 0x7000 0xF000
```

This output is **exactly** what your ESP32 loop will consume.

---

### 2.5 Determinism Guarantee (Why this matters)

- Same s-expression → same integers
- Same integers → same byte stream
- Same byte stream → same CLBC decode
- Same decode → same `State`
- Same `State` → same `normalize` result (Lean proof)

This assembler is already a **proof artifact**.

---

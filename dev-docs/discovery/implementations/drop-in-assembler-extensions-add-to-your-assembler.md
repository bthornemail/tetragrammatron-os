# Drop-in assembler extensions (add to your assembler)

Add these opcodes and forms to **the previous `can_asm.scm`**:

### New opcodes (match the disassembler)
```scheme
(define OP_IMM16      #x30)
(define OP_PATCH_BEG  #x40)
(define OP_PATCH_W16  #x41)
(define OP_PATCH_SEAL #x42)
(define OP_PATCH_APPLY #x43)
```

### Add helpers for IMM16 extension word
```scheme
(define (emit-ext16 imm16)
  (let* ((v (if (and (integer? imm16) (<= 0 imm16) (<= imm16 65535))
                imm16
                (error "imm16 out of range" imm16)))
         (hi (quotient v 256))
         (lo (remainder v 256)))
    (make-word #x00 hi lo 0)))
```

### Add macro cases to `expand-form`

```scheme
;; IMM16 dst imm16  => 2 words
((and (pair? form) (eq? (car form) 'IMM16))
 (let ((dst (parse-reg (cadr form)))
       (imm (caddr form)))
   (list
     (chunk-word (make-word OP_IMM16 dst 0 0))
     (chunk-word (emit-ext16 imm)))))

;; PATCH_BEGIN id8
((and (pair? form) (eq? (car form) 'PATCH_BEGIN))
 (let ((id (u8 (cadr form))))
   (list (chunk-word (make-word OP_PATCH_BEG id 0 0)))))

;; PATCH_WRITE16 id8 offset8 imm16  => 2 words
((and (pair? form) (eq? (car form) 'PATCH_WRITE16))
 (let ((id (u8 (cadr form)))
       (off (u8 (caddr form)))
       (imm (cadddr form)))
   (list
     (chunk-word (make-word OP_PATCH_W16 id off 0))
     (chunk-word (emit-ext16 imm)))))

;; PATCH_SEAL id8 hashReg
((and (pair? form) (eq? (car form) 'PATCH_SEAL))
 (let ((id (u8 (cadr form)))
       (hashR (parse-reg (caddr form))))
   (list (chunk-word (make-word OP_PATCH_SEAL id hashR 0)))))

;; PATCH_APPLY id8
((and (pair? form) (eq? (car form) 'PATCH_APPLY))
 (let ((id (u8 (cadr form))))
   (list (chunk-word (make-word OP_PATCH_APPLY id 0 0)))))
```

That’s it. Your assembler now emits IMM16 + PATCH using the same canonical extension rule as barrier/jumps.

---

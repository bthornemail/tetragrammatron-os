;; can_disasm.scm — Disassembler for RFC-009 / CAN-ISA style 4-byte words

;; Keep opcode constants identical to assembler
(define OP_CANON     #x01)
(define OP_MEET      #x02)
(define OP_JOIN      #x03)
(define OP_PROJ_FANO #x04)
(define OP_A6_FOLD   #x05)
(define OP_BARRIER   #x06)
(define OP_HALT      #xFF)

(define OP_JMP       #x20)
(define OP_JZ        #x21)
(define OP_JNZ       #x22)

;; Extensions added in part 3
(define OP_IMM16     #x30)  ; IMM16 dst, imm16 (extension word)
(define OP_PATCH_BEG #x40)  ; begin patch region (id)
(define OP_PATCH_W16 #x41)  ; write word16 (offset, imm16)
(define OP_PATCH_SEAL #x42) ; seal patch (hash reg)
(define OP_PATCH_APPLY #x43); apply patch (id)

;; -------- helpers ----------
(define (u8->reg b) (string->symbol (string-append "r" (number->string b))))

(define (bytes->words bytes)
  (let loop ((bs bytes) (acc '()))
    (cond
      ((null? bs) (reverse acc))
      ((< (length bs) 4) (error "bytes length not multiple of 4"))
      (else
       (let ((w (list (car bs) (cadr bs) (caddr bs) (cadddr bs))))
         (loop (cddddr bs) (cons w acc)))))))

(define (ext16 word1)
  ;; word1 is [0 hi lo 0], return imm16
  (let ((op (car word1)) (hi (cadr word1)) (lo (caddr word1)) (z (cadddr word1)))
    (if (and (= op 0) (= z 0))
        (+ (* hi 256) lo)
        (error "bad extension word (expected [0 hi lo 0])" word1))))

(define (barrier-extc word1)
  ;; word1 must be [0 c 0 0]
  (let ((op (car word1)) (c (cadr word1)) (a (caddr word1)) (b (cadddr word1)))
    (if (and (= op 0) (= a 0) (= b 0))
        c
        (error "bad barrier extension word (expected [0 c 0 0])" word1))))

;; -------- disassemble ----------
(define (disasm-words words)
  (let loop ((ws words) (pc 0) (out '()))
    (if (null? ws)
        (reverse out)
        (let* ((w0 (car ws))
               (op (car w0))
               (dst (cadr w0))
               (a (caddr w0))
               (b (cadddr w0)))
          (cond
            ;; HALT
            ((= op OP_HALT)
             (loop (cdr ws) (+ pc 1) (cons '(HALT) out)))

            ;; CANON
            ((= op OP_CANON)
             (loop (cdr ws) (+ pc 1)
                   (cons (list 'CANON (u8->reg dst) (u8->reg a)) out)))

            ;; MEET
            ((= op OP_MEET)
             (loop (cdr ws) (+ pc 1)
                   (cons (list 'MEET (u8->reg dst) (u8->reg a) (u8->reg b)) out)))

            ;; JOIN
            ((= op OP_JOIN)
             (loop (cdr ws) (+ pc 1)
                   (cons (list 'JOIN (u8->reg dst) (u8->reg a) (u8->reg b)) out)))

            ;; PROJ_FANO
            ((= op OP_PROJ_FANO)
             (loop (cdr ws) (+ pc 1)
                   (cons (list 'PROJ_FANO (u8->reg dst) (u8->reg a)) out)))

            ;; A6_FOLD
            ((= op OP_A6_FOLD)
             (loop (cdr ws) (+ pc 1)
                   (cons (list 'A6_FOLD (u8->reg dst) (u8->reg a) (u8->reg b)) out)))

            ;; BARRIER_FANO (2-word)
            ((= op OP_BARRIER)
             (if (null? (cdr ws)) (error "truncated barrier at pc" pc))
             (let* ((w1 (cadr ws))
                    (c (barrier-extc w1)))
               (loop (cddr ws) (+ pc 2)
                     (cons (list 'BARRIER_FANO (u8->reg a) (u8->reg b) (u8->reg c)) out))))

            ;; JMP/JZ/JNZ (2-word with abs pc imm16)
            ((or (= op OP_JMP) (= op OP_JZ) (= op OP_JNZ))
             (if (null? (cdr ws)) (error "truncated jump at pc" pc))
             (let* ((w1 (cadr ws))
                    (addr (ext16 w1))
                    (label (string->symbol (string-append "pc_" (number->string addr)))))
               (cond
                 ((= op OP_JMP)
                  (loop (cddr ws) (+ pc 2) (cons (list 'JMP label) out)))
                 ((= op OP_JZ)
                  (loop (cddr ws) (+ pc 2) (cons (list 'JZ (u8->reg dst) label) out)))
                 (else
                  (loop (cddr ws) (+ pc 2) (cons (list 'JNZ (u8->reg dst) label) out))))))

            ;; IMM16 (2-word)
            ((= op OP_IMM16)
             (if (null? (cdr ws)) (error "truncated IMM16 at pc" pc))
             (let* ((imm (ext16 (cadr ws))))
               (loop (cddr ws) (+ pc 2)
                     (cons (list 'IMM16 (u8->reg dst) imm) out))))

            ;; PATCH_* (some 1-word, some 2-word)
            ((= op OP_PATCH_BEG)
             ;; [PATCH_BEG id 0 0]
             (loop (cdr ws) (+ pc 1)
                   (cons (list 'PATCH_BEGIN dst) out)))

            ((= op OP_PATCH_SEAL)
             ;; [PATCH_SEAL id hashReg 0]
             (loop (cdr ws) (+ pc 1)
                   (cons (list 'PATCH_SEAL dst (u8->reg a)) out)))

            ((= op OP_PATCH_APPLY)
             ;; [PATCH_APPLY id 0 0]
             (loop (cdr ws) (+ pc 1)
                   (cons (list 'PATCH_APPLY dst) out)))

            ((= op OP_PATCH_W16)
             ;; 2-word: [PATCH_W16 id offset8 0] + [0 hi lo 0]
             (if (null? (cdr ws)) (error "truncated PATCH_W16 at pc" pc))
             (let* ((imm (ext16 (cadr ws))))
               (loop (cddr ws) (+ pc 2)
                     (cons (list 'PATCH_WRITE16 dst a imm) out))))

            (else
             (loop (cdr ws) (+ pc 1)
                   (cons (list 'UNKNOWN op dst a b) out))))))))

(define (disasm-bytes bytes)
  (disasm-words (bytes->words bytes)))

;; Optional: build a label table from pc_* symbols (nice for round-trip)
(define (insert-pc-labels forms)
  ;; Inserts (label pc_N) before the instruction at pc=N when referenced.
  ;; Keeping simple: caller can do this later; disasm emits pc_* symbols.
  forms)
```

**What you get:** `(disasm-bytes (assemble->bytes program))` returns canonical S-exprs. For jumps it emits symbols like `pc_12`. You can optionally post-process to insert real `(label pc_12)` before the instruction at that PC.

---

# 3) IMM16 + PATCH (self-modifying but safe)

## 3A) IMM16 encoding (canonical, no ambiguity)

### Surface form

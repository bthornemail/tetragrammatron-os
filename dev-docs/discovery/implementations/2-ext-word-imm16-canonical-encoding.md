# 2) EXT Word + IMM16 (Canonical Encoding)

We’ll make a **2-word instruction** pattern:

- Word0: normal 16-bit instruction
- Word1: **EXT** 16-bit signed immediate (or unsigned), big-endian in file

This keeps the encoding trivial and deterministic.

```scheme
(define (u16 x) (bitwise-and x #xFFFF))

(define (s16 x)
  ;; accept negative and wrap into 16-bit two's complement
  (u16 x))

(define (EXT imm16)
  (u16 imm16))

(define (emit-u16 word)
  (list (arithmetic-shift word -8)
        (bitwise-and word #xFF)))

(define (emit-program-u16 words)
  (apply append (map emit-u16 words)))
```

### Label assembler pass

We’ll represent an assembly program as a list of forms:

- `(label NAME)`
- `(ins WORD)` for single-word
- `(ins2 WORD IMM16)` for word + EXT

Then do a **2-pass assembler**:
- pass1: compute label → PC
- pass2: emit words with resolved label offsets

```scheme
(define (asm-pass1 forms)
  (let loop ((fs forms) (pc 0) (labels '()))
    (if (null? fs)
        (reverse labels)
        (let ((f (car fs)))
          (cond
            ((and (pair? f) (eq? (car f) 'label))
             (loop (cdr fs) pc (cons (cons (cadr f) pc) labels)))
            ((and (pair? f) (eq? (car f) 'ins))
             (loop (cdr fs) (+ pc 1) labels))
            ((and (pair? f) (eq? (car f) 'ins2))
             (loop (cdr fs) (+ pc 2) labels))
            (else (error "Unknown asm form" f)))))))

(define (label-addr labels name)
  (let ((p (assoc name labels)))
    (if p (cdr p) (error "Unknown label" name))))

(define (asm-pass2 forms labels)
  (let loop ((fs forms) (pc 0) (out '()))
    (if (null? fs)
        (reverse out)
        (let ((f (car fs)))
          (cond
            ((and (pair? f) (eq? (car f) 'label))
             (loop (cdr fs) pc out))
            ((and (pair? f) (eq? (car f) 'ins))
             (loop (cdr fs) (+ pc 1) (cons (cadr f) out)))
            ((and (pair? f) (eq? (car f) 'ins2))
             ;; (ins2 word (rel LABEL)) or (ins2 word imm16)
             (let* ((word (cadr f))
                    (imm  (caddr f))
                    (imm16
                     (cond
                       ((and (pair? imm) (eq? (car imm) 'rel))
                        (let* ((target (label-addr labels (cadr imm)))
                               ;; PC after consuming the *two* words:
                               ;; branch offset is relative to next instruction
                               (nextpc (+ pc 2))
                               (delta (- target nextpc)))
                          (s16 delta)))
                       (else (s16 imm)))))
               (loop (cdr fs)
                     (+ pc 2)
                     (cons (EXT imm16) (cons word out)))))
            (else (error "Unknown asm form" f)))))))

(define (assemble forms)
  (let* ((labels (asm-pass1 forms))
         (words  (asm-pass2 forms labels)))
    (emit-program-u16 words)))
```

---

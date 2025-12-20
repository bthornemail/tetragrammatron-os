# 6) Reference Assembler Skeleton (Scheme)

This is a drop-in style skeleton (R5RS-ish). It’s not tied to any one runtime; you can adapt to your repo’s Scheme.

```scheme
;; ============================================================
;; AAS: RFC-009 §10 Assembler + Verifier (Skeleton)
;; ============================================================

;; -------- util --------

(define (u16 x) (modulo x 65536))
(define (hi8 x) (quotient (u16 x) 256))
(define (lo8 x) (modulo (u16 x) 256))

(define (reg->u4 r)
  (cond
    ((eq? r 'r0) 0) ((eq? r 'r1) 1) ((eq? r 'r2) 2) ((eq? r 'r3) 3)
    ((eq? r 'r4) 4) ((eq? r 'r5) 5) ((eq? r 'r6) 6) ((eq? r 'r7) 7)
    ((eq? r 'r8) 8) ((eq? r 'r9) 9) ((eq? r 'r10) 10) ((eq? r 'r11) 11)
    ((eq? r 'r12) 12) ((eq? r 'r13) 13) ((eq? r 'r14) 14) ((eq? r 'r15) 15)
    (else (error "unknown reg" r))))

(define (make-word major rd minor flags)
  (u16 (+ (arithmetic-shift major 12)
          (arithmetic-shift rd    8)
          (arithmetic-shift minor 4)
          flags)))

(define (make-ext ra subop flags imm16)
  (list (make-word #xF ra subop flags)
        (u16 imm16)))

;; -------- AST normalization --------

;; We represent each instruction as an alist:
;; '((op . rr.init) (args . ... ) (src . original-form))
(define (parse-form f)
  (cond
    ((and (pair? f) (symbol? (car f)))
     (let ((op (car f)))
       (cond
         ((eq? op 'label) (list (cons 'op 'label) (cons 'name (cadr f)) (cons 'src f)))
         (else (list (cons 'op op) (cons 'args (cdr f)) (cons 'src f))))))
    (else (error "invalid form" f))))

;; -------- basic block boundary detection --------

(define (boundary-op? op)
  (or (eq? op 'label)
      (eq? op 'jmp) (eq? op 'jz) (eq? op 'call) (eq? op 'ret) (eq? op 'halt)))

;; treat barriers as boundaries too (strict adjacency)
(define (barrier-op? op)
  (or (eq? op 'barrier.rr)
      (eq? op 'barrier.t)))

(define (starts-new-block? op)
  (or (boundary-op? op) (barrier-op? op)))

;; -------- verifier --------

(define (kw-get args k default)
  ;; args is a list like (#:n 4 #:owner 0 ...)
  (let loop ((xs args))
    (cond
      ((null? xs) default)
      ((eq? (car xs) k) (cadr xs))
      (else (loop (cddr xs))))))

(define (strict-true? v) (and v (not (eq? v #f))))

(define (verify-patch-gates! insns)
  ;; walk insns and check adjacency rules inside blocks
  (let loop ((prev #f) (prevprev #f) (xs insns))
    (if (null? xs) 'ok
        (let* ((i (car xs))
               (op (cdr (assoc 'op i))))
          (cond
            ;; reset history at boundaries (labels/jumps/etc) and also after barriers (since strict)
            ((starts-new-block? op)
             (loop i #f (cdr xs)))

            ;; PATCH_APPLY gate checks
            ((eq? op 'patch.apply)
             (let* ((okA (and prevprev prev
                              (eq? (cdr (assoc 'op prevprev)) 'barrier.rr)
                              (strict-true? (kw-get (cdr (assoc 'args prevprev)) '#:strict #f))
                              (eq? (cdr (assoc 'op prev)) 'barrier.t)
                              (strict-true? (kw-get (cdr (assoc 'args prev)) '#:strict #f))
                              (strict-true? (kw-get (cdr (assoc 'args prev)) '#:couple-rr #f))))
                    (okB (and prev
                              (eq? (cdr (assoc 'op prev)) 'barrier.rr)
                              (strict-true? (kw-get (cdr (assoc 'args prev)) '#:strict #f)))))
               (if (or okA okB)
                   (loop i prev (cdr xs))
                   (error "RFC-009 gate violation: patch.apply must be preceded by RR_BARRIER (and preferably BARRIER_T)" (cdr (assoc 'src i))))))

            (else
             (loop i prev (cdr xs))))))))

;; -------- label pass --------

(define (collect-labels insns)
  ;; returns alist (name . addr_words)
  (let loop ((xs insns) (pc 0) (tbl '()))
    (if (null? xs) tbl
        (let* ((i (car xs))
               (op (cdr (assoc 'op i))))
          (cond
            ((eq? op 'label)
             (let ((name (cdr (assoc 'name i))))
               (loop (cdr xs) pc (cons (cons name pc) tbl))))
            (else
             ;; conservative size: assume worst-case 2 words for EXT, 1 for R-type;
             ;; you can refine per-op in emit-size
             (loop (cdr xs) (+ pc (emit-size i)) tbl)))))))

(define (emit-size i)
  (let ((op (cdr (assoc 'op i))))
    (cond
      ((or (eq? op 'rr.init) (eq? op 'barrier.rr) (eq? op 'patch.apply)) 2)
      ;; barrier.t is EXT in your TIME RFC (§9), so treat as 2
      ((eq? op 'barrier.t) 2)
      ;; patch.begin/write may be 2+payload; keep simple here:
      ((eq? op 'patch.begin) 2)
      ((eq? op 'patch.write) (+ 2 (bytes->wordcount (kw-get (cdr (assoc 'args i)) '#:bytes '()))))
      (else 1))))

(define (bytes->wordcount bs)
  (let ((n (length bs)))
    (quotient (+ n 1) 2))) ; pack 2 bytes per 16-bit word

(define (label->addr labels ref)
  (let ((p (assoc ref labels)))
    (if p (cdr p) (error "unknown label" ref))))

;; -------- encoder helpers --------

(define (pack-bytes->words bs)
  ;; returns list of u16 words, big-endian byte packing
  (let loop ((xs bs) (out '()))
    (cond
      ((null? xs) (reverse out))
      ((null? (cdr xs))
       (reverse (cons (u16 (arithmetic-shift (car xs) 8)) out)))
      (else
       (reverse
        (loop (cddr xs)
              (cons (u16 (+ (arithmetic-shift (car xs) 8) (cadr xs))) out)))))))

;; -------- emit pass --------

(define (emit-insn i labels)
  (let* ((op   (cdr (assoc 'op i)))
         (args (cdr (assoc 'args i))))
    (cond
      ;; --- RR ---
      ((eq? op 'rr.init)
       (let* ((rd (reg->u4 (kw-get args '#:rd 'r0)))
              (n  (kw-get args '#:n 1))
              (o  (kw-get args '#:owner 0))
              (reset? (strict-true? (kw-get args '#:reset-epoch #t)))
              (lock?  (strict-true? (kw-get args '#:lock-n #f)))
              (flags (+ (if reset? 1 0) (if lock? 2 0)))
              (imm (u16 (+ (arithmetic-shift n 8) o))))
         (make-ext rd #x1 flags imm)))

      ((eq? op 'rr.next)
       (let* ((rd (reg->u4 (kw-get args '#:rd 'r0)))
              (wo (strict-true? (kw-get args '#:write-owner #f)))
              (we (strict-true? (kw-get args '#:write-epochlo #f)))
              (flags (+ (if wo 1 0) (if we 2 0))))
         (list (make-word #xE rd #x1 flags))))

      ((eq? op 'barrier.rr)
       (let* ((rs (reg->u4 (kw-get args '#:caller 'r0)))
              (strict? (strict-true? (kw-get args '#:strict #t)))
              (mask (kw-get args '#:mask 'equal))
              (maskmode (if (eq? mask 'in-mask) 1 0))
              (lanes (kw-get args '#:lanes 0))
              (flags (+ (if strict? 1 0)
                        (if (= maskmode 1) 4 0))))
         (make-ext rs #x2 flags (u16 lanes))))

      ;; --- TIME barrier placeholder (defined in RFC-009 §9) ---
      ((eq? op 'barrier.t)
       ;; NOTE: you’ll replace this with your exact §9 encoding.
       ;; We preserve args to enforce #:strict and #:couple-rr in verifier.
       (let* ((rs (reg->u4 (kw-get args '#:rs 'r0)))
              (strict? (strict-true? (kw-get args '#:strict #t)))
              (couple? (strict-true? (kw-get args '#:couple-rr #t)))
              (flags (+ (if strict? 1 0) (if couple? 2 0)))
              (imm (u16 (kw-get args '#:phase 0))))
         (make-ext rs #x8 flags imm))) ; SUBOP #x8 reserved for TIME barrier in this sketch

      ;; --- PATCH ---
      ((eq? op 'patch.apply)
       (let* ((addr (kw-get args '#:addr #f))
              (imm (cond
                     ((and (pair? addr) (eq? (car addr) 'label-ref))
                      (label->addr labels (cadr addr)))
                     ((integer? addr) addr)
                     (else (error "patch.apply needs #:addr label-ref or integer" (cdr (assoc 'src i)))))))
         (make-ext 0 #x7 0 (u16 imm))))

      ;; TODO: patch.begin/write/seal etc.

      ;; --- control flow + misc ---
      ((eq? op 'halt) (list (make-word #x0 0 #xF 0)))
      ((eq? op 'nop)  (list (make-word #x0 0 #x0 0)))
      ((eq? op 'label) '()) ; emits nothing

      (else
       (error "emit: unsupported op in this skeleton" op)))))

(define (assemble forms)
  (let* ((insns (map parse-form forms)))
    ;; 1) verify
    (verify-patch-gates! insns)
    ;; 2) labels
    (let ((labels (collect-labels insns)))
      ;; 3) emit
      (let loop ((xs insns) (out '()))
        (if (null? xs)
            (reverse out)
            (let* ((words (emit-insn (car xs) labels)))
              (loop (cdr xs) (append (reverse words) out))))))))

;; entry convenience
(define (assemble-program prog)
  ;; prog is (program ...forms...)
  (if (and (pair? prog) (eq? (car prog) 'program))
      (assemble (cdr prog))
      (error "expected (program ...)" prog)))
```

### What this already gives you
- A verifier that **rejects** unsafe `patch.apply`
- A label pass
- An emitter pattern that follows your Imm16 + EXT philosophy
- Easy expansion: add `MUX_*`, `PATCH_BEGIN/WRITE/SEAL` state machine checks

---

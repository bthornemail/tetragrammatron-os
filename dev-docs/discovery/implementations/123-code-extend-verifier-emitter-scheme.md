# 12.3 Code: extend verifier + emitter (Scheme)

Paste the following into your assembler file, replacing/augmenting the previous stubs.

```scheme
;; ============================================================
;; 12.x: PATCH + MUX verifier + emitter additions
;; ============================================================

;; -------- helpers: byte literals --------
(define (byte? x) (and (integer? x) (<= 0 x) (<= x 255)))

(define (collect-bytes args)
  ;; expects #:bytes b0 b1 ...
  (let loop ((xs args))
    (cond
      ((null? xs) '())
      ((eq? (car xs) '#:bytes)
       (let ((bs (cdr xs)))
         (for-each (lambda (b) (if (not (byte? b)) (error "non-byte" b))) bs)
         bs))
      (else (loop (cddr xs))))))

(define (bytes-len args) (length (collect-bytes args)))

;; -------- basic block history utils --------
(define (op-of insn) (cdr (assoc 'op insn)))
(define (args-of insn) (cdr (assoc 'args insn)))

;; -------- verifier: patch+ mux state machines --------

(define (verify-patch+gates! insns)
  ;; combine:
  ;;  - PATCH state machine (begin/write/seal/apply/abort)
  ;;  - MUX open/close discipline (per ch)
  ;;  - PATCH_APPLY gating adjacency (existing rule)
  (let loop ((prev #f) (prevprev #f)
             (patch 'idle)         ; 'idle | (open id len written sealed owner)
             (mux-open '())        ; alist (ch . #t)
             (xs insns))
    (if (null? xs) 'ok
        (let* ((i (car xs)) (op (op-of i)) (args (args-of i)))

          ;; block boundary resets adjacency history (not patch/mux state)
          (define (reset-adj) (loop i #f patch mux-open (cdr xs)))
          (define (step)      (loop i prev patch mux-open (cdr xs)))

          ;; utility: gate check for patch.apply
          (define (gate-ok?)
            (let* ((okA (and prevprev prev
                             (eq? (op-of prevprev) 'barrier.rr)
                             (strict-true? (kw-get (args-of prevprev) '#:strict #f))
                             (eq? (op-of prev) 'barrier.t)
                             (strict-true? (kw-get (args-of prev) '#:strict #f))
                             (strict-true? (kw-get (args-of prev) '#:couple-rr #f))))
                   (okB (and prev
                             (eq? (op-of prev) 'barrier.rr)
                             (strict-true? (kw-get (args-of prev) '#:strict #f)))))
              (or okA okB)))

          (cond
            ;; adjacency boundary ops
            ((starts-new-block? op) (reset-adj))

            ;; ---------------- MUX discipline ----------------
            ((eq? op 'mux.open)
             (let ((ch (kw-get args '#:ch #f)))
               (if (not (and (integer? ch) (<= 0 ch) (<= ch 15)))
                   (error "mux.open requires #:ch 0..15" (cdr (assoc 'src i))))
               (if (assoc ch mux-open)
                   (error "mux.open: channel already open" ch))
               (loop i prev patch (cons (cons ch #t) mux-open) (cdr xs))))

            ((eq? op 'mux.close)
             (let ((ch (kw-get args '#:ch #f)))
               (if (not (assoc ch mux-open))
                   (error "mux.close: channel not open" ch))
               ;; remove ch
               (let ((mux2 (filter (lambda (p) (not (= (car p) ch))) mux-open)))
                 (loop i prev patch mux2 (cdr xs)))))

            ((eq? op 'mux.evt)
             (let ((ch (kw-get args '#:ch #f)))
               (if (not (assoc ch mux-open))
                   (error "mux.evt: channel not open" ch))
               ;; len <= 255
               (let ((len (bytes-len args)))
                 (if (> len 255) (error "mux.evt len > 255 not allowed in v1" len)))
               (step)))

            ;; ---------------- PATCH discipline ----------------
            ((eq? op 'patch.begin)
             (if (not (eq? patch 'idle))
                 (error "patch.begin while patch active" (cdr (assoc 'src i))))
             (let* ((len (kw-get args '#:len #f))
                    (owner (kw-get args '#:owner #f))
                    (id (kw-get args '#:id #f)))
               (if (not (and (integer? len) (<= 0 len) (<= len 4095)))
                   (error "patch.begin requires #:len 0..4095" len))
               (if (not (and (integer? owner) (<= 0 owner) (<= owner 15)))
                   (error "patch.begin requires #:owner 0..15" owner))
               (if (not (and (integer? id) (<= 0 id) (<= id 65535)))
                   (error "patch.begin requires #:id u16" id))
               (loop i prev (list 'open id len 0 #f owner) mux-open (cdr xs))))

            ((eq? op 'patch.write)
             (if (or (eq? patch 'idle) (not (eq? (car patch) 'open)))
                 (error "patch.write with no active patch" (cdr (assoc 'src i))))
             (let* ((len (caddr patch))
                    (written (cadddr patch))
                    (sealed? (car (cddddr patch)))  ; 5th element (#f/#t)
                    (off (kw-get args '#:off #f))
                    (bs (collect-bytes args)))
               (if sealed? (error "patch.write after seal" (cdr (assoc 'src i))))
               (if (not (and (integer? off) (<= 0 off))) (error "patch.write requires #:off >=0" off))
               ;; bound check: off + bytes <= len
               (if (> (+ off (length bs)) len)
                   (error "patch.write exceeds patch length" (list off (length bs) len)))
               ;; update written conservatively to max coverage
               (let ((written2 (max written (+ off (length bs)))))
                 (loop i prev (list 'open (cadr patch) len written2 #f (cadr (cddddr patch))) mux-open (cdr xs)))))

            ((eq? op 'patch.seal)
             (if (or (eq? patch 'idle) (not (eq? (car patch) 'open)))
                 (error "patch.seal with no active patch" (cdr (assoc 'src i))))
             (let* ((len (caddr patch))
                    (written (cadddr patch)))
               ;; optional: require full coverage
               (if (< written len)
                   (error "patch.seal before full patch written" (list written len)))
               (loop i prev (list 'open (cadr patch) len written #t (cadr (cddddr patch))) mux-open (cdr xs))))

            ((eq? op 'patch.abort)
             (if (eq? patch 'idle)
                 (error "patch.abort with no active patch" (cdr (assoc 'src i))))
             (loop i prev 'idle mux-open (cdr xs)))

            ((eq? op 'patch.apply)
             ;; state: must be sealed
             (if (or (eq? patch 'idle) (not (eq? (car patch) 'open)) (not (car (cddddr patch))))
                 (error "patch.apply requires sealed active patch" (cdr (assoc 'src i))))
             ;; gate adjacency
             (if (not (gate-ok?))
                 (error "RFC-009 gate violation: patch.apply missing RR_BARRIER/T barriers" (cdr (assoc 'src i))))
             (step))

            ;; default
            (else (step)))))))

;; -------- label size: update emit-size for new ops --------
(define (emit-size i)
  (let ((op (op-of i)) (args (args-of i)))
    (cond
      ((or (eq? op 'rr.init) (eq? op 'barrier.rr) (eq? op 'barrier.t)
           (eq? op 'mux.open) (eq? op 'patch.apply)) 2)

      ((eq? op 'patch.begin) 4)  ; PATCH_BEGIN + PATCH_ID (two EXTs)

      ((eq? op 'patch.write)
       (+ 2 (bytes->wordcount (collect-bytes args))))

      ((eq? op 'mux.evt)
       (+ 2 (bytes->wordcount (collect-bytes args))))

      (else 1))))

;; -------- emitter additions --------

(define (emit-insn i labels)
  (let* ((op (op-of i)) (args (args-of i)))
    (cond
      ;; ---------------- MUX ----------------
      ((eq? op 'mux.open)
       (let* ((ch (kw-get args '#:ch #f))
              (type (kw-get args '#:type 0))
              (flags8 (kw-get args '#:flags 0))
              (imm (u16 (+ (arithmetic-shift ch 12)
                           (arithmetic-shift type 8)
                           (modulo flags8 256)))))
         (make-ext 0 #x3 0 imm)))

      ((eq? op 'mux.evt)
       (let* ((ch (kw-get args '#:ch #f))
              (tag (kw-get args '#:tag 0))
              (bs  (collect-bytes args))
              (len (length bs))
              (imm (u16 (+ (arithmetic-shift ch 12)
                           (arithmetic-shift tag 8)
                           len)))
              (hdr (make-ext 0 #x4 0 imm))
              (payload (pack-bytes->words bs)))
         (append hdr payload)))

      ((eq? op 'mux.close)
       (let* ((ch (kw-get args '#:ch #f))
              (flags (modulo ch 16)))
         (list (make-word #xC 0 #x2 flags))))

      ((eq? op 'mux.hash)
       (let* ((ch (kw-get args '#:ch #f))
              (rd (reg->u4 (kw-get args '#:rd 'r0)))
              (flags (modulo ch 16)))
         (list (make-word #xC rd #x3 flags))))

      ;; ---------------- PATCH ----------------
      ((eq? op 'patch.begin)
       (let* ((id (kw-get args '#:id #f))
              (len (kw-get args '#:len #f))
              (owner (kw-get args '#:owner #f))
              (owner_is_imm 1)
              (flags owner_is_imm)
              (imm1 (u16 (+ (arithmetic-shift owner 12) len)))
              (begin (make-ext 0 #x5 flags imm1))
              (pid   (make-ext 0 #x9 0 (u16 id))))
         (append begin pid)))

      ((eq? op 'patch.write)
       (let* ((off (kw-get args '#:off #f))
              (bs  (collect-bytes args))
              (hdr (make-ext 0 #x6 1 (u16 off)))
              (payload (pack-bytes->words bs)))
         (append hdr payload)))

      ((eq? op 'patch.seal)
       (list (make-word #xB 0 #x2 0)))

      ((eq? op 'patch.abort)
       (list (make-word #xB 0 #x4 0)))

      ((eq? op 'patch.apply)
       (let* ((addr (kw-get args '#:addr #f))
              (imm (cond
                     ((and (pair? addr) (eq? (car addr) 'label-ref))
                      (label->addr labels (cadr addr)))
                     ((integer? addr) addr)
                     (else (error "patch.apply needs #:addr label-ref or integer" (cdr (assoc 'src i)))))))
         (make-ext 0 #x7 0 (u16 imm))))

      ;; fall back to your previous cases:
      (else
       ;; keep your old emit-insn cases here (rr.init/rr.next/barriers/nop/halt/label/etc)
       (error "emit: unsupported op" op)))))

;; -------- assemble entry: swap in new verifier --------
(define (assemble forms)
  (let* ((insns (map parse-form forms)))
    (verify-patch+gates! insns)
    (let ((labels (collect-labels insns)))
      (let loop ((xs insns) (out '()))
        (if (null? xs)
            (reverse out)
            (let* ((words (emit-insn (car xs) labels)))
              (loop (cdr xs) (append (reverse words) out))))))))
```

> Note: You’ll merge this with your earlier `emit-insn` cases instead of erroring out for the old ops.

---

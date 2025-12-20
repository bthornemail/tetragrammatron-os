# 4) Scheme Assembler — `tools/can-asm.scm` (enforces RFC-0012)

This assembler produces **CANB v1 fixed 16-byte instructions**. It enforces:
- valid opcodes
- valid register indices
- imm16 bounds
- flags bounds + reserved bits = 0
- emits exact 16-byte layout per instruction

```scheme
;; tools/can-asm.scm
;; Usage: (can-assemble-file "examples/fold_min.canasm" "bytecode/fold_min.canb")
;;
;; Assembly format (S-expressions, one per line):
;; (inst OPCODE FLAGS RDST RA RB IMM16 REF32)
;; Example:
;; (inst CANON  (flags canon_out proof)  1 0 0 0  0)
;;
;; Notes:
;; - OPCODE is a symbol: CANON MEET JOIN PROJ_FANO ASSERT_IDEMP COMMIT EMIT_GEOM
;; - FLAGS is (flags <flag> ...)
;; - RDST/RA/RB are 0..255
;; - IMM16 is 0..65535
;; - REF32 is 0..2^32-1

(load "tools/can-pack.scm")

(define (die msg . args)
  (display "can-asm error: ") (apply printf msg args) (newline)
  (error "can-asm"))

(define opcode->byte
  `((CANON . #x10)
    (MEET . #x20)
    (JOIN . #x21)
    (PROJ_FANO . #x30)
    (ASSERT_IDEMP . #x31)
    (COMMIT . #x40)
    (EMIT_GEOM . #x50)))

(define flag->bit
  `((canon_in . 0)
    (canon_out . 1)
    (proof . 2)
    (emit . 3)))

(define (lookup alist k)
  (let ((p (assoc k alist)))
    (and p (cdr p))))

(define (reg? n) (and (integer? n) (<= 0 n) (<= n 255)))
(define (imm16? n) (and (integer? n) (<= 0 n) (<= n 65535)))
(define (ref32? n) (and (integer? n) (<= 0 n) (<= n 4294967295)))

(define (flags->byte form)
  (cond
    ((and (pair? form) (eq? (car form) 'flags))
     (let* ((flags (cdr form))
            (bits (map (lambda (f)
                         (let ((b (lookup flag->bit f)))
                           (if b b (die "unknown flag ~a" f))))
                       flags))
            (mask (foldl (lambda (b acc) (bitwise-ior acc (arithmetic-shift 1 b))) 0 bits)))
       ;; reserved bits must be 0
       (when (not (= (bitwise-and mask #xF0) 0))
         (die "reserved flag bits set: ~x" mask))
       mask))
    (else (die "FLAGS must be (flags ...), got ~s" form))))

(define (encode-inst opcode-sym flags-form rdst ra rb imm16 ref32)
  (let ((opb (lookup opcode->byte opcode-sym)))
    (unless opb (die "unknown opcode ~a" opcode-sym))
    (unless (reg? rdst) (die "bad RDST ~s" rdst))
    (unless (reg? ra) (die "bad RA ~s" ra))
    (unless (reg? rb) (die "bad RB ~s" rb))
    (unless (imm16? imm16) (die "bad IMM16 ~s" imm16))
    (unless (ref32? ref32) (die "bad REF32 ~s" ref32))
    (let ((flagsb (flags->byte flags-form)))
      (append
        (ascii-bytes "CANB")
        (list #x01)           ;; VER
        (list opb)
        (list flagsb)
        (list (u8 rdst))
        (list (u8 ra))
        (list (u8 rb))
        (u16be imm16)
        (u32be ref32)))))

(define (read-all-sexps port)
  (let loop ((acc '()))
    (let ((x (read port)))
      (if (eof-object? x) (reverse acc)
          (loop (cons x acc))))))

(define (assemble-forms forms)
  (append*
    (map (lambda (f)
           (match f
             (('inst op flags rdst ra rb imm16 ref32)
              (encode-inst op flags rdst ra rb imm16 ref32))
             (else
              (die "expected (inst ...), got ~s" f))))
         forms)))

(define (can-assemble-file in-path out-path)
  (call-with-input-file in-path
    (lambda (in)
      (let* ((forms (read-all-sexps in))
             (bytes (assemble-forms forms)))
        (call-with-output-file out-path
          (lambda (out) (write-bytes-to-port bytes out))
          #:exists 'replace)
        (printf "Wrote ~a bytes to ~a
" (length bytes) out-path)))))

;; If run as script: arguments: input output
(define (main argv)
  (when (< (length argv) 3)
    (display "usage: can-asm.scm <input.canasm> <output.canb>
")
    (exit 2))
  (can-assemble-file (list-ref argv 1) (list-ref argv 2)))

;; Racket/Guile compatibility: comment/uncomment as needed
;; (main (command-line))
```

> If you’re using **Guile**, replace `match` usage with a small pattern matcher or use `(ice-9 match)`.

---

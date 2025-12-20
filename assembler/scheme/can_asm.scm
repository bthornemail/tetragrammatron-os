;; can_asm.scm
;; CAN-ISA Assembler with imm16 layout enforcement (RFC-009 Appendix D)
;; Role B: COMPILER / VM IMPLEMENTER
;; Implements: RFC-009 Appendix D, RFC-0012

(define (u32? x) (and (integer? x) (exact? x) (<= 0 x) (<= x #xffffffff)))
(define (u16? x) (and (integer? x) (exact? x) (<= 0 x) (<= x #xffff)))
(define (u8?  x) (and (integer? x) (exact? x) (<= 0 x) (<= x #xff)))
(define (u4?  x) (and (integer? x) (exact? x) (<= 0 x) (<= x #x0f)))

(define (err who msg . xs)
  (apply error who msg xs))

;; ------------------------------
;; Opcode table (RFC-0009 Appendix A, RFC-0013)
;; ------------------------------
(define OPCODES
  `((NOOP         . ,#x00)
    (HALT         . ,#x01)
    (CANON        . ,#x10)
    (MEET_GCD     . ,#x20)
    (JOIN_LCM     . ,#x21)
    (PROJ_FANO    . ,#x30)
    (LDI16H       . ,#x40)
    (LDI16L       . ,#x41)
    (USEI32       . ,#x42)
    (SWAP         . ,#x50)
    (CLEAR        . ,#x51)
    (COMMIT       . ,#x60)
    (TIME_RD      . ,#x64)      ; RFC-0013
    (TIME_DIV     . ,#x65)      ; RFC-0013
    (WAIT         . ,#x66)      ; RFC-0013
    (BARRIER_T    . ,#x67)      ; RFC-0013
    (EMIT_NODE    . ,#x70)
    (EMIT_EDGE    . ,#x71)
    (LIFT_3D      . ,#x72)
    (ASSERT_CANON . ,#x80)
    (ASSERT_IDEMP . ,#x81)
    (ASSERT_FANO  . ,#x82)))

(define (lookup-op name)
  (let ((p (assq name OPCODES)))
    (if p (cdr p) (err 'lookup-op "Unknown opcode" name))))

;; ------------------------------
;; Register parser: r0..r15 or semantic keywords
;; ------------------------------
(define (parse-reg x)
  (cond
    ;; Semantic register keywords (8-tuple)
    ((eq? x 'states) 0)
    ((eq? x 'alphabet) 1)
    ((eq? x 'left_marker) 2)
    ((eq? x 'right_marker) 3)
    ((eq? x 'transition) 4)
    ((eq? x 'start) 5)
    ((eq? x 'accept) 6)
    ((eq? x 'reject) 7)
    ;; Numeric register r0..r15
    ((and (symbol? x)
          (let* ((s (symbol->string x))
                 (n (and (>= (string-length s) 2)
                         (char=? (string-ref s 0) #\r)
                         (string->number (substring s 1 (string-length s))))))
            (and n (integer? n) (<= 0 n) (<= n 15) n)))
     => (lambda (n) n))
    ((integer? x)
     (if (and (<= 0 x) (<= x 15)) x (err 'parse-reg "Register int out of range 0..15" x)))
    (else
     (err 'parse-reg "Bad register (use r0..r15 or semantic keywords)" x))))

;; ------------------------------
;; Simple env for (DEF name value)
;; ------------------------------
(define (env-empty) '())
(define (env-put env k v) (cons (cons k v) env))
(define (env-get env k)
  (let ((p (assq k env)))
    (and p (cdr p))))

(define (resolve-imm env x)
  (cond
    ((integer? x) x)
    ((symbol? x)
     (let ((v (env-get env x)))
       (if v v (err 'resolve-imm "Unknown immediate symbol" x))))
    (else (err 'resolve-imm "Immediate must be int/hex or defined symbol" x))))

;; ------------------------------
;; imm16 validators (RFC-009 Appendix D)
;; ------------------------------
(define (mask-ok? imm allowed-mask)
  ;; allowed-mask: bits that may be 1. others must be 0.
  (= (bitwise-and imm (bitwise-not allowed-mask)) 0))

(define (validate-imm16 opname imm)
  (unless (u16? imm) (err 'validate-imm16 "imm16 out of range 0..65535" opname imm))
  (case opname
    ;; MUST-be-zero
    ((NOOP HALT CANON USEI32 MEET_GCD JOIN_LCM SWAP ASSERT_CANON ASSERT_IDEMP)
     (unless (= imm 0) (err 'validate-imm16 "imm16 MUST be 0" opname imm)))

    ;; COMMIT: profile<<8 | flags ; flags bits 0..1 only
    ((COMMIT)
     (let* ((profile (arithmetic-shift imm -8))
            (flags   (bitwise-and imm #xff)))
       (unless (u8? profile) (err 'validate-imm16 "Bad commit profile" profile))
       (unless (mask-ok? flags #b00000011)
         (err 'validate-imm16 "Bad commit flags (only bits0..1 allowed)" flags))))

    ;; CLEAR: low4 mask, upper12 zero
    ((CLEAR)
     (unless (= (bitwise-and imm #xfff0) 0)
       (err 'validate-imm16 "CLEAR upper 12 bits must be 0" imm)))

    ;; PROJ_FANO: omit_rule<<8 | flags; flags bits0..5 only
    ((PROJ_FANO)
     (let* ((omit-rule (arithmetic-shift imm -8))
            (flags (bitwise-and imm #xff)))
       (unless (u8? omit-rule) (err 'validate-imm16 "Bad omit_rule" omit-rule))
       (unless (mask-ok? flags #b00111111)
         (err 'validate-imm16 "Bad PROJ_FANO flags (bits0..5 only)" flags))))

    ;; EMIT_NODE: style<<12 | layer<<8 | flags ; flags bits0..2 only
    ((EMIT_NODE)
     (let* ((style (bitwise-and (arithmetic-shift imm -12) #x0f))
            (layer (bitwise-and (arithmetic-shift imm -8)  #x0f))
            (flags (bitwise-and imm #xff)))
       (unless (u4? style) (err 'validate-imm16 "Bad style" style))
       (unless (u4? layer) (err 'validate-imm16 "Bad layer" layer))
       (unless (mask-ok? flags #b00000111)
         (err 'validate-imm16 "Bad EMIT_NODE flags (bits0..2 only)" flags))))

    ;; EMIT_EDGE: from_idx<<8 | to_idx ; each 0..6
    ((EMIT_EDGE)
     (let ((from (arithmetic-shift imm -8))
           (to   (bitwise-and imm #xff)))
       (unless (and (integer? from) (<= 0 from) (<= from 6))
         (err 'validate-imm16 "from_idx must be 0..6" from))
       (unless (and (integer? to) (<= 0 to) (<= to 6))
         (err 'validate-imm16 "to_idx must be 0..6" to))))

    ;; LIFT_3D: space<<12 | scale<<8 | flags ; flags bits0..3 only
    ((LIFT_3D)
     (let* ((space (bitwise-and (arithmetic-shift imm -12) #x0f))
            (scale (bitwise-and (arithmetic-shift imm -8)  #x0f))
            (flags (bitwise-and imm #xff)))
       (unless (u4? space) (err 'validate-imm16 "Bad space" space))
       (unless (u4? scale) (err 'validate-imm16 "Bad scale" scale))
       (unless (mask-ok? flags #b00001111)
         (err 'validate-imm16 "Bad LIFT_3D flags (bits0..3 only)" flags))))

    ;; ASSERT_FANO: reg3 in low 4 bits; upper 12 bits zero
    ((ASSERT_FANO)
     (unless (= (bitwise-and imm #xfff0) 0)
       (err 'validate-imm16 "ASSERT_FANO upper 12 bits must be 0" imm))
     (let ((reg3 (bitwise-and imm #x0f)))
       (unless (<= reg3 7)
         (err 'validate-imm16 "ASSERT_FANO reg3 must be 0..7" reg3))))

    ;; RFC-0013: Time and Barrier Opcodes
    ;; TIME_RD: must be zero
    ((TIME_RD)
     (unless (= imm 0) (err 'validate-imm16 "TIME_RD imm16 MUST be 0" opname imm)))

    ;; TIME_DIV: must be > 0
    ((TIME_DIV)
     (unless (> imm 0) (err 'validate-imm16 "TIME_DIV imm16 MUST be > 0" opname imm)))

    ;; WAIT: any value allowed (0 = cooperative yield)
    ((WAIT)
     #t)  ; Any value is valid

    ;; BARRIER_T: must be > 0
    ((BARRIER_T)
     (unless (> imm 0) (err 'validate-imm16 "BARRIER_T imm16 MUST be > 0" opname imm)))

    (else
     ;; Unknown opnames should never reach here if opcode table is used,
     ;; but keep strict.
     (err 'validate-imm16 "No validator for opcode" opname))))

;; ------------------------------
;; Word encoder (32-bit big-endian)
;; ------------------------------
(define (encode-word opcode A B imm16)
  (unless (u8? opcode) (err 'encode-word "opcode not u8" opcode))
  (unless (and (<= 0 A) (<= A 15)) (err 'encode-word "A not u4" A))
  (unless (and (<= 0 B) (<= B 15)) (err 'encode-word "B not u4" B))
  (unless (u16? imm16) (err 'encode-word "imm16 not u16" imm16))
  (let ((w (bitwise-ior
            (arithmetic-shift opcode 24)
            (arithmetic-shift A 20)
            (arithmetic-shift B 16)
            imm16)))
    (unless (u32? w) (err 'encode-word "word overflow" w))
    w))

(define (u32->bytes-be w)
  (list (bitwise-and (arithmetic-shift w -24) #xff)
        (bitwise-and (arithmetic-shift w -16) #xff)
        (bitwise-and (arithmetic-shift w -8)  #xff)
        (bitwise-and w #xff)))

;; ------------------------------
;; Assembler core
;; ------------------------------
(define (assemble forms)
  ;; Pass 0: collect DEFs
  (define (collect-defs forms env)
    (if (null? forms) env
        (let ((f (car forms)))
          (cond
            ((and (pair? f) (eq? (car f) 'DEF))
             (let* ((name (cadr f))
                    (val  (caddr f)))
               (unless (symbol? name) (err 'DEF "Name must be symbol" name))
               (unless (and (integer? val) (exact? val))
                 (err 'DEF "Value must be exact integer" val))
               (collect-defs (cdr forms) (env-put env name val))))
            (else (collect-defs (cdr forms) env))))))

  (define env (collect-defs forms (env-empty)))

  ;; Pass 1: encode instructions, ignoring DEF forms
  (define (encode-forms forms acc-bytes)
    (if (null? forms)
        (reverse acc-bytes)
        (let ((f (car forms)))
          (cond
            ((and (pair? f) (eq? (car f) 'DEF))
             (encode-forms (cdr forms) acc-bytes))
            (else
             ;; instruction must be (OP A B IMM)
             (unless (and (pair? f) (= (length f) 4))
               (err 'assemble "Instruction must be (OP A B IMM)" f))
             (let* ((opname (car f))
                    (A (parse-reg (cadr f)))
                    (B (parse-reg (caddr f)))
                    (imm (resolve-imm env (cadddr f)))
                    (opcode (lookup-op opname)))
               (unless (u16? imm)
                 (err 'assemble "Immediate does not fit in u16" opname imm))
               (validate-imm16 opname imm)
               (let* ((w (encode-word opcode A B imm))
                      (bs (u32->bytes-be w)))
                 (encode-forms (cdr forms) (append (reverse bs) acc-bytes)))))))))

  (encode-forms forms '()))

;; ------------------------------
;; Convenience: write to file
;; ------------------------------
(define (write-bytes path bytes)
  (call-with-output-file path
    (lambda (port)
      (for-each (lambda (b) (write-u8 b port)) bytes))
    'truncate))

;; ------------------------------
;; Export main function
;; ------------------------------
(define (assemble-file input-path output-path)
  (let ((forms (call-with-input-file input-path read)))
    (let ((bytes (assemble forms)))
      (write-bytes output-path bytes)
      (length bytes))))


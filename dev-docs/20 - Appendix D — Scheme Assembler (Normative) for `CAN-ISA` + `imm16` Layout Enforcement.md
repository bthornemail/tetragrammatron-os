
## Appendix D — Scheme Assembler (Normative) for `CAN-ISA` + `imm16` Layout Enforcement

This appendix defines a **mechanical** Scheme assembler that:

1. Parses a small S-expression assembly syntax
2. Encodes **exact 32-bit instructions** (`opcode8 | A4 | B4 | imm16`)
3. Enforces **all `imm16` layouts** from Appendix B (trap on violations)
4. Emits a `.canbc` *byte stream* (container TBD in Appendix C; this emits the raw instruction stream)

Everything here is designed to drop into your repo as `src/asm/can_asm.scm`.

---

# D.1 Instruction Word Encoding (Normative)

Each instruction is exactly 4 bytes:

```
word32 = (opcode << 24) | (A << 20) | (B << 16) | imm16
```

- `opcode`: 8-bit (0..255)
- `A`: 4-bit register index (0..15)
- `B`: 4-bit register index (0..15)
- `imm16`: 16-bit unsigned (0..65535)

**Endianness (byte output):** MUST emit **big-endian** bytes:
`[word>>24, word>>16, word>>8, word]`

---

# D.2 Assembly Surface Syntax (Normative)

Assembler input is a list of instruction forms:

### Basic form
```scheme
(OPNAME A B IMM)
```

### Convenience forms (optional but recommended)
```scheme
(DEF name value)            ; symbolic constant (value is exact integer)
(LABEL name)                ; label anchor (PC in words)
(JMP label)                 ; expanded macro (if you later add OP_JMP)
```

For this appendix we implement the **basic form** + `DEF` constants.

Registers are written as symbols:
- `r0`..`r15`

Immediates may be:
- exact integers (decimal)
- hex integers as Scheme numbers (`#x1234`)
- defined symbols via `DEF`

---

# D.3 Opcode Map (Assembler Table)

This assembler expects the CAN-ISA subset used in RFC-009:

```scheme
CANON           0x02
COMMIT          0x03
LDI16H          0x10
LDI16L          0x11
USEI32          0x12
MEET_GCD        0x20
JOIN_LCM        0x21
CLEAR           0x23
PROJ_FANO       0x30
EMIT_NODE       0x31
EMIT_EDGE       0x32
LIFT_3D         0x33
ASSERT_CANON    0x40
ASSERT_IDEMP    0x41
ASSERT_FANO     0x42
```

(You can extend this table without touching the encoder.)

---

# D.4 `imm16` Validators (Normative)

The assembler MUST apply the following checks **per opcode**:

### MUST-be-zero immediates
`CANON, USEI32, MEET_GCD, JOIN_LCM, ASSERT_CANON, ASSERT_IDEMP`:
- `imm16` MUST be `0`

### `COMMIT (0x03)` layout
- `imm16 = (profile<<8) | flags`
- flags: only bits 0..1 allowed

### `CLEAR (0x23)` layout
- low 4 bits are mask
- upper 12 bits MUST be zero

### `PROJ_FANO (0x30)` layout
- `imm16 = (omit_rule<<8) | flags`
- flags: only bits 0..5 allowed

### `EMIT_NODE (0x31)` layout
- `imm16 = (style<<12) | (layer<<8) | flags`
- flags: only bits 0..2 allowed

### `EMIT_EDGE (0x32)` layout
- `(from_idx<<8) | to_idx`
- from_idx, to_idx MUST be 0..6

### `LIFT_3D (0x33)` layout
- `imm16 = (space<<12) | (scale<<8) | flags`
- flags: only bits 0..3 allowed

### `ASSERT_FANO (0x42)` layout
- low 4 bits = reg3 (0..15); upper bits MUST be zero

Violations MUST raise an error (assembler “trap”).

---

# D.5 Reference Implementation (Scheme)

```scheme
;; src/asm/can_asm.scm
;; CAN-ISA Assembler with imm16 layout enforcement (RFC-009 Appendix D)

(define (u32? x) (and (integer? x) (exact? x) (<= 0 x) (<= x #xffffffff)))
(define (u16? x) (and (integer? x) (exact? x) (<= 0 x) (<= x #xffff)))
(define (u8?  x) (and (integer? x) (exact? x) (<= 0 x) (<= x #xff)))
(define (u4?  x) (and (integer? x) (exact? x) (<= 0 x) (<= x #x0f)))

(define (err who msg . xs)
  (apply error who msg xs))

;; ------------------------------
;; Opcode table
;; ------------------------------
(define OPCODES
  `((CANON        . ,#x02)
    (COMMIT       . ,#x03)
    (LDI16H       . ,#x10)
    (LDI16L       . ,#x11)
    (USEI32       . ,#x12)
    (MEET_GCD     . ,#x20)
    (JOIN_LCM     . ,#x21)
    (CLEAR        . ,#x23)
    (PROJ_FANO    . ,#x30)
    (EMIT_NODE    . ,#x31)
    (EMIT_EDGE    . ,#x32)
    (LIFT_3D      . ,#x33)
    (ASSERT_CANON . ,#x40)
    (ASSERT_IDEMP . ,#x41)
    (ASSERT_FANO  . ,#x42)))

(define (lookup-op name)
  (let ((p (assq name OPCODES)))
    (if p (cdr p) (err 'lookup-op "Unknown opcode" name))))

;; ------------------------------
;; Register parser: r0..r15
;; ------------------------------
(define (parse-reg x)
  (cond
    ((and (symbol? x)
          (let* ((s (symbol->string x))
                 (n (and (>= (string-length s) 2)
                         (char=? (string-ref s 0) #\r)
                         (string->number (substring s 1 (string-length s))))))
            (and n (integer? n) (<= 0 n) (<= n 15) n)))
     => (lambda (n) n))
    ((integer? x)
     (if (u4? x) x (err 'parse-reg "Register int out of range 0..15" x)))
    (else
     (err 'parse-reg "Bad register (use r0..r15)" x))))

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
;; imm16 validators (Appendix B)
;; ------------------------------
(define (mask-ok? imm allowed-mask)
  ;; allowed-mask: bits that may be 1. others must be 0.
  (= (bitwise-and imm (bitwise-not allowed-mask)) 0))

(define (validate-imm16 opname imm)
  (unless (u16? imm) (err 'validate-imm16 "imm16 out of range 0..65535" opname imm))
  (case opname
    ;; MUST-be-zero
    ((CANON USEI32 MEET_GCD JOIN_LCM ASSERT_CANON ASSERT_IDEMP)
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
       (err 'validate-imm16 "ASSERT_FANO upper 12 bits must be 0" imm)))

    (else
     ;; Unknown opnames should never reach here if opcode table is used,
     ;; but keep strict.
     (err 'validate-imm16 "No validator for opcode" opname))))

;; ------------------------------
;; Word encoder
;; ------------------------------
(define (encode-word opcode A B imm16)
  (unless (u8? opcode) (err 'encode-word "opcode not u8" opcode))
  (unless (u4? A) (err 'encode-word "A not u4" A))
  (unless (u4? B) (err 'encode-word "B not u4" B))
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
;; Example usage
;; ------------------------------
;; (define program
;;   '((DEF COMMIT_DEFAULT #x0000)
;;     (CANON r0 r0 #x0000)
;;     (LDI16H r1 r0 #x0000)            ; I32 hi
;;     (LDI16L r1 r0 #x00E5)            ; I32 lo  (example)
;;     (USEI32 r2 r1 #x0000)            ; load poly-id
;;     (MEET_GCD r3 r2 #x0000)
;;     (PROJ_FANO r3 r0 #x003F)         ; omit_rule=0 flags=0x3F
;;     (COMMIT r0 r0 COMMIT_DEFAULT)))
;;
;; (define bytes (assemble program))
;; (write-bytes "out.canbc" bytes)
```

---

# D.6 Mechanical Guarantees (What this enforces)

- Any accidental non-zero `imm16` on a “MUST be zero” opcode becomes an immediate assembler error.
- Any unknown flag bit becomes an error.
- Fano indices are range checked (0..6).
- The output stream is fully deterministic: same forms → same bytes.

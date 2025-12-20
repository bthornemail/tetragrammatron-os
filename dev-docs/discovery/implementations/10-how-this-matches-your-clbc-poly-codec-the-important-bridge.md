# 10) How this “matches your CLBC-POLY codec” (the important bridge)

- **CLBC-POLY** remains the canonical byte form for polynomial values.
- The VM registers carry **handles** that refer to polynomials whose content is (or can be emitted as) CLBC-POLY bytes.
- The **MUX** layer is where you can emit:
  - CLBC-POLY bytes (format RAW_BYTES)
  - Or JSONL wrappers
  - Or GLB chunks that embed those bytes

If you want a strict container tie-in like `magic + kind + version + …`, we can add one optional “program container” header later, but the **instruction encodings above are already container-agnostic and canonical**.

---

## If you want the next deliverable
Say “**generate Scheme assembler spec**” and I’ll write:

- The exact s-expression grammar
- The encoder that emits the above bytes (big-endian)
- A verifier that rejects:
  - invalid reg numbers
  - forbidden reserved bits
  - non-canonical imm16 flags
  - out-of-range channel axes

…and I can include macros like:

- `(@STATE ENV SYNC GLB)` → imm16
- `(mux-open @... GLB_CHUNK)`
- `(meet r3 r1 r2)` etc.

---

## You

Generate scheme assembler

---

## ChatGPT

```scheme
;; ============================================================================
;; CAN-ISA / Origami Fold VM — Scheme Assembler (R5RS-ish)
;; Implements the binary layouts we just locked:
;;   - 1-byte opcode, big-endian integers, fixed-width operands
;;   - imm16 channel encoding: (flags4<<12) | (a0 | (a1<<3) | (a2<<6) | (a3<<9))
;;
;; Output: list of u8 bytes (0..255) you can write as a .canbc / .clbc payload.
;;
;; You get:
;;   - labels + rel16 jumps (JMP, JZ)
;;   - argument validation (reserved bits must be 0, regs 0..15, etc.)
;;   - channel encoder with semantic 8 keywords
;;
;; NOTE: This is an assembler. It does not execute. Pair with your VM.
;; ============================================================================

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; 0) Config: opcodes + formats
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define OPC_TIME_RD      #x60)
(define OPC_WAIT_US      #x61)
(define OPC_BARRIER_T    #x62)

(define OPC_RR_INIT      #x70)
(define OPC_RR_NEXT      #x71)

(define OPC_MUX_OPEN     #x80)
(define OPC_MUX_EVT      #x81)
(define OPC_MUX_CLOSE    #x82)

(define OPC_PATCH_BEGIN  #x90)
(define OPC_PATCH_WRITE  #x91)
(define OPC_PATCH_SEAL   #x92)
(define OPC_PATCH_APPLY  #x93)

(define OPC_CANON        #xA0)
(define OPC_MEET_GCD     #xA1)
(define OPC_JOIN_LCM     #xA2)
(define OPC_PROJ_FANO    #xA3)
(define OPC_ASSERT_IDEMP #xA4)
(define OPC_ASSERT_TRIAD #xA5)

(define OPC_JMP          #x40)
(define OPC_JZ           #x41)

;; MUX formats (suggested)
(define FMT_RAW_BYTES    0)
(define FMT_JSONL        1)
(define FMT_SVG_PATH     2)
(define FMT_OBJ          3)
(define FMT_GLB_CHUNK    4)
(define FMT_PCM16        5)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; 1) 8 semantic keywords for axes (0..7)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; These replace Q Σ L R δ s t r with keyboard-friendly mnemonics.
;; You can rename later without changing encoding (just this mapping).
(define *axis->id*
  (list (cons 'STATE       0)
        (cons 'ALPHABET    1)
        (cons 'LEFT        2)
        (cons 'RIGHT       3)
        (cons 'TRANSITION  4)
        (cons 'START       5)
        (cons 'ACCEPT      6)
        (cons 'REJECT      7)))

(define (axis->id x)
  (cond
    ((integer? x) x)
    ((symbol? x)
     (let ((p (assq x *axis->id*)))
       (if p (cdr p)
           (error "unknown axis keyword" x))))
    (else (error "axis must be integer 0..7 or keyword" x))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; 2) Small helpers: checks + endian emission
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define (u8 x)
  (if (and (integer? x) (<= 0 x) (<= x 255)) x
      (error "u8 out of range" x)))

(define (u16 x)
  (if (and (integer? x) (<= 0 x) (<= x 65535)) x
      (error "u16 out of range" x)))

(define (i16 x)
  (if (and (integer? x) (<= -32768 x) (<= x 32767)) x
      (error "i16 out of range" x)))

(define (reg x)
  (if (and (integer? x) (<= 0 x) (<= x 15)) x
      (error "reg must be 0..15" x)))

(define (emit-u8 b out) (cons (u8 b) out))

(define (emit-u16be n out)
  (let* ((n (u16 n))
         (hi (quotient n 256))
         (lo (modulo n 256)))
    (emit-u8 lo (emit-u8 hi out))))

(define (emit-i16be n out)
  (let* ((n (i16 n))
         (u (if (< n 0) (+ n 65536) n)))
    (emit-u16be u out)))

(define (emit-bytes bs out)
  ;; bs is list of u8
  (let loop ((xs bs) (acc out))
    (if (null? xs) acc
        (loop (cdr xs) (emit-u8 (car xs) acc)))))

(define (string->u8-list s)
  ;; R5RS: no bytevectors; use string->list + char->integer
  (map char->integer (string->list s)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; 3) imm16 channel encoder (flags4 + 4 axes each 0..7)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define (encode-channel12 a0 a1 a2 a3)
  (let ((a0 (axis->id a0)) (a1 (axis->id a1)) (a2 (axis->id a2)) (a3 (axis->id a3)))
    (for-each
      (lambda (a)
        (if (and (integer? a) (<= 0 a) (<= a 7)) #t (error "axis id must be 0..7" a)))
      (list a0 a1 a2 a3))
    (+ a0 (* a1 8) (* a2 64) (* a3 512))))     ;; 3-bit packing

(define (encode-imm16 flags4 a0 a1 a2 a3)
  (let ((flags4 (if (and (integer? flags4) (<= 0 flags4) (<= flags4 15)) flags4
                    (error "flags4 must be 0..15" flags4)))
        (ch12 (encode-channel12 a0 a1 a2 a3)))
    (+ (* flags4 4096) ch12)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; 4) Assembly language (S-expr) — accepted forms
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; A program is a list of forms. Forms are either:
;;   (label NAME)
;;   (TIME_RD dst_reg unit flags)          ;; flags MUST be 0 in v1
;;   (WAIT_US src_reg flags16)             ;; flags16 MUST be 0
;;   (BARRIER_T mode param-u16)
;;   (RR_INIT rr_id count flags)           ;; flags MUST be 0
;;   (RR_NEXT rr_id dst_reg flags)         ;; flags MUST be 0
;;   (MUX_OPEN (ch flags4 a0 a1 a2 a3) format flags8) ;; flags8 MUST be 0
;;   (MUX_EVT len kind flags8 payload-bytes...)       ;; payload-bytes are u8
;;     - OR payload can be a string: (MUX_EVT kind "hello")  (len auto)
;;   (MUX_CLOSE (ch flags4 a0 a1 a2 a3) flags16)      ;; flags16 MUST be 0
;;   (PATCH_BEGIN patch_id target max_len)
;;   (PATCH_WRITE patch_id offset bytes...)           ;; bytes are u8
;;     - OR bytes can be a string: (PATCH_WRITE patch_id offset "...")
;;   (PATCH_SEAL patch_id dst_reg algo flags16)       ;; flags16 MUST be 0
;;   (PATCH_APPLY patch_id barrier_mode barrier_reg flags16) ;; flags16 MUST be 0
;;   (CANON dst_reg src_reg flags8)                   ;; flags8 MUST be 0
;;   (MEET_GCD dst_reg a_reg b_reg)
;;   (JOIN_LCM dst_reg a_reg b_reg)
;;   (PROJ_FANO dst_reg src_reg flags8)               ;; flags8 = 0 or 1
;;   (ASSERT_IDEMP src_reg flags16)                   ;; flags16 MUST be 0
;;   (ASSERT_TRIAD a_reg b_reg c_reg)
;;   (JMP label)                                      ;; rel16 computed
;;   (JZ test_reg label)                              ;; rel16 computed
;;
;; Channel helper form:
;;   (ch flags4 a0 a1 a2 a3)
;; where each ai is 0..7 or one of:
;;   STATE ALPHABET LEFT RIGHT TRANSITION START ACCEPT REJECT
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; 5) First pass: compute label->pc mapping
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define (instr-size form)
  (let ((op (car form)))
    (cond
      ((eq? op 'label) 0)

      ((eq? op 'TIME_RD)   4)
      ((eq? op 'WAIT_US)   4)
      ((eq? op 'BARRIER_T) 4)

      ((eq? op 'RR_INIT)   4)
      ((eq? op 'RR_NEXT)   4)

      ((eq? op 'MUX_OPEN)  6)
      ((eq? op 'MUX_CLOSE) 5)
      ((eq? op 'MUX_EVT)
       ;; Two supported encodings:
       ;;   (MUX_EVT len kind flags payload...)
       ;;   (MUX_EVT kind "string")  OR (MUX_EVT kind (bytes ...))
       (let ((n (length form)))
         (cond
           ((>= n 5) (+ 6 (u16 (cadr form)))) ;; explicit len
           ((= n 3)
            ;; (MUX_EVT kind payload) where payload is string or (bytes ...)
            (let ((payload (caddr form)))
              (cond
                ((string? payload) (+ 6 (string-length payload)))
                ((and (pair? payload) (eq? (car payload) 'bytes))
                 (+ 6 (length (cdr payload))))
                (else (error "bad MUX_EVT payload form" form)))))
           (else (error "bad MUX_EVT arity" form)))))

      ((eq? op 'PATCH_BEGIN) 7)
      ((eq? op 'PATCH_SEAL)  6)
      ((eq? op 'PATCH_APPLY) 6)
      ((eq? op 'PATCH_WRITE)
       ;; (PATCH_WRITE patch_id offset bytes...) OR (PATCH_WRITE patch_id offset "...")
       (let ((payload (cadddr form)))
         (cond
           ((string? payload) (+ 7 (string-length payload)))
           (else (+ 7 (- (length form) 3)))))) ;; bytes count = (len form) - 3

      ((eq? op 'CANON)        4)
      ((eq? op 'MEET_GCD)     4)
      ((eq? op 'JOIN_LCM)     4)
      ((eq? op 'PROJ_FANO)    4)
      ((eq? op 'ASSERT_IDEMP) 4)
      ((eq? op 'ASSERT_TRIAD) 4)

      ((eq? op 'JMP) 5)
      ((eq? op 'JZ)  5)

      (else (error "unknown op for sizing" op)))))

(define (pass1-labels program)
  (let loop ((xs program) (pc 0) (labels '()))
    (if (null? xs)
        labels
        (let ((f (car xs)))
          (if (and (pair? f) (eq? (car f) 'label))
              (let ((name (cadr f)))
                (if (assq name labels) (error "duplicate label" name)
                    (loop (cdr xs) pc (cons (cons name pc) labels))))
              (loop (cdr xs) (+ pc (instr-size f)) labels))))))

(define (label-pc labels name)
  (let ((p (assq name labels)))
    (if p (cdr p)
        (error "unknown label" name))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; 6) Second pass: encode bytes (big-endian) + resolve rel16 jumps
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define (encode-channel-form chform)
  ;; chform = (ch flags4 a0 a1 a2 a3)
  (if (and (pair? chform) (eq? (car chform) 'ch) (= (length chform) 6))
      (let ((flags4 (cadr chform))
            (a0 (caddr chform)) (a1 (cadddr chform))
            (a2 (car (cddddr chform)))
            (a3 (cadr (cddddr chform))))
        (encode-imm16 flags4 a0 a1 a2 a3))
      (error "expected (ch flags4 a0 a1 a2 a3)" chform)))

(define (encode-form f labels pc out-rev)
  (let ((op (car f)))
    (cond
      ((eq? op 'label) out-rev)

      ;; TIME_RD: u8 op, u8 dst, u8 unit, u8 flags
      ((eq? op 'TIME_RD)
       (let ((dst (reg (cadr f)))
             (unit (u8 (caddr f)))
             (flags (u8 (cadddr f))))
         (if (not (= flags 0)) (error "TIME_RD flags must be 0 in v1" f) #t)
         (emit-u8 flags (emit-u8 unit (emit-u8 dst (emit-u8 OPC_TIME_RD out-rev))))))

      ;; WAIT_US: u8 op, u8 src, u16 flags=0
      ((eq? op 'WAIT_US)
       (let ((src (reg (cadr f)))
             (flags16 (u16 (caddr f))))
         (if (not (= flags16 0)) (error "WAIT_US flags16 must be 0 in v1" f) #t)
         (emit-u16be flags16 (emit-u8 src (emit-u8 OPC_WAIT_US out-rev)))))

      ;; BARRIER_T: u8 op, u8 mode, u16 param
      ((eq? op 'BARRIER_T)
       (let ((mode (u8 (cadr f)))
             (param (u16 (caddr f))))
         (if (>= mode 4) (error "BARRIER_T mode must be 0..3" f) #t)
         (emit-u16be param (emit-u8 mode (emit-u8 OPC_BARRIER_T out-rev)))))

      ;; RR_INIT: u8 op, u8 rr_id, u8 count, u8 flags=0
      ((eq? op 'RR_INIT)
       (let ((rr (u8 (cadr f)))
             (count (u8 (caddr f)))
             (flags (u8 (cadddr f))))
         (if (or (= count 0) (not (= flags 0))) (error "RR_INIT: count>=1 and flags=0" f) #t)
         (emit-u8 flags (emit-u8 count (emit-u8 rr (emit-u8 OPC_RR_INIT out-rev))))))

      ;; RR_NEXT: u8 op, u8 rr_id, u8 dst, u8 flags=0
      ((eq? op 'RR_NEXT)
       (let ((rr (u8 (cadr f)))
             (dst (reg (caddr f)))
             (flags (u8 (cadddr f))))
         (if (not (= flags 0)) (error "RR_NEXT flags must be 0 in v1" f) #t)
         (emit-u8 flags (emit-u8 dst (emit-u8 rr (emit-u8 OPC_RR_NEXT out-rev))))))

      ;; MUX_OPEN: u8 op, u16 ch, u8 format, u8 flags=0
      ((eq? op 'MUX_OPEN)
       (let ((ch (encode-channel-form (cadr f)))
             (fmt (u8 (caddr f)))
             (flags (u8 (cadddr f))))
         (if (not (= flags 0)) (error "MUX_OPEN flags must be 0 in v1" f) #t)
         (emit-u8 flags (emit-u8 fmt (emit-u16be ch (emit-u8 OPC_MUX_OPEN out-rev))))))

      ;; MUX_CLOSE: u8 op, u16 ch, u16 flags=0  (total 5 bytes)
      ((eq? op 'MUX_CLOSE)
       (let ((ch (encode-channel-form (cadr f)))
             (flags16 (u16 (caddr f))))
         (if (not (= flags16 0)) (error "MUX_CLOSE flags16 must be 0 in v1" f) #t)
         ;; op + ch + flags16
         (emit-u16be flags16 (emit-u16be ch (emit-u8 OPC_MUX_CLOSE out-rev)))))

      ;; MUX_EVT:
      ;;  A) (MUX_EVT len kind flags payload-bytes...)
      ;;  B) (MUX_EVT kind "string")
      ;;  C) (MUX_EVT kind (bytes 1 2 3))
      ;; Layout: u8 op, u16 len, u8 kind, u8 flags, payload[len]
      ((eq? op 'MUX_EVT)
       (let ((n (length f)))
         (cond
           ((>= n 5)
            (let* ((len (u16 (cadr f)))
                   (kind (u8 (caddr f)))
                   (flags (u8 (cadddr f)))
                   (payload (cddddr f)))
              (if (not (= flags 0)) (error "MUX_EVT flags must be 0 in v1" f) #t)
              (if (not (= len (length payload))) (error "MUX_EVT len mismatch" f) #t)
              (emit-bytes payload
                          (emit-u8 flags (emit-u8 kind (emit-u16be len (emit-u8 OPC_MUX_EVT out-rev)))))))
           ((= n 3)
            (let* ((kind (u8 (cadr f)))
                   (payload (caddr f))
                   (bytes (cond
                            ((string? payload) (string->u8-list payload))
                            ((and (pair? payload) (eq? (car payload) 'bytes))
                             (map u8 (cdr payload)))
                            (else (error "bad MUX_EVT payload" f))))
                   (len (length bytes)))
              (emit-bytes bytes
                          (emit-u8 0 (emit-u8 kind (emit-u16be len (emit-u8 OPC_MUX_EVT out-rev)))))))
           (else (error "bad MUX_EVT arity" f)))))

      ;; PATCH_BEGIN: u8 op, u8 patch_id, u16 target, u16 max_len  (7 bytes)
      ((eq? op 'PATCH_BEGIN)
       (let ((pid (u8 (cadr f)))
             (target (u16 (caddr f)))
             (maxlen (u16 (cadddr f))))
         (emit-u16be maxlen (emit-u16be target (emit-u8 pid (emit-u8 OPC_PATCH_BEGIN out-rev))))))

      ;; PATCH_WRITE:
      ;;  A) (PATCH_WRITE pid offset b0 b1 ...)
      ;;  B) (PATCH_WRITE pid offset "string")
      ;; Layout: u8 op, u8 pid, u16 offset, u16 len, bytes[len]   (7+len)
      ((eq? op 'PATCH_WRITE)
       (let* ((pid (u8 (cadr f)))
              (offset (u16 (caddr f)))
              (payload (cadddr f))
              (bytes (if (string? payload)
                         (string->u8-list payload)
                         (map u8 (cdddr f))))
              (len (length bytes)))
         (emit-bytes bytes
                     (emit-u16be len (emit-u16be offset (emit-u8 pid (emit-u8 OPC_PATCH_WRITE out-rev)))))))

      ;; PATCH_SEAL: u8 op, u8 pid, u8 dst, u8 algo, u16 flags=0  (6 bytes)
      ((eq? op 'PATCH_SEAL)
       (let ((pid (u8 (cadr f)))
             (dst (reg (caddr f)))
             (algo (u8 (cadddr f)))
             (flags16 (u16 (car (cddddr f)))))
         (if (not (= flags16 0)) (error "PATCH_SEAL flags16 must be 0 in v1" f) #t)
         (emit-u16be flags16 (emit-u8 algo (emit-u8 dst (emit-u8 pid (emit-u8 OPC_PATCH_SEAL out-rev)))))))

      ;; PATCH_APPLY: u8 op, u8 pid, u8 barrier_mode, u8 barrier_reg, u16 flags=0 (6 bytes)
      ((eq? op 'PATCH_APPLY)
       (let ((pid (u8 (cadr f)))
             (bmode (u8 (caddr f)))
             (breg (reg (cadddr f)))
             (flags16 (u16 (car (cddddr f)))))
         (if (>= bmode 4) (error "PATCH_APPLY barrier_mode must be 0..3" f) #t)
         (if (not (= flags16 0)) (error "PATCH_APPLY flags16 must be 0 in v1" f) #t)
         (emit-u16be flags16 (emit-u8 breg (emit-u8 bmode (emit-u8 pid (emit-u8 OPC_PATCH_APPLY out-rev)))))))

      ;; CANON: u8 op, u8 dst, u8 src, u8 flags=0
      ((eq? op 'CANON)
       (let ((dst (reg (cadr f)))
             (src (reg (caddr f)))
             (flags (u8 (cadddr f))))
         (if (not (= flags 0)) (error "CANON flags must be 0 in v1" f) #t)
         (emit-u8 flags (emit-u8 src (emit-u8 dst (emit-u8 OPC_CANON out-rev))))))

      ;; MEET_GCD / JOIN_LCM: u8 op, u8 dst, u8 a, u8 b
      ((eq? op 'MEET_GCD)
       (emit-u8 (reg (cadddr f))
                (emit-u8 (reg (caddr f))
                         (emit-u8 (reg (cadr f))
                                  (emit-u8 OPC_MEET_GCD out-rev)))))
      ((eq? op 'JOIN_LCM)
       (emit-u8 (reg (cadddr f))
                (emit-u8 (reg (caddr f))
                         (emit-u8 (reg (cadr f))
                                  (emit-u8 OPC_JOIN_LCM out-rev)))))

      ;; PROJ_FANO: u8 op, u8 dst, u8 src, u8 flags (0 or 1)
      ((eq? op 'PROJ_FANO)
       (let ((dst (reg (cadr f)))
             (src (reg (caddr f)))
             (flags (u8 (cadddr f))))
         (if (and (not (= flags 0)) (not (= flags 1)))
             (error "PROJ_FANO flags must be 0 or 1 in v1" f) #t)
         (emit-u8 flags (emit-u8 src (emit-u8 dst (emit-u8 OPC_PROJ_FANO out-rev))))))

      ;; ASSERT_IDEMP: u8 op, u8 src, u16 flags=0
      ((eq? op 'ASSERT_IDEMP)
       (let ((src (reg (cadr f)))
             (flags16 (u16 (caddr f))))
         (if (not (= flags16 0)) (error "ASSERT_IDEMP flags16 must be 0 in v1" f) #t)
         (emit-u16be flags16 (emit-u8 src (emit-u8 OPC_ASSERT_IDEMP out-rev)))))

      ;; ASSERT_TRIAD: u8 op, u8 a, u8 b, u8 c
      ((eq? op 'ASSERT_TRIAD)
       (emit-u8 (reg (cadddr f))
                (emit-u8 (reg (caddr f))
                         (emit-u8 (reg (cadr f))
                                  (emit-u8 OPC_ASSERT_TRIAD out-rev)))))

      ;; JMP: u8 op, i16 rel, u8 flags=0   (5 bytes)
      ((eq? op 'JMP)
       (let* ((target (cadr f))
              (target-pc (label-pc labels target))
              (pc-after (+ pc 5))
              (rel (- target-pc pc-after)))
         (emit-u8 0 (emit-i16be rel (emit-u8 OPC_JMP out-rev)))))

      ;; JZ: u8 op, u8 reg, i16 rel, u8 flags=0  (5 bytes)
      ((eq? op 'JZ)
       (let* ((test (reg (cadr f)))
              (target (caddr f))
              (target-pc (label-pc labels target))
              (pc-after (+ pc 5))
              (rel (- target-pc pc-after)))
         (emit-u8 0 (emit-i16be rel (emit-u8 test (emit-u8 OPC_JZ out-rev))))))

      (else (error "unknown op in encoder" op)))))

(define (assemble program)
  (let* ((labels (pass1-labels program)))
    (let loop ((xs program) (pc 0) (out-rev '()))
      (if (null? xs)
          (reverse out-rev)
          (let* ((f (car xs))
                 (out2 (encode-form f labels pc out-rev))
                 (pc2 (+ pc (instr-size f))))
            (loop (cdr xs) pc2 out2))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; 7) Write to file (portable-ish)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define (write-bytes-to-file path bytes)
  (let ((p (open-output-file path)))
    (let loop ((xs bytes))
      (if (null? xs)
          (begin (close-output-port p) 'ok)
          (begin
            (write-char (integer->char (car xs)) p)
            (loop (cdr xs))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; 8) Example: vertical slice demo (timing + rr + mux + fold + jump)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define demo-program
  (list
    (list 'label 'start)

    ;; TIME_RD r1 unit=1 (microseconds) flags=0
    (list 'TIME_RD 1 1 0)

    ;; BARRIER_T mode=0 param=250us
    (list 'BARRIER_T 0 250)

    ;; RR_INIT rr_id=1 count=8 flags=0
    (list 'RR_INIT 1 8 0)

    ;; RR_NEXT rr_id=1 dst=r2 flags=0
    (list 'RR_NEXT 1 2 0)

    ;; Open a GLB mux channel with semantic axes:
    ;;   flags4=0
    ;;   a0=STATE a1=ALPHABET a2=LEFT a3=TRANSITION
    (list 'MUX_OPEN (list 'ch 0 'STATE 'ALPHABET 'LEFT 'TRANSITION) FMT_GLB_CHUNK 0)

    ;; Emit a small event payload (kind=7) as string
    (list 'MUX_EVT 7 "hello!!")

    ;; Close channel (flags16=0)
    (list 'MUX_CLOSE (list 'ch 0 'STATE 'ALPHABET 'LEFT 'TRANSITION) 0)

    ;; Fold VM ops (handles assumed already in regs by host/loader):
    ;; CANON r3 <- r3
    (list 'CANON 3 3 0)
    ;; ASSERT_IDEMP r3
    (list 'ASSERT_IDEMP 3 0)

    ;; Loop forever
    (list 'JMP 'start)))

;; Build bytes:
;; (define bytes (assemble demo-program))
;; (write-bytes-to-file "demo.canbc" bytes)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; 9) Notes on integrating with CLBC-POLY codec
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; This assembler only produces the instruction stream.
;; Your loader/runtime can:
;;   - preload registers with poly-handles (interned from CLBC-POLY bytes)
;;   - or you can add future opcodes like POLY_LOAD to pull CLBC-POLY from MUX.
;;
;; For now this matches your plan: new CAN-ISA VM + assembler, keep old CLBC VM.
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
```

If you want, I can add **two missing “make it mechanical” pieces** that you’ll probably want immediately:

1) **A tiny “.canbc container header”** (magic/version/entrypoint/length) so your firmware can sanity-check streams before running them.  
2) **A macro layer** on top of this assembler so you can write higher-level forms like:
- `(with-channel (STATE ALPHABET LEFT TRANSITION) GLB_CHUNK (emit-glb ...))`
- `(fano-triad rA rB rC)` expanding to `MEET/ASSERT_TRIAD` patterns.

Say the word and I’ll extend the file.

---

## You

Yes

---

## ChatGPT

Perfect. I’ll extend this **cleanly and mechanically**, without changing any semantics you’ve already locked.

Below are the **two missing pieces** you asked for, designed to drop directly on top of the assembler you now have.

---

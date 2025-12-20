
```scheme
;; CAN-ISA / RFC-009+0013 Assembler (Scheme)
;; Implements a minimal vertical slice that MECHANICALLY ENFORCES:
;;   - CANON barrier before MEET/JOIN/PROJ_FANO in a block
;;   - PROJ_FANO barrier before COMMIT (optional strict mode)
;;   - RFC-0013 DERIVE domain selector imm16 validation
;;
;; Encoding: CANB 32-bit words, big-endian.
;;   word0 = [ opcode:8 | flags:4 | rdst:4 | imm16:16 ]
;; Optional extra words (u32) may follow per instruction.

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; 0. Utilities
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define (u4? x)  (and (integer? x) (<= 0 x) (<= x 15)))
(define (u16? x) (and (integer? x) (<= 0 x) (<= x #xFFFF)))
(define (u32? x) (and (integer? x) (<= 0 x) (<= x #xFFFFFFFF)))

(define (die . xs) (apply error xs))
(define (expect pred who x)
  (unless (pred x) (die who x)))

(define (u32->be-bytes w)
  (expect u32? 'u32->be-bytes w)
  (let ((b0 (bitwise-and (arithmetic-shift w -24) #xFF))
        (b1 (bitwise-and (arithmetic-shift w -16) #xFF))
        (b2 (bitwise-and (arithmetic-shift w -8)  #xFF))
        (b3 (bitwise-and w #xFF)))
    (bytevector b0 b1 b2 b3)))

(define (bv-append . bvs)
  (let* ((n (apply + (map bytevector-length bvs)))
         (out (make-bytevector n 0)))
    (let loop ((i 0) (xs bvs))
      (if (null? xs) out
          (let* ((bv (car xs))
                 (m (bytevector-length bv)))
            (bytevector-copy! bv 0 out i m)
            (loop (+ i m) (cdr xs)))))))

(define (packI32 opcode flags rdst imm16)
  (expect (lambda (x) (and (integer? x) (<= 0 x) (<= x 255))) 'packI32/opcode opcode)
  (expect u4?  'packI32/flags flags)
  (expect u4?  'packI32/rdst  rdst)
  (expect u16? 'packI32/imm16 imm16)
  (let ((w (bitwise-ior (arithmetic-shift opcode 24)
                        (arithmetic-shift flags 20)
                        (arithmetic-shift rdst 16)
                        imm16)))
    (expect u32? 'packI32/result w)
    w))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; 1. Opcode Table (CANB core + fold slice)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Barriers / control
(define OP_NOP       #x00)
(define OP_CANON     #x01)  ;; canonicalization barrier
(define OP_COMMIT    #x02)  ;; commit barrier / seal

;; Polynomial fold algebra (F₂[x] meet/join)
(define OP_MEET      #x10)  ;; gcd
(define OP_JOIN      #x11)  ;; lcm

;; Visualization projection
(define OP_PROJ_FANO #x20)  ;; project a structure into the Fano plane view layer

;; RFC-0013 derivation overlay
(define OP_DERIVE    #x08)  ;; domain-separated ref derivation

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; 2. IMM16 domains (RFC-0013)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define DOMAIN->IMM16
  '((poly  . #x0001)
    (geom  . #x0002)
    (triad . #x0003)
    (hash  . #x0004)))

(define (lookup-domain-imm16 dom)
  (let ((p (assoc dom DOMAIN->IMM16)))
    (if p (cdr p) (die "RFC-0013: invalid domain symbol" dom))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; 3. Constraint Engine (RFC-009 enforcement)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; We enforce per-basic-block:
;;   - After CANON, fold ops allowed until next barrier (CANON/COMMIT)
;;   - PROJ_FANO requires CANON already in this block (strict)
;;   - COMMIT optionally requires PROJ_FANO already (strict-commit?)
;;
;; State:
;;   canon? : boolean
;;   fano?  : boolean

(define (mk-check-state strict-commit?)
  (vector strict-commit? #f #f)) ;; [strict-commit? canon? fano?]

(define (st-strict? st) (vector-ref st 0))
(define (st-canon?  st) (vector-ref st 1))
(define (st-fano?   st) (vector-ref st 2))
(define (st-set-canon! st v) (vector-set! st 1 v))
(define (st-set-fano!  st v) (vector-set! st 2 v))

(define (barrier-reset! st)
  (st-set-canon! st #f)
  (st-set-fano!  st #f))

(define (require-canon! st opname form)
  (unless (st-canon? st)
    (die "RFC-009: instruction requires prior (canon) barrier in same block"
         opname form)))

(define (require-fano-before-commit! st form)
  (when (st-strict? st)
    (unless (st-fano? st)
      (die "RFC-009: (commit) requires prior (proj-fano ...) in same block (strict mode)"
           form))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; 4. Instruction encoders (emit bytevector)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Common: emit word0 + optional u32 payload words.
(define (emit-word0 opcode flags rdst imm16)
  (u32->be-bytes (packI32 opcode flags rdst imm16)))

(define (emit-u32 w) (u32->be-bytes w))

;; 4.1 (canon [flags])
;; flags: u4, default 0, rdst unused (0), imm16 reserved (0)
(define (asm-canon form st)
  (let* ((flags (if (>= (length form) 2) (cadr form) 0)))
    (expect u4? 'canon/flags flags)
    (barrier-reset! st)
    (st-set-canon! st #t)
    (emit-word0 OP_CANON flags 0 0)))

;; 4.2 (commit [flags])
;; flags: u4, default 0
(define (asm-commit form st)
  (let* ((flags (if (>= (length form) 2) (cadr form) 0)))
    (expect u4? 'commit/flags flags)
    (require-fano-before-commit! st form)
    ;; commit ends the block
    (barrier-reset! st)
    (emit-word0 OP_COMMIT flags 0 0)))

;; 4.3 (derive rdst domain [flags] [ref32])
;; RFC-0013: imm16 = domain selector. optional extra ref32 word.
(define (asm-derive form st)
  (unless (>= (length form) 3)
    (die "derive syntax: (derive rdst domain [flags] [ref32])" form))
  (let* ((rdst   (cadr form))
         (domain (caddr form))
         (flags  (if (>= (length form) 4) (list-ref form 3) 0))
         (ref32  (if (>= (length form) 5) (list-ref form 4) #f))
         (imm16  (lookup-domain-imm16 domain))
         (w0bv   (emit-word0 OP_DERIVE flags rdst imm16)))
    (expect u4? 'derive/rdst rdst)
    (expect u4? 'derive/flags flags)
    ;; DERIVE is allowed before canon; it does not satisfy canon barrier.
    (if ref32
        (begin (expect u32? 'derive/ref32 ref32)
               (bv-append w0bv (emit-u32 ref32)))
        w0bv)))

;; 4.4 (meet rdst ra rb [flags])
;; Enc: word0 = [OP_MEET|flags|rdst|imm16]
;; imm16 packs (ra<<8 | rb)  (8-bit each, but we only allow 0..15 to match reg file)
;; Optional payload: none.
(define (asm-meet form st)
  (unless (>= (length form) 4)
    (die "meet syntax: (meet rdst ra rb [flags])" form))
  (require-canon! st 'meet form)
  (let* ((rdst (cadr form))
         (ra   (caddr form))
         (rb   (cadddr form))
         (flags (if (>= (length form) 5) (list-ref form 4) 0)))
    (expect u4? 'meet/rdst rdst)
    (expect u4? 'meet/ra ra)
    (expect u4? 'meet/rb rb)
    (expect u4? 'meet/flags flags)
    (let* ((imm16 (bitwise-ior (arithmetic-shift ra 8) rb)))
      (emit-word0 OP_MEET flags rdst imm16))))

;; 4.5 (join rdst ra rb [flags])
(define (asm-join form st)
  (unless (>= (length form) 4)
    (die "join syntax: (join rdst ra rb [flags])" form))
  (require-canon! st 'join form)
  (let* ((rdst (cadr form))
         (ra   (caddr form))
         (rb   (cadddr form))
         (flags (if (>= (length form) 5) (list-ref form 4) 0)))
    (expect u4? 'join/rdst rdst)
    (expect u4? 'join/ra ra)
    (expect u4? 'join/rb rb)
    (expect u4? 'join/flags flags)
    (let* ((imm16 (bitwise-ior (arithmetic-shift ra 8) rb)))
      (emit-word0 OP_JOIN flags rdst imm16))))

;; 4.6 (proj-fano rsrc [flags] [triad-a triad-b triad-c])
;; Enc:
;;   word0: opcode=OP_PROJ_FANO, rdst=0, imm16 = (rsrc<<8 | mode)
;; where mode:
;;   0 = simple projection using rsrc only
;;   1 = triad check mode; then 3 payload u32 words follow: (a b c) as Ref32 handles
;;
;; Constraint: requires CANON already in this block.
(define (asm-proj-fano form st)
  (unless (>= (length form) 2)
    (die "proj-fano syntax: (proj-fano rsrc [flags] [a b c])" form))
  (require-canon! st 'proj-fano form)
  (let* ((rsrc (cadr form))
         (flags (if (>= (length form) 3) (list-ref form 2) 0))
         (has-triad? (>= (length form) 6))
         (a (and has-triad? (list-ref form 3)))
         (b (and has-triad? (list-ref form 4)))
         (c (and has-triad? (list-ref form 5))))
    (expect u4? 'proj-fano/rsrc rsrc)
    (expect u4? 'proj-fano/flags flags)
    (let* ((mode (if has-triad? 1 0))
           (imm16 (bitwise-ior (arithmetic-shift rsrc 8) mode))
           (w0   (emit-word0 OP_PROJ_FANO flags 0 imm16)))
      (st-set-fano! st #t)
      (if has-triad?
          (begin
            (expect u32? 'proj-fano/a a)
            (expect u32? 'proj-fano/b b)
            (expect u32? 'proj-fano/c c)
            (bv-append w0 (emit-u32 a) (emit-u32 b) (emit-u32 c)))
          w0))))

;; 4.7 (nop)
(define (asm-nop form st)
  (emit-word0 OP_NOP 0 0 0))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; 5. Dispatcher + Assembler
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define (assemble-instr form st)
  (unless (pair? form) (die "instruction must be a list" form))
  (case (car form)
    ((nop)       (asm-nop form st))
    ((canon)     (asm-canon form st))
    ((commit)    (asm-commit form st))
    ((derive)    (asm-derive form st))
    ((meet)      (asm-meet form st))
    ((join)      (asm-join form st))
    ((proj-fano) (asm-proj-fano form st))
    (else (die "unknown instruction" (car form) form))))

(define (assemble program . opts)
  ;; opts: 'strict-commit? boolean (default #t)
  (let* ((strict-commit? (if (null? opts) #t (car opts)))
         (st (mk-check-state strict-commit?)))
    (apply bv-append (map (lambda (ins) (assemble-instr ins st)) program))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; 6. Example Programs (vertical slice)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Example 1: valid fold block
;; - derives two refs
;; - canon barrier
;; - meet/join
;; - proj-fano with triad payload (3x Ref32)
;; - commit
(define demo-ok
  '((derive 1 poly)                 ; r1 = derived poly ref
    (derive 2 geom 0 #x11223344)    ; r2 = derived geom ref, explicit ref32 payload
    (canon)
    (meet 3 1 2)                    ; r3 = gcd(r1,r2)
    (join 4 1 2)                    ; r4 = lcm(r1,r2)
    (proj-fano 4 0 #xAABBCCDD #x01020304 #xDEADBEEF)
    (commit)))

;; Example 2: invalid (meet without canon) -> assembler error
(define demo-bad
  '((derive 1 poly)
    (meet 2 1 1)
    (commit)))

;; To build:
;; (define bytes (assemble demo-ok #t))
;; (bytevector-length bytes)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; 7. Notes for your VM implementation (ESP32/Pico parity)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
;; Decode word0:
;;   opcode = (w >> 24) & 0xFF
;;   flags  = (w >> 20) & 0x0F
;;   rdst   = (w >> 16) & 0x0F
;;   imm16  =  w        & 0xFFFF
;;
;; For MEET/JOIN:
;;   ra = (imm16 >> 8) & 0xFF   ; you only use 0..15
;;   rb = imm16 & 0xFF
;;
;; For PROJ_FANO:
;;   rsrc = (imm16 >> 8) & 0xFF
;;   mode = imm16 & 0xFF
;;   if mode==1: read 3 more u32 words as Ref32 triad payload.
;;
;; For DERIVE:
;;   imm16 is domain selector (RFC-0013)
;;   if flags bit0 (optional): VM may read following u32 ref32 payload,
;;   otherwise compute ref32 at runtime from seed+VDP.
;;
;; This assembler already enforces the RFC block constraints.
```

### What this gives you right now
- A **real CANB encoder** for: `CANON`, `MEET(GCD)`, `JOIN(LCM)`, `PROJ_FANO`, `COMMIT`, `DERIVE`.
- **Mechanical RFC enforcement** (the compiler refuses illegal fold sequences).
- A clean place to extend for:
  - immediate forms (IMM16 layouts beyond domains),
  - CLBC-POLY container emission,
  - label/jump support (when you add control flow).

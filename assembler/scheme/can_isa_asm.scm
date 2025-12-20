#lang racket
(require racket/match
         racket/list
         racket/bytes
         "canbc.scm")

(provide assemble-can
         emit-demo-canbc)

;; ----------------------------
;; Opcode constants
;; ----------------------------
(define OPC/HALT        #x0)
(define OPC/CANON       #x1)
(define OPC/MEET        #x2)
(define OPC/JOIN        #x3)
(define OPC/PROJ_FANO   #x4)
(define OPC/POLY_LOAD   #x5)
(define OPC/ASSERT_EQ   #x6)
(define OPC/ASSERT_IDEM #x7)
(define OPC/JMP         #x8)
(define OPC/JZ          #x9)
(define OPC/JNZ         #xA)
(define OPC/EXT         #xF)

(define EXT/LI          #x0)
(define EXT/JMP16       #x1)
(define EXT/PCREL16     #x2)
(define EXT/POLY_LOAD16 #x3)

;; ----------------------------
;; Encoding
;; ----------------------------
(define (u16 x)
  (unless (and (integer? x) (<= 0 x #xFFFF))
    (error 'u16 "bad u16: ~a" x))
  x)

(define (enc-r op rd ra rb)
  (u16 (bitwise-ior (arithmetic-shift op 12)
                    (arithmetic-shift rd 8)
                    (arithmetic-shift ra 4)
                    rb)))

(define (enc-i8 op rd imm8)
  (u16 (bitwise-ior (arithmetic-shift op 12)
                    (arithmetic-shift rd 8)
                    (bitwise-and imm8 #xFF))))

(define (enc-cond op ra off8)
  (u16 (bitwise-ior (arithmetic-shift op 12)
                    (arithmetic-shift ra 8)
                    (bitwise-and off8 #xFF))))

(define (enc-ext extop rd ra imm16)
  (list (u16 (bitwise-ior (arithmetic-shift OPC/EXT 12)
                          (arithmetic-shift extop 8)
                          (arithmetic-shift rd 4)
                          ra))
        (u16 (bitwise-and imm16 #xFFFF))))

;; ----------------------------
;; Assembly AST
;; ----------------------------
;; instruction forms:
;;   '(HALT)
;;   '(CANON rd ra)
;;   '(MEET rd ra rb)
;;   '(JOIN rd ra rb)
;;   '(PROJ_FANO rd mode8)
;;   '(POLY_LOAD rd idx8)
;;   '(ASSERT_EQ ra rb)
;;   '(ASSERT_IDEM ra)
;;   '(JMP label)
;;   '(JZ ra label)
;;   '(JNZ ra label)
;;   '(LI rd imm16)   ; EXT
;; labels:
;;   '(LABEL name)

(define (reg x)
  (unless (and (integer? x) (<= 0 x 15)) (error 'reg "bad reg: ~a" x))
  x)

(define (imm8 x)
  (unless (and (integer? x) (<= 0 x 255)) (error 'imm8 "bad imm8: ~a" x))
  x)

(define (imm16 x)
  (unless (and (integer? x) (<= 0 x 65535)) (error 'imm16 "bad imm16: ~a" x))
  x)

;; ----------------------------
;; Pass 1: label addresses (in words)
;; ----------------------------
(define (instr-size i)
  (match i
    [(list 'LABEL _) 0]
    [(list 'LI _ _) 2]
    [_ 1]))

(define (pass1 prog)
  (define pc 0)
  (define labels (make-hash))
  (for ([i (in-list prog)])
    (match i
      [(list 'LABEL name)
       (when (hash-has-key? labels name)
         (error 'pass1 "duplicate label: ~a" name))
       (hash-set! labels name pc)]
      [_ (set! pc (+ pc (instr-size i)))]))
  labels)

;; signed off8 = target - (pc+1)
(define (off8-for labels pc label)
  (define tgt (hash-ref labels label (λ () (error 'assemble "unknown label: ~a" label))))
  (define delta (- tgt (+ pc 1)))
  (when (or (< delta -128) (> delta 127))
    (error 'assemble "branch out of range for OFF8 (pc ~a -> ~a = ~a)" pc tgt delta))
  (bitwise-and delta #xFF))

;; ----------------------------
;; Pass 2: encode to u16 list
;; ----------------------------
(define (assemble-can prog #:entry [entry 0])
  (define labels (pass1 prog))
  (define pc 0)
  (define words '())
  (define symb '()) ; (cons name-bytes pc)
  (define (emit w)
    (set! words (append words w))
    (set! pc (+ pc (length w))))
  (for ([i (in-list prog)])
    (match i
      [(list 'LABEL name)
       (set! symb (cons (cons (string->bytes/utf-8 (symbol->string name))
                              pc)
                        symb))]
      [(list 'HALT)
       (emit (list (enc-r OPC/HALT 0 0 0)))]
      [(list 'CANON rd ra)
       (emit (list (enc-r OPC/CANON (reg rd) (reg ra) 0)))]
      [(list 'MEET rd ra rb)
       (emit (list (enc-r OPC/MEET (reg rd) (reg ra) (reg rb))))]
      [(list 'JOIN rd ra rb)
       (emit (list (enc-r OPC/JOIN (reg rd) (reg ra) (reg rb))))]
      [(list 'PROJ_FANO rd mode)
       (emit (list (enc-i8 OPC/PROJ_FANO (reg rd) (imm8 mode))))]
      [(list 'POLY_LOAD rd idx)
       (emit (list (enc-i8 OPC/POLY_LOAD (reg rd) (imm8 idx))))]
      [(list 'ASSERT_EQ ra rb)
       (emit (list (enc-r OPC/ASSERT_EQ 0 (reg ra) (reg rb))))]
      [(list 'ASSERT_IDEM ra)
       (emit (list (enc-r OPC/ASSERT_IDEM 0 (reg ra) 0)))]
      [(list 'JMP label)
       (define off (off8-for labels pc label))
       (emit (list (enc-cond OPC/JMP 0 off)))]
      [(list 'JZ ra label)
       (define off (off8-for labels pc label))
       (emit (list (enc-cond OPC/JZ (reg ra) off)))]
      [(list 'JNZ ra label)
       (define off (off8-for labels pc label))
       (emit (list (enc-cond OPC/JNZ (reg ra) off)))]
      [(list 'LI rd imm)
       (emit (enc-ext EXT/LI (reg rd) 0 (imm16 imm)))]
      [else
       (error 'assemble-can "unknown instruction: ~a" i)]))
  (values words entry (reverse symb)))

;; ----------------------------
;; Emit .canbc container
;; ----------------------------
(define (emit-demo-canbc out-path poly-blobs)
  ;; poly-blobs: list of bytes (raw CLBC-POLY encodings)
  (define prog
    (list
     '(LABEL entry)
     '(POLY_LOAD 1 0)      ; R1 = P0
     '(POLY_LOAD 2 1)      ; R2 = P1
     '(CANON 1 1)          ; R1 = canon(R1)
     '(CANON 2 2)          ; R2 = canon(R2)
     '(MEET 3 1 2)         ; R3 = gcd(R1,R2)
     '(JOIN 4 1 2)         ; R4 = lcm(R1,R2)
     '(PROJ_FANO 3 0)      ; project gcd
     '(PROJ_FANO 4 0)      ; project lcm
     '(ASSERT_IDEM 3)      ; projections should be stable after CANON in your VM
     '(ASSERT_IDEM 4)
     '(HALT)))

  (define-values (words entry symb) (assemble-can prog #:entry 0))

  ;; VM profile
  (define vmpr (sec-vmpr #x43414E31 16 16)) ; "CAN1", 16 regs, 16-bit words

  ;; CODE
  (define code (sec-code words entry))

  ;; POLY constant pool (sorted deterministically by sec-poly)
  (define poly (sec-poly poly-blobs))

  ;; SYMB
  (define symb-sec (sec-symb symb))

  ;; DGST placeholder (filled by canbc->bytes)
  (define dgst (sec-dgst #x01 #x01 (make-bytes 32 0)))

  (define c (make-canbc #:vmpr vmpr #:code code #:poly poly #:symb symb-sec #:dgst dgst))
  (canbc-write out-path c)
  out-path)

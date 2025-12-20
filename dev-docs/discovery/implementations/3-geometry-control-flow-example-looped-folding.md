# 3) Geometry + Control Flow Example (Looped Folding)

This program repeatedly:
- CANON
- FOLD-A6
- PROJ-FANO
- waits for a timing barrier
- loops

```scheme
(define CLASS-TIME #x2)

(define TIME-OPS
  '((TIME_RD   . #x0)  ;; dst = time_low16 (for now)
    (WAIT      . #x1)  ;; wait imm16 ticks
    (BARRIER_T . #x2))) ;; enforce "analog constraint" boundary

(define (time-op x) (lookup TIME-OPS x))

(define (TIME op src dst)
  (encode-instr CLASS-TIME (time-op op) (reg src) (reg dst)))

(define prog-fold-loop
  (list
   '(label start)

   ;; Normalize state in R0
   `(ins ,(GEOM 'CANON 'R0 'R0))

   ;; A6 "cubic fold" -> produce new state in R1
   `(ins ,(GEOM 'FOLD-A6 'R0 'R1))
   `(ins ,(GEOM 'CANON   'R1 'R1))

   ;; Project to Fano (visual event basis) in R2
   `(ins ,(GEOM 'PROJ-FANO 'R1 'R2))

   ;; Physical constraint: barrier + wait
   `(ins ,(TIME 'BARRIER_T 'R0 'R0))
   `(ins2 ,(TIME 'WAIT 'R0 'R0) 1024) ;; imm16 ticks

   ;; Jump back
   `(ins2 ,(CTRL 'JMP 'R0 'R0) (rel start))

   ;; never reached
   `(ins ,(CTRL 'HALT 'R0 'R0))))
```

Compile to bytes:

```scheme
(define bytes (assemble prog-fold-loop))
bytes
```

---

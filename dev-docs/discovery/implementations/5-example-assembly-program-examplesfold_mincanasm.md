# 5) Example Assembly Program — `examples/fold_min.canasm`

This is the minimal “vertical slice” you asked for:  
**CANON + MEET + JOIN + PROJ_FANO + ASSERT_IDEMP + COMMIT + EMIT_GEOM**

```scheme
;; examples/fold_min.canasm
;;
;; Register conventions in this example:
;; R0 = input poly (loaded by VM via object pool at REF32)
;; R1 = canon(R0)
;; R2 = meet(R1,R1)   (trivial gcd)
;; R3 = join(R1,R1)   (trivial lcm)
;; R4 = proj_fano(R1)
;;
;; REF32 used here:
;; - first instruction uses REF32=1 meaning "load poly object #1 into R0" (VM-specific)
;;
;; NOTE: loader semantics are VM-implementation specific; we keep it simple:
;; Use CANON with REF32 to indicate "Ra refers to object pool index".

(inst CANON (flags canon_out proof)  1 0 0 0     1)     ;; R1 := canon(R0)   (R0 preloaded from object 1)
(inst MEET  (flags canon_out proof)  2 1 1 0     0)     ;; R2 := gcd(R1,R1)
(inst JOIN  (flags canon_out proof)  3 1 1 0     0)     ;; R3 := lcm(R1,R1)

(inst PROJ_FANO (flags proof)        4 1 0 0     0)     ;; R4 := proj_fano(R1)

(inst ASSERT_IDEMP (flags proof)     0 1 0 #x0030 0)    ;; assert proj_fano(proj_fano(x))=proj_fano(x) on x=R1

(inst COMMIT (flags proof)           0 4 0 0     0)     ;; commit projected state (R4)
(inst EMIT_GEOM (flags emit)         0 4 0 0     0)     ;; emit geometry events from R4
```

---

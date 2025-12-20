# 12.4 End-to-End Example Program (Vertical Slice)

This is a minimal “safe self-mod + viz events” artifact:

- Opens MUX channel 1 (type=VIZ)
- Begins a patch (id 42 len 4) and writes 4 bytes
- Seals patch
- **Gates apply** with RR_BARRIER + BARRIER_T
- Applies patch to `target`
- Emits a MUX event “APPLIED”
- Halts

```scheme
(define demo
  '(program
     (section text)

     (label entry)

     ;; MUX channel 1 for visualization/log events
     (mux.open #:ch 1 #:type 1 #:flags 0)

     ;; Round-robin init (4 lanes, owner=0)
     (rr.init #:n 4 #:owner 0 #:reset-epoch #t)

     ;; Prepare patch: id=42, len=4 bytes, owner=0
     (patch.begin #:id 42 #:len 4 #:owner 0)

     ;; Write 4 bytes at offset 0 (example machine bytes)
     ;; (These bytes are placeholders; you’ll use actual CAN-ISA words/bytes later.)
     (patch.write #:off 0 #:bytes 1 2 3 4)

     ;; Seal patch (requires full length written)
     (patch.seal)

     ;; Gate BEFORE apply
     (barrier.rr #:caller r1 #:strict #t #:mask equal)
     (barrier.t  #:strict #t #:couple-rr #t #:phase 0)

     ;; Apply to target label address
     (patch.apply #:addr (label-ref target))

     ;; Emit event "APPLIED" (tag=0xA1)
     (mux.evt #:ch 1 #:tag 161 #:bytes 65 80 80 76 89 69 68) ; "APPLIED"

     (label target)
     (nop)

     (mux.close #:ch 1)
     (halt)))
```

To build:

```scheme
(define words (assemble-program demo))
;; words is a list of u16 values in output order
```

---

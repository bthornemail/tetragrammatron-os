# 3️⃣ Minimal Vertical Slice (End-to-End)

```scheme
(define program
  (list
    (label start)

    (TIME_RD 1 1 0)
    (timed-barrier 500)

    (circulate 1 8 2)

    (with-channel
      (STATE ALPHABET LEFT TRANSITION)
      FMT_GLB_CHUNK
      (emit-bytes "vertex")
      (emit-bytes "index"))

    (fano-triad 3 4 5 6)

    (JMP start)))
```

Then:

```scheme
(define raw (assemble program))
(define canbc (canbc-wrap raw 0))
(write-bytes-to-file "tetragrammatron.canbc" canbc)
```

---

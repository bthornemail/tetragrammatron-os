# 15.10 Minimal MUX demo program

```scheme
(program
  (mux.open #:id 1 #:kind 'SVG_LINESET #:flags 0 #:meta META_CANVAS_Q16)
  (time.rd #:rd r1 #:mode 0)

  ;; emit a Fano-triad as 3 lines (example coords)
  (mux.evt #:id 1 #:chan 'GEOM_2D #:ts r1
           #:payload (svg.lineset
                      (line -65536 0   65536 0)
                      (line 0 -65536   0 65536)
                      (line -65536 -65536  65536 65536)))

  (mux.close #:id 1 #:flags 'EMIT_FINAL_HASH))
```

---

If you say **“16”**, I’ll do **PATCH_* self-modifying blocks** (safe, barrier-gated), including:
- binary encodings,
- “sealed patch” hashing compatible with CLBC-POLY canonical bytes,
- and the rule that patch application must preserve **Fano consistency** (your merge invariant, but at VM level).

---

## You

16

---

## ChatGPT

## 16) PATCH semantics (safe self-modifying blocks) + binary encodings

This is the **circulation/self-modification** layer you asked for: a patch system that lets the VM rewrite code/data **without breaking determinism**, and only when the rewrite is *provably safe* under your invariants (Fano consistency + canonical hashing + time barriers).

Think of PATCH as: **“sealed diff objects”** applied under a **barrier**, with **content-addressed identity** (CLBC-POLY style canonical bytes → hash).

---

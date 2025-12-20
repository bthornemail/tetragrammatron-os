# 5) The Mechanical Safety Verifier (Assembler Pass)

This is the key: the assembler rejects programs where `patch.apply` isn’t gated.

## 5.1 Basic Block Model
A “basic block” begins:
- at program start
- after any label
- after any control-flow instruction (`jmp/jz/call/ret/halt`)
- optionally after any `barrier.*` (recommended; it makes adjacency strict)

A “gate adjacency” requirement means:
- in the same basic block,
- the immediately preceding *non-annotation* instruction(s) must match a required pattern.

## 5.2 Required Pattern for PATCH_APPLY
Minimum:
- **prev instruction** must be `(barrier.rr #:strict #t ...)`

Recommended stronger form:
- either:
  - prev is `(barrier.t #:strict #t #:couple-rr #t)` and prevprev is `(barrier.rr #:strict #t ...)`
  - OR if you want strict ordering: RR then T then APPLY (fixed sequence)

We enforce the strict ordering because it’s easier to reason about:

**Rule A (normative in assembler):**
```
... (barrier.rr #:strict #t ...) (barrier.t #:strict #t #:couple-rr #t) (patch.apply ...)
```

**Rule B (allowed fallback):**
```
... (barrier.rr #:strict #t ...) (patch.apply ...)
```

If Rule A fails and Rule B fails: assembler errors out.

## 5.3 Additional checks (recommended)
- `patch.write` requires a preceding `patch.begin` not yet sealed/aborted (state machine)
- `patch.apply` requires that a `patch.seal` occurred earlier in same function or globally before apply (depending on your model)
- target address must be within declared patch segment (assembler can’t fully know segments unless provided; but it can check label is in `(section text)` and aligned)

---

# 16.10 Scheme assembler surface spec (mechanical enforcement)

A Scheme assembler MUST enforce:
- `PATCH_APPLY` only allowed in code when there is a preceding `BARRIER_T` region in control flow.
- `PATCH_SEAL` must happen before `PATCH_APPLY`.
- If `ALLOW_CODE` is not set at BEGIN, assembler MUST reject any WRITE targeting CODE.

Example syntax:

```scheme
(patch.begin  #:id 0 #:policy 'strict #:flags '(allow-move))
(patch.write  #:id 0 #:type 'write #:space 'data #:addr #x00012000
              #:bytes (u8 1 2 3 4 5))
(patch.seal   #:id 0 #:hash-reg 2)
(barrier.t    #:mode 'strict)
(patch.apply  #:id 0 #:hash-reg 2 #:flags '(atomic emit))
```

Assembler MUST also emit canonical patch bytes for SEAL (same canonical format as 16.8).

---

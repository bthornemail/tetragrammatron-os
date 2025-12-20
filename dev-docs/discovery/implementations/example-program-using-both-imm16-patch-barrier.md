# Example program using both (IMM16 + PATCH + barrier)

```scheme
(define prog
  (list
    '(IMM16 r10 #x1234)              ; r10 := 0x1234 (maybe patch id or hash seed)
    '(PATCH_BEGIN 1)                 ; patch region id=1
    '(PATCH_WRITE16 1 0 #x2001)      ; write imm16 word at offset 0
    '(PATCH_WRITE16 1 1 #xFF00)      ; write imm16 word at offset 1
    '(PATCH_SEAL 1 r10)              ; seal with r10 as hash/key source
    '(BARRIER_FANO r1 r2 r3)         ; required gate
    '(PATCH_APPLY 1)                 ; apply only after barrier
    '(HALT)))
```

Assembled bytes remain canonical and the disassembler will emit exactly these forms back.

---

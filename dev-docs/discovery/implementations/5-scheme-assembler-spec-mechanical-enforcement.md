# 5. Scheme Assembler Spec (Mechanical Enforcement)

## 5.1 Input S-expression grammar (minimal)
```scheme
(program
  (canon  r4 r1)
  (meet   r6 r4 r5)
  (fano.s r3 r4 r5)
  (assert.eq r0 r6)
  (sys halt))
```

## 5.2 Mechanical rules (MUST)
- Registers MUST be `r0..r7`
- `canon` MUST be `(canon rd ra)` and MUST set `rb=0 imm3=0`
- `meet/join` MUST be `(meet rd ra rb)` `(join rd ra rb)` and MUST set `imm3=0`
- `assert.eq` MUST be `(assert.eq ra rb)` and MUST encode `rd=0 imm3=0`
- `fano.s` MUST be `(fano.s rc ra rb [mode])`
  - If `mode` omitted, assembler MUST encode `imm3=0` (strict)
- `sys halt` MUST encode `(op=0 rd=0 ra=0 rb=0 imm3=1)`

Assembler MUST reject any form that violates reserved bits, because reserved bits are where nondeterminism sneaks in over time.

---

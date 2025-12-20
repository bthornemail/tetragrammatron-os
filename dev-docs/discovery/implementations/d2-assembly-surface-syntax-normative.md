# D.2 Assembly Surface Syntax (Normative)

Assembler input is a list of instruction forms:

### Basic form
```scheme
(OPNAME A B IMM)
```

### Convenience forms (optional but recommended)
```scheme
(DEF name value)            ; symbolic constant (value is exact integer)
(LABEL name)                ; label anchor (PC in words)
(JMP label)                 ; expanded macro (if you later add OP_JMP)
```

For this appendix we implement the **basic form** + `DEF` constants.

Registers are written as symbols:
- `r0`..`r15`

Immediates may be:
- exact integers (decimal)
- hex integers as Scheme numbers (`#x1234`)
- defined symbols via `DEF`

---

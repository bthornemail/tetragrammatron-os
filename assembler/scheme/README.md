# CAN-ISA Scheme Assembler

## Role B: COMPILER / VM IMPLEMENTER

This is the normative Scheme assembler for CAN-ISA, implementing:

- **RFC-009 Appendix D** — Scheme Assembler (Normative)

## Usage

```scheme
(load "can_asm.scm")

;; Define a program
(define program
  '((DEF COMMIT_DEFAULT #x0000)
    (CANON states states #x0000)
    (MEET_GCD transition states #x0000)
    (COMMIT r0 r0 COMMIT_DEFAULT)))

;; Assemble to bytecode
(define bytes (assemble program))

;; Write to file
(write-bytes "output.canbc" bytes)
```

## Features

- ✅ 32-bit fixed-width instruction encoding
- ✅ Big-endian byte output
- ✅ Semantic register keywords (states, alphabet, etc.)
- ✅ Numeric registers (r0..r15)
- ✅ imm16 layout validation per opcode
- ✅ DEF constant support

## Opcodes Supported

All opcodes from RFC-009 Appendix A:
- NOOP, HALT, CANON, COMMIT
- LDI16H, LDI16L, USEI32
- MEET_GCD, JOIN_LCM, SWAP, CLEAR
- PROJ_FANO, EMIT_NODE, EMIT_EDGE, LIFT_3D
- ASSERT_CANON, ASSERT_IDEMP, ASSERT_FANO

## Invariants Enforced

- ✅ Instruction word format: opcode8 | A4 | B4 | imm16
- ✅ imm16 validation per opcode (RFC-009 Appendix D.4)
- ✅ Register range checking (0..15)
- ✅ Deterministic output (same input → same bytes)

## RFC References

- RFC-009 Appendix D — Scheme Assembler specification
- RFC-009 Appendix A — Opcode table
- RFC-009 §X.6.1 — Instruction encoding format




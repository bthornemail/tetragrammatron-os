# CANB v1 Binary Encoding Specification

**Status:** Normative  
**Agent:** Agent 2 — CAN-ISA / BINARY ENCODING ENGINEER (`CAN-BIT-TRUTH`)  
**Implements:** RFC-0012, RFC-0012 Appendix B

---

## Overview

This document summarizes the CANB v1 binary encoding implementation for Tetragrammatron-OS.

---

## Instruction Format

All instructions are **32 bits** (4 bytes), big-endian:

```
31          24 23        20 19   16 15        0
+--------------+------------+-------+----------+
|   OPCODE     |     A      |   B   |   IMM16  |
+--------------+------------+-------+----------+
```

- **OPCODE** (8 bits): Instruction operation code (RFC-0009 Appendix A)
- **A** (4 bits): Destination register, source register, or channel (0..15)
- **B** (4 bits): Source register, flags, or kind selector (0..15)
- **IMM16** (16 bits): Immediate value (RFC-0012 Appendix B interpretation)

---

## Opcode Assignments

### Control Flow
- `0x00` — NOOP
- `0x01` — HALT

### Canonicalization
- `0x10` — CANON
- `0x60` — COMMIT

### Immediate Construction
- `0x40` — LDI16H
- `0x41` — LDI16L
- `0x42` — USEI32

### Lattice Operations
- `0x20` — MEET_GCD
- `0x21` — JOIN_LCM
- `0x50` — SWAP
- `0x51` — CLEAR

### Fano Projection
- `0x30` — PROJ_FANO
- `0x70` — EMIT_NODE
- `0x71` — EMIT_EDGE
- `0x72` — LIFT_3D

### Assertions
- `0x80` — ASSERT_CANON
- `0x81` — ASSERT_IDEMP
- `0x82` — ASSERT_FANO

### Time and Barriers (RFC-0013)
- `0x64` — TIME_RD
- `0x65` — TIME_DIV
- `0x66` — WAIT
- `0x67` — BARRIER_T

---

## imm16 Validation

The `validate_imm16()` function validates the immediate field per opcode:

- **MUST be zero:** NOOP, HALT, CANON, USEI32, MEET_GCD, JOIN_LCM, SWAP, ASSERT_CANON, TIME_RD
- **Opcode-specific:** COMMIT, CLEAR, PROJ_FANO, ASSERT_IDEMP, ASSERT_FANO, EMIT_NODE, EMIT_EDGE, LIFT_3D
- **Must be > 0:** TIME_DIV, BARRIER_T
- **Any value:** LDI16H, LDI16L, WAIT

See `RFC-0012-APPENDIX-B-imm16-layouts.md` for complete specifications.

---

## Round-Trip Encoding

All instructions MUST satisfy:

```
Decode(Encode(opcode, A, B, imm16)) = (opcode, A, B, imm16)
```

This preserves RFC-0000 CAN-INV-3 (Decode/Encode Soundness).

---

## Implementation Files

- `can_codec.h` — Header with encoding/decoding functions
- `can_codec.c` — Implementation with validation logic

---

## Compliance

- ✅ Byte-identical determinism (RFC-0012 §7.1)
- ✅ CLBC-POLY compatibility (RFC-0012 §5.2)
- ✅ Round-trip encode/decode (RFC-0000 CAN-INV-3)
- ✅ All opcode layouts match RFC-0009 Appendix A
- ✅ imm16 validation per RFC-0012 Appendix B

---

**Last Updated:** 2025-01-XX  
**Maintained by:** Agent 2 — CAN-ISA / BINARY ENCODING ENGINEER


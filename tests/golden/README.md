# Golden Test Vectors

**Status:** Normative  
**Agent:** Agent 2 — CAN-ISA / BINARY ENCODING ENGINEER (`CAN-BIT-TRUTH`)  
**Implements:** RFC-0012 - Canonical test vectors for regression testing

---

## Overview

This directory contains golden test vectors for CAN-ISA binary encoding. Each vector represents a canonical instruction encoding that can be used for:

- Regression testing
- Implementation verification
- Cross-platform validation
- Documentation examples

---

## Test Vector Format

Each test vector contains:

- **Name** — Opcode mnemonic
- **Description** — Human-readable description
- **Opcode** — Instruction opcode (RFC-0009 Appendix A)
- **A** — Register A field (0..15)
- **B** — Register B field (0..15)
- **imm16** — Immediate value (RFC-0012 Appendix B)
- **Expected Bytes** — 4-byte big-endian encoding

---

## Usage

```c
#include "test_vectors.h"

// Get test vector for an opcode
const can_test_vector_t* vec = get_test_vector_by_opcode(0x20);  // MEET_GCD

// Verify encoding
can_inst_t inst = {vec->opcode, vec->A, vec->B, vec->imm16};
uint8_t bytes[4];
encode_inst_bytes(&inst, bytes);

// Compare with expected
if (memcmp(bytes, vec->expected_bytes, 4) == 0) {
  // Encoding matches golden vector
}
```

---

## Test Vectors

22 vectors covering all opcodes:

- Control: NOOP, HALT
- Canonicalization: CANON, COMMIT
- Immediate: LDI16H, LDI16L, USEI32
- Lattice: MEET_GCD, JOIN_LCM, SWAP, CLEAR
- Fano: PROJ_FANO, EMIT_NODE, EMIT_EDGE, LIFT_3D
- Assertions: ASSERT_CANON, ASSERT_IDEMP, ASSERT_FANO
- Time: TIME_RD, TIME_DIV, WAIT, BARRIER_T

---

## RFC Compliance

- ✅ All vectors match RFC-0009 Appendix A opcodes
- ✅ All encodings match RFC-0012 §3.2 format
- ✅ All imm16 values match RFC-0012 Appendix B layouts
- ✅ Big-endian byte ordering (RFC-0012 §7.1)

---

**Last Updated:** 2025-01-XX  
**Maintained by:** Agent 2 — CAN-ISA / BINARY ENCODING ENGINEER




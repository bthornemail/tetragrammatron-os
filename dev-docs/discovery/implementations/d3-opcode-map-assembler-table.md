# D.3 Opcode Map (Assembler Table)

This assembler expects the CAN-ISA subset used in RFC-009:

```scheme
CANON           0x02
COMMIT          0x03
LDI16H          0x10
LDI16L          0x11
USEI32          0x12
MEET_GCD        0x20
JOIN_LCM        0x21
CLEAR           0x23
PROJ_FANO       0x30
EMIT_NODE       0x31
EMIT_EDGE       0x32
LIFT_3D         0x33
ASSERT_CANON    0x40
ASSERT_IDEMP    0x41
ASSERT_FANO     0x42
```

(You can extend this table without touching the encoder.)

---

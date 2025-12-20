# D.6 Mechanical Guarantees (What this enforces)

- Any accidental non-zero `imm16` on a “MUST be zero” opcode becomes an immediate assembler error.
- Any unknown flag bit becomes an error.
- Fano indices are range checked (0..6).
- The output stream is fully deterministic: same forms → same bytes.

---

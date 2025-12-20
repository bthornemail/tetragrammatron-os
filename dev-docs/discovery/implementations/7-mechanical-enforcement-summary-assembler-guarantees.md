# 7) Mechanical Enforcement Summary (Assembler Guarantees)

With this assembler:

- You literally **cannot assemble** a binary that applies a patch unless the gating barriers are present and adjacent.
- That makes your “self-modifying code” **capability-safe** without needing an OS or MMU.
- On ESP32/Pico, your VM can still re-check at runtime (defense in depth), but your build pipeline already prevents bad programs.

---

# RFC-009 Appendix A — CANBC Container v1 (CLBC-style, Polynomial-aware)

## A.1 Goals (Normative)

1. A CANBC file **MUST** be byte-for-byte deterministic given the same logical program.
2. Integers in CANBC **MUST** be encoded big-endian (network byte order).
3. Sections **MUST** be length-delimited and skippable by unknown readers.
4. A program **MUST** be executable without needing JSON/YAML; metadata is optional.
5. Polynomial payloads **MUST** use the existing CLBC-POLY encoding verbatim when embedded.

---

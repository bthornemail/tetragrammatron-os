# C.1 Design Goals (Normative)

A `.canbc` file MUST:

1. Be **self-delimiting** (length fields, no sentinel scanning)
2. Be **forward compatible** (section table with types + lengths)
3. Support **byte-identical hashing** (canonical ordering, fixed endianness)
4. Embed **CLBC-POLY bytes as-is** (no re-encoding)
5. Allow **streaming parse** on microcontrollers (single pass, minimal RAM)

---

# C.7 Deterministic Ordering Rules (Normative)

To ensure byte-identical hashing across builds, a writer MUST:

1. Emit sections in ascending `stype` order (0x01,0x02,0x03,...)
2. Within POLYPOOL, sort entries by `poly_id` ascending
3. Within SYMTAB, sort entries lexicographically by string (or by `name_off` after sorting strings)
4. Use **zero padding bytes** only

---

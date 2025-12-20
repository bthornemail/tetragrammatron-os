# A.4 Section Record (12 bytes header + payload)

Each section is:

| Offset | Size | Name     | Type  | Meaning |
|-------:|-----:|----------|-------|---------|
| 0      | 4    | tag      | ASCII | Section identifier |
| 4      | 2    | sflags   | u16   | Section flags (tag-specific) |
| 6      | 2    | align    | u16   | Payload alignment requirement (power of two). 0 or 1 means no alignment. |
| 8      | 4    | length   | u32   | Payload bytes (not including this 12-byte header) |
| 12     | L    | payload  | bytes | Section content |

**Alignment rule:** if `align > 1`, the start of payload **MUST** be aligned relative to file start by adding zero padding *between* previous payload end and this section header as needed. Padding bytes **MUST** be 0x00.

Unknown tags: readers **MUST** skip using `length`.

---

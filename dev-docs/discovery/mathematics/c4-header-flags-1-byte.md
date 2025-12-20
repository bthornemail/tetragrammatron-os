# C.4 Header Flags (1 byte)

`flags` bits:

- bit0 `HAS_SYMTAB` — section type 0x02 present
- bit1 `HAS_POLYPOOL` — section type 0x03 present
- bit2 `HAS_VIZSEED` — section type 0x04 present
- bit3 `HAS_PROOFSEED` — section type 0x05 present
- bit4..7 reserved (MUST be 0)

A writer MUST set bits consistently with sections present.
A reader MUST ignore unknown flag bits only if it also can skip unknown section types (it can).

---

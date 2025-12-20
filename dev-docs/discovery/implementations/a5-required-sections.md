# A.5 Required Sections

A CANBC program **MUST** include:

## A.5.1 `CODE` — ISA word stream (required)

Payload:

| Field | Type | Meaning |
|------|------|---------|
| code_words | u32 | number of 16-bit instruction words |
| entry_pc   | u32 | entrypoint PC measured in **words** |
| words      | u16[code_words] | instruction stream |

Encoding:
- `words[i]` are serialized big-endian u16.
- PC counts words (not bytes).

### CODE sflags (u16)
- bit0 `0x0001` — EXT_WORDS_USED (informational)
- bit1 `0x0002` — SELF_PATCH_ALLOWED (policy hint; VM may still refuse)
- rest reserved = 0

## A.5.2 `VMPR` — VM profile (required)

Payload:

| Field | Type | Meaning |
|------|------|---------|
| isa_id     | u32 | MUST be 0x43414E31 ("CAN1") for CAN-ISA v1 words |
| reg_count  | u16 | e.g. 16 |
| word_bits  | u16 | MUST be 16 |
| reserved   | u32 | MUST be 0 |

---

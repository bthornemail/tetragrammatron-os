# A.8 Minimal Example (Layout)

A tiny file with just VMPR + CODE (+DGST) might look like:

- Header: `"CLBC" 'C' 01 ring=01 flags=01`
- Sections:
  - VMPR (CAN1, regs=16, word_bits=16)
  - CODE (words + entry)
  - DGST (sha256)

If you want, I can generate an explicit **hex dump** for your `prog-fold-loop` once you tell me:
- entry_pc (usually 0)
- whether you want SYMB included (labels) or not

…but you don’t need that to start implementing the reader/writer.

---

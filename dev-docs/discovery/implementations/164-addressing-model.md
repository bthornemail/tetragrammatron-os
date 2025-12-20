# 16.4 Addressing model

All patch targets are expressed as `(space_id, base, len)` where:

- `space_id` (u8): which memory space:
  - `0x00` CODE (executable)
  - `0x01` DATA (mutable)
  - `0x02` CONST (read-only unless explicitly enabled)
  - `0x03` MUX_META (renderer metadata)
- `base` (u32): byte address (or word address if your VM is worded; choose one and freeze it)
- `len`  (u32): byte length

Canonical assumption below: **byte addressing**.

---

# 16.6 CAN-ISA v1 opcode encodings (major 0xF, PATCH subfamily)

We reserve major opcode family `0xF` for “EXT/SYSTEM”. PATCH is a subfamily.

16-bit instruction word recap:

```
bits: 15..12  11..8  7..4   3..0
      OPC      A      B      C
```

Use:
- `OPC=0xF` for system/ext
- `C` selects PATCH op

### 16.6.1 PATCH_BEGIN
Creates/clears an in-flight patch builder in a patch register slot.

```
word0: [OPC=0xF | A=patch_id | B=0 | C=0x0]
word1: imm16 = flags
word2: imm16 = policy_id
```

- `patch_id` (0..15) selects a patch builder slot.
- `policy_id` references a policy table (default 0 = strict).
- flags:
  - bit0 `ALLOW_CODE` (if 0, patching CODE space MUST be rejected)
  - bit1 `ALLOW_CONST`
  - bit2 `ALLOW_MOVE`
  - others reserved

### 16.6.2 PATCH_WRITE
Append a record to the in-flight patch.

```
word0: [OPC=0xF | A=patch_id | B=rec_type | C=0x1]
word1: imm16 = space_id (low8 used)
word2: imm16 = addr_hi16
word3: imm16 = addr_lo16
word4: imm16 = len_words   ; number of 16-bit payload words to follow
word5..: payload words
```

`rec_type` (B field):
- `0x0` WRITE
- `0x1` FILL
- `0x2` MOVE (optional)

For WRITE:
- payload is raw bytes packed into 16-bit words (big-endian canonical bytes).

For FILL:
- payload:
  - `word5: imm16 = fill_byte` (low8 used)
  - `word6: imm16 = run_len_hi16`
  - `word7: imm16 = run_len_lo16`
  - (len_words MUST be 3)

For MOVE:
- payload:
  - src_space (u8 in word5 low8)
  - src_addr (u32 via words6-7)
  - dst_space already in word1
  - dst_addr already in word2-3
  - length already present
  - (len_words MUST be 3)

### 16.6.3 PATCH_SEAL
Freeze patch and compute hash.

```
word0: [OPC=0xF | A=patch_id | B=hash_reg | C=0x2]
word1: imm16 = flags
```

- VM MUST canonical-encode the patch record list and compute:
  - `patch_hash = SHA256(canonical_patch_bytes)`
- VM MUST store `patch_hash` into `hash_reg` bank (index B).
- flags:
  - bit0 `EMIT_MUX_DEBUG_HASH` (emit hash via MUX DEBUG if enabled)
  - bit1 `CLEAR_BUILDER_AFTER_SEAL` (recommended)
  - others reserved

### 16.6.4 PATCH_APPLY
Apply a sealed patch under barriers/policy.

```
word0: [OPC=0xF | A=patch_id | B=hash_reg | C=0x3]
word1: imm16 = flags
```

Rules:
- VM MUST verify:
  1. patch sealed
  2. barrier active (BARRIER_T)
  3. `hash_reg` matches sealed hash
  4. Fano/policy checks pass (16.7)
- On success:
  - apply records in canonical order
- flags:
  - bit0 `ATOMIC` (all-or-nothing; if any record fails → no changes)
  - bit1 `EMIT_APPLY_EVT` (via MUX)
  - bit2 `ALLOW_CODE_THIS_APPLY` (must also have begun with ALLOW_CODE)
  - others reserved

---

# 12.2 Binary encoding: PATCH + MUX (concrete)

We keep your EXT style:

## PATCH encodings

### PATCH_BEGIN (EXT subop 0x5)
- `word0`: `F ra subop flags`
  - `ra = owner_reg` (or r0 if you use immediate owner)
  - `subop = 0x5`
  - flags:
    - bit0 = “owner_is_imm” (0 => owner comes from ra reg; 1 => owner stored in IMM high nibble)
- `word1`: layout
  - bits 15..12: owner (if owner_is_imm=1 else 0)
  - bits 11..0 : len (0..4095)

Then immediately a second EXT **PATCH_ID** (keeps begin small + deterministic):

### PATCH_ID (EXT subop 0x9)
- `word0`: `F ra=0 subop=0x9 flags=0`
- `word1`: `id` (u16)

### PATCH_WRITE (EXT subop 0x6)
- `word0`: `F ra=0 subop=0x6 flags`
  - flags: bit0 = “off_is_imm” (we always use imm off => set 1)
- `word1`: `off` (u16)
- followed by payload words = packed bytes (2 bytes per u16). The assembler determines length by counting `#:bytes`.

### PATCH_SEAL (R-type family 0xB minor 0x2)
- `word0`: `B rd=0 minor=2 flags=0`

### PATCH_ABORT (R-type family 0xB minor 0x4)
- `word0`: `B 0 4 0`

### PATCH_APPLY (EXT subop 0x7)
- `word0`: `F ra=0 subop=0x7 flags=0`
- `word1`: `addr` (u16 word address)

## MUX encodings

### MUX_OPEN (EXT subop 0x3)
- `word0`: `F ra=0 subop=0x3 flags=0`
- `word1`: `(ch<<12)|(type<<8)|(flags8)`

### MUX_EVT (EXT subop 0x4)
- `word0`: `F ra=0 subop=0x4 flags=0`
- `word1`: `(ch<<12)|(tag<<8)|(len8)`   (len limited to 255 for v1)
- followed by payload bytes packed to u16 words.

### MUX_CLOSE (R-type family 0xC minor 0x2)
- `word0`: `C rd=0 minor=2 flags=(ch&0xF)`  (low nibble channel)

### MUX_HASH (R-type family 0xC minor 0x3)
- `word0`: `C rd=dest minor=3 flags=(ch&0xF)`

---

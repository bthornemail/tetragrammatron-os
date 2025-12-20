# 6) Multiplexer (channels) (Normative)

These are the bridge to **SVG/OBJ/GLB/AUDIO** via your 8⁴ channel system.

## 6.1 MUX_OPEN — begin a channel stream
**Opcode:** `0x80`

Layout:
```
u8   op        = 0x80
u16  ch_imm16   ; (flags4<<12) | channel12
u8   format     ; 0..15
u8   flags      ; 0 in v1
```

Total size: **6 bytes**

Format (suggested v1):
- 0 = RAW_BYTES
- 1 = JSONL
- 2 = SVG_PATH
- 3 = OBJ
- 4 = GLB_CHUNK
- 5 = PCM16
- 6 = RESERVED…

## 6.2 MUX_EVT — write event payload into currently-open channel
**Opcode:** `0x81`

Layout:
```
u8   op      = 0x81
u16  len     ; number of payload bytes following
u8   kind    ; small event kind (0..255)
u8   flags   ; 0 in v1
u8[len] payload
```

Total size: **6 + len bytes**

Notes:
- `len` is **payload length only**, not including header.
- This lets you stream deterministic renderer events and also GLB chunk bytes.

## 6.3 MUX_CLOSE — end channel stream
**Opcode:** `0x82`

Layout:
```
u8   op      = 0x82
u16  ch_imm16
u16  flags   = 0  ; MUST be 0 in v1
```

Total size: **5 bytes**

---

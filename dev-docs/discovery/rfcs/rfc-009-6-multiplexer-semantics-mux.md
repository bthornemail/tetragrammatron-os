# RFC-009 §6 — Multiplexer Semantics (MUX)

This is the piece that turns the VM into a **multi-channel event/visual/wave recorder** while staying deterministic and codec-aligned.

MUX is **not** “rendering” itself. MUX is the **certified event bus** that a renderer (SVG/OBJ/GLB/audio) consumes.

---

## 6.1 Purpose (Normative)

The MUX opcodes provide:

- **typed channels** (e.g., `SVG2D`, `OBJ3D`, `GLB`, `WAVE`, `LOG`, `DEBUG`)
- **deterministic framing**: open → emit → close
- **byte-identical payload encoding** aligned with CLBC-POLY canonical bytes
- optional **barrier hooks** (later) to require Fano/idempotence checks before closing

MUX MUST:
- produce identical bytes on all platforms given identical instruction stream + register state
- never depend on host timing, device timing, network timing

MUX MUST NOT:
- reinterpret floats
- allocate unbounded memory in the VM
- mutate polynomial state unless explicit fold ops are executed

---

## 6.2 MUX Concepts

### Channel
A channel is identified by `(kind, chan_id)` where:

- `kind`: 8-bit enum (see 6.7)
- `chan_id`: 8-bit integer (0..255)

### Frame
A frame is:

```
MUX_OPEN(kind, chan_id, tag_poly?)
  MUX_EVT(kind, chan_id, evt_type, payload_bytes…)
  ...
MUX_CLOSE(kind, chan_id)
```

---

## 6.3 New Opcodes (CAN-ISA v1)

| Opcode | Mnemonic   | Description |
|------:|------------|-------------|
| 0xC0  | MUX_OPEN   | Start a deterministic frame |
| 0xC1  | MUX_EVT    | Append an event record |
| 0xC2  | MUX_CLOSE  | End frame; optionally commit digest |

These live in the **0xC family**.

---

## 6.4 Instruction Encoding (Bit Layout)

We keep the same rule as §4: 16-bit words, with an EXT word when needed.

### 6.4.1 MUX_OPEN (EXT-type)

**Word 0 (EXT header):**
```
15..12 = 1111   (EXT)
11..8  = RD     (register for optional tag poly snapshot)
7..4   = 0101   (subop = MUX_OPEN)
3..0   = 0000
```

**Word 1 (IMM16):**
```
15..8 = kind
7..0  = chan_id
```

**Flags (taken from RD semantics, no extra bits yet):**
- If `RD != 0`, the VM MUST snapshot `REG[RD]` as `tag_poly` bytes using CLBC-POLY encoding.
- If `RD == 0`, tag is absent.

**Semantics:**
- MUST fail if `(kind, chan_id)` already open.
- Initializes an incremental hash state for the frame (hash algo is an implementation detail; SHA-256 recommended, but VM-visible output is via bytes).

---

### 6.4.2 MUX_EVT (EXT-type)

**Word 0:**
```
15..12 = 1111   (EXT)
11..8  = RS     (register containing poly payload OR bytes pointer policy)
7..4   = 0110   (subop = MUX_EVT)
3..0   = FFFF   (flags nibble)
```

**Word 1 (IMM16):**
```
15..8 = evt_type
7..0  = chan_id
```

**Flags nibble (Word0 low 4 bits):**
- bit0 `PAYLOAD_IS_POLY`  
  - if set: payload = CLBC-POLY bytes encoding of `REG[RS]`
- bit1 `PAYLOAD_IS_U16`  
  - if set: payload = little-endian u16 from `REG[RS].words[0] & 0xFFFF`
- bit2 `PAYLOAD_IS_U32`  
  - if set: payload = little-endian u32 from `REG[RS].words[0]`
- bit3 reserved (MUST be 0)

Exactly **one** of (POLY/U16/U32) MUST be set. Assembler MUST enforce.

**Semantics:**
- MUST fail if channel `(kind, chan_id)` not open.
- Appends a record to the channel stream:

**Record Wire Format (Normative):**
```
'CLBC'  (4 bytes)
'X'     (1 byte)   ; container-kind = event record
0x01    (1 byte)   ; version
kind    (1 byte)
chan_id (1 byte)
evt_type(1 byte)
len     (u16 big-endian)
payload (len bytes)
```

Payload is computed deterministically from RS and flags.
If payload is poly: payload bytes MUST be exactly `clbc_poly_encode(REG[RS])`.

This makes MUX records **codec-aligned** with your CLBC-POLY canonical bytes: same “truth substrate”, different container kind.

---

### 6.4.3 MUX_CLOSE (R-type)

**Word 0:**
```
15..12 = 1100  (0xC family)
11..8  = RD    (destination for frame digest poly_u32 or poly bytes ref)
7..4   = 0010  (minor = MUX_CLOSE)
3..0   = FFFF  (flags)
```

**Flags nibble:**
- bit0 `WRITE_RD_DIGEST` (recommended)
- bit1 `EMIT_DIGEST_EVT` (emit final digest as MUX_EVT evt_type=0xFF)
- bit2 `REQUIRE_BARRIER` (reserved for later: enforce PROJ_FANO / idempotence)
- bit3 reserved

**Semantics:**
- finalize frame hash
- optionally write digest to RD as `poly_u32(digest32)` (low 32 bits), **or** (future) store full digest bytes in a side-buffer
- close channel; further events must fail until reopened

---

## 6.5 VM State Extension

```c
typedef struct {
  bool open;
  uint8_t kind;
  uint8_t chan_id;

  // incremental hash state (opaque)
  hash256_ctx_t h;

} mux_chan_t;

typedef struct {
  ...
  mux_chan_t mux[256];   // by chan_id; kind stored per-open
} can_vm_t;
```

Rule: one open channel per `chan_id`. (You can relax later.)

---

## 6.6 C Reference Implementation Sketch

### MUX_OPEN

```c
case EXT_MUX_OPEN: {
  uint8_t rd = ext_rd(w0);
  uint8_t kind = (imm16 >> 8) & 0xFF;
  uint8_t chan = imm16 & 0xFF;

  mux_chan_t *m = &vm->mux[chan];
  if (m->open) TRAP(ERR_MUX_ALREADY_OPEN);

  m->open = true;
  m->kind = kind;
  m->chan_id = chan;
  hash256_init(&m->h);

  // Hash the open header deterministically
  mux_hash_bytes(&m->h, (uint8_t*)"CLBC", 4);
  mux_hash_u8(&m->h, 'O');      // open marker
  mux_hash_u8(&m->h, 0x01);     // version
  mux_hash_u8(&m->h, kind);
  mux_hash_u8(&m->h, chan);

  // Optional tag poly snapshot
  if (rd != 0) {
    uint8_t tmp[512];
    size_t n = clbc_poly_encode(REG(vm, rd), tmp, sizeof(tmp));
    mux_hash_u16be(&m->h, (uint16_t)n);
    mux_hash_bytes(&m->h, tmp, n);
  } else {
    mux_hash_u16be(&m->h, 0);
  }
  return;
}
```

### MUX_EVT

```c
case EXT_MUX_EVT: {
  uint8_t rs = ext_rd(w0);          // reusing RD field as RS in EXT
  uint8_t flags = (uint8_t)(w0 & 0x0F);
  uint8_t evt_type = (imm16 >> 8) & 0xFF;
  uint8_t chan = imm16 & 0xFF;

  mux_chan_t *m = &vm->mux[chan];
  if (!m->open) TRAP(ERR_MUX_NOT_OPEN);

  uint8_t payload[512];
  size_t plen = 0;

  if (flags == 0x1) { // POLY
    plen = clbc_poly_encode(REG(vm, rs), payload, sizeof(payload));
  } else if (flags == 0x2) { // U16
    uint16_t v = (uint16_t)(REG(vm, rs)->words[0] & 0xFFFF);
    payload[0] = (uint8_t)(v & 0xFF);
    payload[1] = (uint8_t)((v >> 8) & 0xFF);
    plen = 2;
  } else if (flags == 0x4) { // U32
    uint32_t v = REG(vm, rs)->words[0];
    payload[0] = (uint8_t)(v & 0xFF);
    payload[1] = (uint8_t)((v >> 8) & 0xFF);
    payload[2] = (uint8_t)((v >> 16) & 0xFF);
    payload[3] = (uint8_t)((v >> 24) & 0xFF);
    plen = 4;
  } else {
    TRAP(ERR_MUX_BAD_PAYLOAD_FLAG);
  }

  // Update hash with normative record encoding (kind X)
  mux_hash_bytes(&m->h, (uint8_t*)"CLBC", 4);
  mux_hash_u8(&m->h, 'X');
  mux_hash_u8(&m->h, 0x01);
  mux_hash_u8(&m->h, m->kind);
  mux_hash_u8(&m->h, chan);
  mux_hash_u8(&m->h, evt_type);
  mux_hash_u16be(&m->h, (uint16_t)plen);
  mux_hash_bytes(&m->h, payload, plen);

  return;
}
```

### MUX_CLOSE

```c
case OP_MUX_CLOSE: {
  uint8_t rd = RD(w0);
  uint8_t flags = (uint8_t)(w0 & 0x0F);
  uint8_t chan = /* choose: chan is in RD? or add an IMM form later */
                 (uint8_t)(REG(vm, rd)->words[0] & 0xFF); // simplest dev path

  mux_chan_t *m = &vm->mux[chan];
  if (!m->open) TRAP(ERR_MUX_NOT_OPEN);

  uint8_t digest[32];
  hash256_final(&m->h, digest);

  if (flags & 0x01) { // WRITE_RD_DIGEST
    uint32_t d32 = (uint32_t)digest[0]
                 | ((uint32_t)digest[1] << 8)
                 | ((uint32_t)digest[2] << 16)
                 | ((uint32_t)digest[3] << 24);
    reg_set_u32_poly(vm, rd, d32);
  }

  if (flags & 0x02) { // EMIT_DIGEST_EVT
    // emit evt_type=0xFF with payload U32 digest32 or full digest later
  }

  m->open = false;
  return;
}
```

> Note: for production you’ll likely want `MUX_CLOSE` to be EXT with `(kind, chan_id)` explicit like OPEN/EVT. The above shows the logic, but the encoding can be tightened once you pick the exact CLOSE operand style.

---

## 6.7 Channel Kinds (Initial Enum)

These are just stable numbers; higher-level meaning is in the renderer contract.

| kind | Name    | Payload expectation |
|----:|---------|---------------------|
| 0x01 | SVG2D  | path/point/edge events |
| 0x02 | OBJ3D  | vertex/face/normal events |
| 0x03 | GLB    | chunked binary blobs (later) |
| 0x04 | WAVE   | PCM blocks / spectral bins |
| 0x05 | LOG    | text bytes (later) |
| 0x06 | CANVAS | Obsidian-canvas-compatible events (optional) |

---

## 6.8 Scheme Assembler (Mechanical Constraints)

### Forms

```scheme
(mux.open  kind chan_id #:tag rTAG)
(mux.evt   kind chan_id evt_type #:poly rX)
(mux.evt   kind chan_id evt_type #:u16  rX)
(mux.evt   kind chan_id evt_type #:u32  rX)
(mux.close kind chan_id #:write-digest rD #:emit-digest? b)
```

Assembler MUST enforce:
- `mux.evt` only inside an open/close region (static if possible)
- payload flag exclusivity (exactly one of poly/u16/u32)
- reserved bits are zero

---

## 6.9 Lean Proof Obligations (What matters)

### (1) Determinism of emitted bytes
For any state `s`:

```lean
theorem mux_evt_deterministic :
  encode_evt (exec (MUX_EVT ...) s) = encode_evt (exec (MUX_EVT ...) s)
```

### (2) Non-interference with polynomial semantics
MUX does not change the fold result:

```lean
theorem mux_commutes_with_fold :
  exec muxInstr (fold s) = fold (exec muxInstr s)
```

### (3) Frame hash is a homomorphism over concatenation
If `E1` and `E2` are event sequences:

```lean
theorem mux_hash_concat :
  H(E1 ++ E2) = combine (H(E1)) (H(E2))
```

(You can keep this abstract in Lean and discharge it later with a concrete hash.)

---

## 6.10 Renderer Bridge Contract (Where SVG/OBJ/GLB comes in)

MUX produces **typed event records**. A renderer MUST:

- read `(kind, chan_id)`
- decode each `evt_type` for that kind
- treat poly payload bytes as canonical CLBC-POLY, never reinterpret

Examples (non-normative):
- SVG2D evt_type:
  - `0x10 MOVE_TO`, `0x11 LINE_TO`, `0x12 CLOSE_PATH`
- OBJ3D evt_type:
  - `0x20 VERTEX`, `0x21 FACE`, `0x22 NORMAL`
- WAVE evt_type:
  - `0x30 PCM_BLOCK`, `0x31 FFT_BIN`

---

## What’s next

If you say **“7”**, we’ll do **PATCH_BEGIN / PATCH_WRITE / PATCH_SEAL / PATCH_APPLY** as the *safe self-modifying block system*—and we’ll tie it to:

- TIME barriers (physical constraint)
- RR circulation (who gets to patch)
- MUX logs (proof-carrying patch trace)
- and (later) Fano/idempotence gates before APPLY.

---

## You

7

---

## ChatGPT

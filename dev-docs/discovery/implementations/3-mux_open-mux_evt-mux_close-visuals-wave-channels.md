# 3) MUX_OPEN + MUX_EVT + MUX_CLOSE (visuals + wave channels)

This is your “multiplexer core”: one stream carries **events**, **geometry**, **waveforms**, **proof tokens**.

### Channels
- `chan=0`: TRACE (always on)
- `chan=1`: GEOM (SVG/OBJ/GLB event stream)
- `chan=2`: AUDIO (PCM blocks or oscillator params)
- `chan=3`: PROOF (barrier tokens, patch seals, hashes)

### Opcodes
#### MUX_OPEN
- **Semantics:** begin a packet stream for `chan=imm8`
- MUST attach current `t_vm`, `rr.idx`, `rr.epoch` as header metadata

**Encoding**
- `FMT=01`, imm8=chan

#### MUX_EVT
- **Semantics:** emit an event record with tag + payload.
- `EXT` format supports arbitrary bytes.

**Encoding**
- `FMT=11`
- ext-tag: u8
- ext-len: u8 (0..255)
- ext-bytes: payload

Suggested event tags (minimal)
- `0x01` TIME_SAMPLE: u32 now_us
- `0x02` RR_TICK: (idx:u8, epoch:u32)
- `0x10` GEOM_LINE: (x1,y1,x2,y2) fixed-point i16
- `0x11` GEOM_TRIAD: 3 ids for Fano triad highlight
- `0x20` AUDIO_OSC: (freq_q16, amp_q15, dur_ms)

#### MUX_CLOSE
- **Semantics:** close current channel packet; compute packet hash; emit hash to PROOF channel

**Encoding**
- `FMT=01`, imm8=chan (explicit close)

**Invariant**
- Every `MUX_OPEN` MUST be matched by `MUX_CLOSE` (well-formed packets).
- Packet hash MUST be stable across devices for the same event sequence.

---

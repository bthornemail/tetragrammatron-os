# 5) Multiplexer for 64-bit and Beyond (Harmonics / Octaves / Dispersion)

This is the “carrier layer”: pack many channels into one deterministic stream.

### Canonical mux frame
- `MuxHeader`: (magic, version, nchan, tick, phase)
- followed by `Channel[i] = (chan_id, codec_id, len, payload…)`

### Opcodes
```
0xA0 MUX_BEGIN     start mux frame (imm16 nchan)
0xA1 MUX_CHAN      open channel id + codec
0xA2 MUX_WRITE     write payload bytes (len in imm16 words)
0xA3 MUX_END       finalize frame -> hash
0xA4 MUX_DEMUX     deterministic demux into buffers
```

### Why this gives “64-bit and beyond immersion”
Because you can define channels like:
- CH0: polynomial state
- CH1: timing witness
- CH2: fano projections
- CH3: audio harmonic bins
- CH4: mesh deltas (GLB)
…and the mux hash commits the *whole* world-state atomically.

---

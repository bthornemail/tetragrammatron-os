# 2) Opcode map (core set) (Normative)

(You can renumber later; the layouts remain stable. For now I’ll assign a clean block.)

### Timing / barriers
- `0x60 TIME_RD`
- `0x61 WAIT_US`
- `0x62 BARRIER_T`

### Round-robin circulation
- `0x70 RR_INIT`
- `0x71 RR_NEXT`

### Multiplexer (events into channels)
- `0x80 MUX_OPEN`
- `0x81 MUX_EVT`
- `0x82 MUX_CLOSE`

### Patch (self-modifying but safe)
- `0x90 PATCH_BEGIN`
- `0x91 PATCH_WRITE`
- `0x92 PATCH_SEAL`
- `0x93 PATCH_APPLY`

### Origami fold / polynomial ops
- `0xA0 CANON`
- `0xA1 MEET_GCD`
- `0xA2 JOIN_LCM`
- `0xA3 PROJ_FANO`
- `0xA4 ASSERT_IDEMP`
- `0xA5 ASSERT_FANO_TRIAD`

---

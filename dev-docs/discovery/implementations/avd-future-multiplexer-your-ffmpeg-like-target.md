# AVD: future multiplexer (your “ffmpeg-like” target)

You’re describing a **multi-channel deterministic mux**:
- channel 0: PROG (the macro stream)
- channel 1: POLY state blobs (CLBC-POLY)
- channel 2: SVG frames (derived)
- channel 3: GLB frames (derived)
- channel 4: audio (derived waveform from state transitions)

CANB supports this by design:
- PROG is the single source of truth
- Everything else is either lookup tables (POLYTAB/STRTAB) or derived products

When you’re ready, AVD section can declare:
- sampling rate
- channel codecs
- frame sync points (tied to OP_COMMIT)

---

## What I can do next (pick one)

1) **Write the exact RFC-009 section text** (drop-in, normative language) for CANB v1 + projection omission rule + SVG/GLB lift.  
2) **Implement the Scheme assembler** that emits these 32-bit words and builds a CANB file (with STRTAB/POLYTAB/PROG).  
3) **Define the audio derivation contract** (state-delta → spectrum → PCM) so the mux has a formal source.

Say “1”, “2”, or “3”.

---

## You

1

---

## ChatGPT

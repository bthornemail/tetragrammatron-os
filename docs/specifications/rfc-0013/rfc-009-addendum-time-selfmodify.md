# RFC-009 Addendum: Time, Self-Modify, Scheduler, and Multiplex

## 0) Baseline instruction word (kept)

We keep the 32-bit “word0” layout you already use:

```
bits 31..24  opcode   u8
bits 23..20  rdst     u4
bits 19..16  rsrc     u4
bits 15..0   imm16    u16   (signed or unsigned by opcode)
```

**PC-relative jumps** stay `imm16 = (target_pc - next_pc)/4`.

---

## 1) Timing / Clock Opcodes (circulation + physical constraint)

### Goals
- Give the VM a **hardware-tethered cadence**
- Allow deterministic pacing without “real-time pretending”
- Enable proof hooks: *a fold block was executed under bounded jitter*

### Opcodes (0x60–0x6F reserved)
- `OP_TIME_RD   0x60` — read monotonic tick counter into `rdst`
- `OP_TIME_DIV  0x61` — quantize time into phase buckets (turn time into discrete “phase”)
- `OP_WAIT      0x62` — wait until `now >= tdst` (deadline wait)
- `OP_BARRIER_T 0x63` — time barrier: asserts max jitter / min spacing for the just-finished fold block

#### Semantics (normative)
- **OP_TIME_RD rdst**
  - `R[rdst] ← TICKS()` where `TICKS()` is monotonic.
- **OP_TIME_DIV rdst rsrc imm16**
  - `R[rdst] ← floor(R[rsrc] / imm16)`; imm16 ≠ 0.
  - Use: map raw ticks → phase index (like a clocked “circulation ring”).
- **OP_WAIT rsrc imm16**
  - Wait until: `TICKS() >= (R[rsrc] + imm16)`
  - If imm16 is 0: “yield right now” (cooperative scheduling hook).
- **OP_BARRIER_T rsrc imm16**
  - Asserts: `(TICKS() - R[rsrc]) <= imm16`
  - Intended: `rsrc` holds “block start tick”; imm16 is max allowed duration.
  - On fail: sets VM fault flag (or triggers `TRAP` if you have it).

**Why this is the “crystal anchor”:**
- ESP32: you can back `TICKS()` by **esp_timer_get_time()** (µs) or CPU cycle counter (if enabled).
- Pico: use **time_us_64()** or systick/cycle counter.
- Your proofs don’t need exact physics — they need **monotonic + bounded drift**.

---

## 2) Self-Modifying Blocks (metabolism + chirality), but still safe

### Design rule
Self-modification is allowed only through a **sealed staging buffer** and a **commit barrier**.

This preserves:
- determinism (no mid-block mutation)
- auditability (changes are explicit artifacts)
- idempotence boundaries (commit points)

### Opcodes (0x70–0x7F reserved)
- `OP_PATCH_BEGIN 0x70` — open a patch frame (starts staged writes)
- `OP_PATCH_WRITE 0x71` — write one instruction word into patch buffer
- `OP_PATCH_SEAL  0x72` — seal patch (hash it; optional signature)
- `OP_PATCH_APPLY 0x73` — apply patch to code memory at a target base (only at barriers)
- `OP_CHIRAL_FLIP 0x74` — flip a “handedness bit” that affects projection/renderer or fold orientation

#### Minimal semantics
- **PATCH_BEGIN**
  - clears `patch_len = 0`, `patch_hash = init`.
- **PATCH_WRITE rsrc imm16**
  - append `WORD = (R[rsrc] << 16) | imm16` OR “write raw from regs” (choose one; keep it deterministic).
- **PATCH_SEAL**
  - `patch_id = HASH(patch_bytes)` stored to a register or VM state.
- **PATCH_APPLY rsrc imm16**
  - apply at `base = R[rsrc] + imm16` (word-aligned)
  - MUST be legal only when:
    - not inside an open fold block
    - last instruction was a barrier (`COMMIT`, `JMP`, `BARRIER_T`, etc.)
- **CHIRAL_FLIP imm16**
  - toggles `chirality = chirality XOR (imm16 & 1)`
  - The fold/projection ops may interpret chirality as choosing dual mappings (L/R).

This gives you “biological” behavior without chaos: **mutation is staged, sealed, then applied only at safe boundaries**.

---

## 3) Round-Robin Scheduler (analog/digital handshake)

Think of this as your **triad rotor**: each time slice picks one of three lanes (or seven points, later).

### Opcodes (0x80–0x8F reserved)
- `OP_RR_INIT   0x80` — init ring parameters
- `OP_RR_NEXT   0x81` — advance and return current slot index
- `OP_RR_GOTO   0x82` — computed jump via slot table (safe computed branches)
- `OP_YIELD     0x83` — cooperative yield (pairs nicely with OP_WAIT 0)

#### Minimal model
- `rr_mod` in imm16 (e.g., 3 for triad)
- `rr_i = (rr_i + 1) mod rr_mod`

**RR_GOTO**
- uses a table of label PCs stored in a read-only “jump table” region
- avoids arbitrary computed jump (keeps verification tractable)

This is where your analog/digital coupling lives:
- analog time → `TIME_DIV` phase
- phase → scheduler slot
- slot → fold lane / renderer channel

---

## 4) SVG / GLB Emission + Multiplexer (immersion + dispersion)

### Principle
VM does **not** render. VM emits **events** into a **multiplexed stream**.  
Renderer(s) subscribe: SVG2D, GLB3D, audio/wave, haptics, network.

### Opcodes (0x90–0x9F reserved)
- `OP_MUX_OPEN   0x90` — open a stream (select channel set)
- `OP_MUX_EVT    0x91` — emit event record (typed)
- `OP_MUX_CLOSE  0x92` — close stream, finalize hash
- `OP_MUX_ROUTE  0x93` — set routing mask (SVG/GLB/WAVE/NET)

#### Event encoding (canonical, CLBC-friendly)
Reuse your “record stream hashing VM” style idea, but for fold/viz:

Each `MUX_EVT` emits a **fixed header + payload**:

Header (8 bytes):
- `u8  event_type`
- `u8  channel_id`
- `u16 payload_len`
- `u32 crc_or_hash32` (optional for microcontrollers)

Payload is byte-for-byte canonical:
- SVG: path segments, points as int32 fixed-point
- GLB: node transforms, meshes indexed, also fixed-point
- WAVE: frequency bins or phase deltas as int16/int32

This is your “ffmpeg multiplexer” pattern:
- multiple channels
- one deterministic stream
- hashed for proofs

---

# How the four parts snap together (one tiny example)

A “circulating fold loop” that emits to SVG+WAVE:

1) read time  
2) quantize phase  
3) choose scheduler slot  
4) fold lane executes  
5) emit projection event  
6) wait to next tick

That is literally:
- physiology (clock)
- metabolism (patch/flip)
- nervous system (scheduler)
- perception (mux)
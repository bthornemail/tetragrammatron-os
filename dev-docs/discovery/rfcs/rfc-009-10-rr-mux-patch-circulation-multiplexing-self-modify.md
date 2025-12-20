# RFC-009 §10 — RR + MUX + PATCH (Circulation, Multiplexing, Self-Modify)

This section is the “vertical slice kernel” that turns Origami/Fano semantics into an **executing, auditable, self-modifying VM** — while staying deterministic.

You already have the right sequence:

1) TIME (physical constraint)  
2) RR (circulation topology)  
3) MUX (multi-channel event/output stream)  
4) PATCH (self-modifying, but safe)

We now make each one **mechanically enforceable** by opcode semantics + binary layout.

---

## 10.1 Round-Robin Circulation (RR)

### 10.1.1 Purpose
RR defines a **finite circulation topology** over `N` actors (or logical lanes). It gives you:

- deterministic “who may act now”
- an explicit notion of *ownership* for mutation
- a clean place to couple time phase (`BARRIER_T COUPLE_RR=1`)

### 10.1.2 State
VM maintains:

- `rr.N : u8` number of owners
- `rr.owner : u8` current owner index in `[0..N-1]`
- `rr.epoch : u32` increments on wrap (optional but recommended)

### 10.1.3 Opcodes
| Opcode | Mnemonic   | Meaning |
|------:|------------|---------|
| 0xE0  | RR_INIT    | set N, reset owner/epoch |
| 0xE1  | RR_NEXT    | owner := (owner+1) mod N; epoch++ on wrap |
| 0xE2  | RR_OWNER   | read owner into reg |
| 0xE3  | RR_BARRIER | require caller/slot matches rr.owner |

(0xE-family reserved for circulation.)

---

## 10.2 Binary Encoding (Imm16 layouts)

Same “16-bit base word + optional EXT word” rule as §9.

### 10.2.1 RR_INIT (EXT)

**Word 0**
```
15..12 = 1111 (EXT)
11..8  = RD    (optional: where to write N/owner info; 0 allowed)
7..4   = 0001  (subop = RR_INIT)
3..0   = flags
```

**Word 1 (IMM16)**
```
15..8 = N     (1..255)
7..0  = owner0 (initial owner, must be < N)
```

Flags:
- bit0 `RESET_EPOCH` (recommended 1)
- bit1 `LOCK_N` (optional; disallow changing N until reboot)
- others reserved

Semantics:
- `rr.N := N`
- `rr.owner := owner0`
- if RESET_EPOCH=1 then `rr.epoch := 0`

---

### 10.2.2 RR_NEXT (R-type)

**Word 0**
```
15..12 = 1110 (0xE family)
11..8  = RD
7..4   = 0001 (minor = RR_NEXT)
3..0   = flags
```

Flags:
- bit0 `WRITE_OWNER` : write new owner into RD (if RD≠0)
- bit1 `WRITE_EPOCHLO` : write low16(epoch) into RD (debug)
- others reserved

Semantics:
- `old := rr.owner`
- `rr.owner := (rr.owner + 1) mod rr.N`
- if wrap then `rr.epoch++`

---

### 10.2.3 RR_BARRIER (EXT)

This is the **mutation gate**.

**Word 0**
```
15..12 = 1111 (EXT)
11..8  = RS    (caller id reg; 0 means “use implicit lane 0”)
7..4   = 0010  (subop = RR_BARRIER)
3..0   = flags
```

**Word 1 (IMM16)**
```
15..8 = lane_mask_hi
7..0  = lane_mask_lo
```

Interpret as a bitmask of allowed owners for this instruction block. Minimal mode: allow only current owner.

Flags:
- bit0 `STRICT` : TRAP if not allowed; else soft-fail (sets RS=0 if RS≠0)
- bit1 `TRACE_MUX`
- bit2 `MASK_MODE` : if 0 then “must equal rr.owner”; if 1 then “rr.owner must be in lane_mask”
- bit3 reserved

Semantics (common):
- pass iff `(caller == rr.owner)` when MASK_MODE=0
- pass iff `bit(rr.owner) in lane_mask` when MASK_MODE=1
- STRICT governs trap vs soft-fail

> **Rule:** `PATCH_*` instructions MUST be preceded by `RR_BARRIER STRICT=1` in the same “basic block” (no control-flow in between) unless a future extension explicitly provides a different capability model.

---

## 10.3 Multiplexer (MUX) Event Stream

### 10.3.1 Purpose
MUX is your bridge to:

- SVG / GLB rendering
- waveform/harmonics channels
- audit logs for proof replay
- deterministic “what happened” traces across ESP32/Pico/host

Key property: **the VM’s semantic state does not depend on MUX output**, but MUX output depends on semantic state (one-way).

### 10.3.2 Core MUX Opcodes
| Opcode | Mnemonic   | Meaning |
|------:|------------|---------|
| 0xC0  | MUX_OPEN   | begin a channel stream (type-tagged) |
| 0xC1  | MUX_EVT    | append an event record |
| 0xC2  | MUX_CLOSE  | end stream |
| 0xC3  | MUX_HASH   | emit hash of stream so far (audit) |

(0xC-family reserved for multiplexer.)

### 10.3.3 Stream Types
- `0x01` VIZ2D (SVG primitives)
- `0x02` VIZ3D (OBJ/MTL or GLB chunks)
- `0x03` WAVE (PCM/control-rate envelopes)
- `0x04` TRACE (barriers/opcode trace)
- `0x05` PROOF (checkpoints/hints)

### 10.3.4 Determinism Rule
`MUX_*` MUST NOT affect VM state except:
- internal counters for stream offsets
- optional “trace hash register” if requested (read-only to semantics)

---

## 10.4 PATCH: Self-Modifying Code, Safely

### 10.4.1 Purpose
PATCH gives you controlled self-modification:

- dynamic macros / rewriting blocks
- replayable “edit scripts”
- proof-carrying changes (only applied if verified)

### 10.4.2 Patch Object Model
A patch is a byte array plus metadata:

- `patch.id : u32`
- `patch.len : u16`
- `patch.sha256 : 32 bytes` (or your chosen digest)
- `patch.owner : u8` (who is allowed to apply)
- `patch.window : (phase_q, window_len_q)` optional time guard

### 10.4.3 Opcodes
| Opcode | Mnemonic     | Meaning |
|------:|--------------|---------|
| 0xB0  | PATCH_BEGIN  | allocate patch buffer, set id/len |
| 0xB1  | PATCH_WRITE  | write bytes at offset |
| 0xB2  | PATCH_SEAL   | freeze + hash |
| 0xB3  | PATCH_APPLY  | apply to code memory if gates pass |
| 0xB4  | PATCH_ABORT  | drop patch buffer |

(0xB-family reserved for self-modifying blocks.)

---

## 10.5 Required Safety Gates (Normative)

`PATCH_APPLY` MUST enforce all of the following:

1) **RR Gate:** immediately preceding `RR_BARRIER STRICT=1` passed  
2) **TIME Gate (recommended):** immediately preceding `BARRIER_T STRICT=1 COUPLE_RR=1` passed  
3) **Integrity Gate:** `PATCH_SEAL` completed and digest matches computed bytes  
4) **Alignment Gate:** patch applies only to instruction boundaries (16-bit words)  
5) **Scope Gate:** patch target region MUST be within a declared “patchable segment” (configured at boot)

If any gate fails: `PATCH_APPLY` MUST TRAP (or return an explicit failure code in a dedicated status register, but TRAP is recommended for v1).

---

## 10.6 How This Enables “Dynamic Proof”

This is the exact enforcement pipeline you want:

- **RR** provides *who is allowed* to mutate
- **TIME** provides *when mutation is allowed* (phase windows)
- **PATCH** provides *what mutation is allowed* (sealed bytes + boundaries)
- **MUX** provides *how we replay and verify* (auditable event logs)

So you get self-modifying code that is:
- deterministic when it succeeds
- explicitly explainable when it fails
- reproducible across devices (because the gates are formal predicates)

---

## 10.7 Minimal Implementation Checklist

If you’re implementing the first firmware upgrade slice:

1) Implement RR_INIT, RR_NEXT, RR_BARRIER  
2) Couple §9 BARRIER_T to RR.owner (COUPLE_RR)  
3) Implement MUX_OPEN / MUX_EVT / MUX_CLOSE for TRACE only  
4) Implement PATCH_BEGIN/WRITE/SEAL/APPLY with:
   - RR_BARRIER STRICT required
   - BARRIER_T STRICT recommended
   - SHA256 over patch bytes
   - 16-bit alignment enforcement

That’s enough to start “circulating” safe self-modifying macros on ESP32/Pico and replay them on host.

---

If you reply **“11”**, I’ll write the **assembler-facing Scheme spec** for these opcodes (RR/MUX/PATCH) in the same style as your existing `clbc-vm.scm` conventions, including label + jump hygiene so “basic block gate adjacency” is enforceable mechanically.

---

## You

11

---

## ChatGPT

Below is a **Scheme assembler spec** for RFC-009 §10 (RR/MUX/PATCH) that **mechanically enforces** the safety invariants:

- `PATCH_APPLY` **must** be immediately preceded (in the same basic block) by `RR_BARRIER STRICT=1`
- (recommended) also immediately preceded by `BARRIER_T STRICT=1 COUPLE_RR=1`
- “basic block” boundaries are created by control-flow (`JMP/JZ/CALL/RET/LABEL`) and by explicit `BARRIER_*` (because barriers are semantically checkpoints)

I’m going to write this as:
1) assembler *surface language* (S-expr directives)
2) encoding rules (Imm16 + EXT)
3) the **static verifier** pass that rejects bad programs
4) minimal emitter skeleton

---

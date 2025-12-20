# 17.9 Minimal vertical slice program (end-to-end)

Goal: demonstrate:
1) TIME_RD + WAIT + BARRIER_T (physical constraint)
2) RR_INIT + RR_NEXT (circulation)
3) MUX_OPEN/EVT/CLOSE (visual+freq)
4) PATCH_BEGIN/WRITE/SEAL/APPLY (safe self-modifying DATA)
5) Confirm idempotence hooks: CANON twice = once; Fano triad check stable

### 17.9.1 Pseudocode intent

- Read time `t0`
- Start barrier
- Init RR over polynomial regs P0,P1,P2
- Compute triad meet/join and project to Fano
- Emit MUX event: a Fano-triad + a frequency derived from degree
- Build a patch that writes one byte into DATA (like toggling a feature flag)
- Seal + apply patch under barrier
- Wait Δt and exit barrier
- Hash commit ensures deterministic replay

### 17.9.2 Assembly-ish listing (using your 16-bit word model)

I’ll use symbolic mnemonics; your assembler maps them to the bit layouts we set up:

```asm
; ---- setup polynomials (assume P0,P1,P2 preloaded or loaded earlier) ----

TIME_RD      R0            ; R0 := t_now
BARRIER_T    #STRICT       ; barrier_active := true, barrier_epoch := R0

RR_INIT      #POLY, #P0, #3   ; ring over P0,P1,P2
RR_NEXT      R1               ; R1 := index (0..2)

; Compute: p01 = MEET(P0,P1), p12 = MEET(P1,P2), p02 = MEET(P0,P2)
MEET         P3, P0, P1
MEET         P4, P1, P2
MEET         P5, P0, P2

; Optional: check triad non-trivial meets (your “Fano triad” predicate)
FANO_TRIAD   R2, P0, P1, P2  ; R2 := 1 if passes else 0 (boolean)

; Project to Fano (canonical 7-point/7-line representation id)
PROJ_FANO    R3, P0, P1, P2  ; R3 := fano_id or packed triad signature

; Normalize idempotence hook
CANON        P0, P0
CANON        P0, P0          ; MUST be no-op effect vs previous line

; ---- emit visualization + frequency ----
MUX_OPEN     #CHAN_VIS
MUX_EVT_FANO R3              ; emit the triad projection
MUX_EVT_FREQ R4              ; emit a frequency (derive below)
MUX_CLOSE

; Derive a “tone” deterministically from triad signature (example)
; (could be: freq = base + (popcount(fano_id) * step))
DERIVE_FREQ  R4, R3

; ---- safe self-modifying step: patch DATA flag byte ----
PATCH_BEGIN  #id=0, #policy=STRICT, #flags=0          ; no code patching
PATCH_WRITE  #id=0, #type=WRITE, #space=DATA, #addr=0x00012000, #len=1, #bytes=[R2]
PATCH_SEAL   #id=0, #hash_reg=H2, #flags=CLEAR_BUILDER
PATCH_APPLY  #id=0, #hash_reg=H2, #flags=ATOMIC|EMIT_APPLY_EVT

; ---- exit barrier by waiting a deterministic duration ----
WAIT         #ticks=1024       ; consumes time window deterministically
BARRIER_CLR                  ; optional opcode; or WAIT clears barrier in your minimal spec

HALT
```

Notes:
- `BARRIER_CLR` can be an explicit opcode, **or** you define “WAIT clears barrier” (simplest).
- `DERIVE_FREQ` is purely deterministic (no floats required).

---

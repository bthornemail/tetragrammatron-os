# 12.5 What you have now (and what to do next)

You now have a **mechanically enforced** path to safe self-modifying bytecode:

- The assembler refuses:
  - `patch.apply` without RR/T gates
  - `patch.write` outside patch window or beyond length
  - `patch.seal` before full coverage
  - `mux.evt` without `mux.open`

### Next (say **“13”**)
I’ll add two missing “production” pieces:

1) **Label + jump/call encodings** (so patch targets can be function entrypoints safely)  
2) A **canonical `.clbc` container layout** for this CAN-style stream:
   - magic/version/ring-id alignment matching CLBC-POLY conventions
   - deterministic endianness + hash footer rules

Just reply: **13**

---

## You

13

---

## ChatGPT

## 13) Control-flow + containerization: labels/jumps, calls/returns, and a canonical `.canbc` container

This section completes the **execution loop** around RFC-009 by adding (A) **control-flow encodings** that are safe with PATCH, and (B) a **canonical container** that aligns with CLBC-POLY determinism while keeping the Origami/CAN VM cleanly versioned.

---

## 13.1 Control-flow model (normative)

### Goals
- Deterministic jumps/calls with **label resolution** at assemble time.
- **PATCH safety**: you may patch code **only at entrypoints** that obey barrier adjacency.
- Minimal instruction set that maps cleanly to your existing EXT/Imm16 patterns.

### Invariants
- **No control-flow transfer may cross a PATCH boundary** unless the destination is a labeled entrypoint.
- **CALL/RET** preserve RR lane ownership unless explicitly re-initialized.
- **BRANCH** instructions are pure (no side effects) and do not reset adjacency history.

---

## 13.2 Instruction set additions (CAN-ISA v1.0)

### 13.2.1 JMP (absolute)
- **Purpose**: unconditional jump to label/addr.
- **Encoding**: EXT subop `0x8`
```
word0:  F ra=0 subop=0x8 flags=0
word1:  addr (u16, word address)
```

### 13.2.2 JZ / JNZ (conditional, reg==0 / reg!=0)
- **Purpose**: branch on register zero/non-zero.
- **Encoding**: EXT subop `0xA`
```
word0:  F ra=rs subop=0xA flags=(cond)   ; cond: 0=JZ, 1=JNZ
word1:  addr (u16)
```

### 13.2.3 CALL (absolute)
- **Purpose**: call entrypoint; pushes return addr to a fixed return register (or tiny return stack if enabled).
- **Encoding**: EXT subop `0xB`
```
word0:  F ra=0 subop=0xB flags=0
word1:  addr (u16)
```

### 13.2.4 RET
- **Purpose**: return from CALL.
- **Encoding**: R-type family `0xD` minor `0x1`
```
word0:  D rd=0 minor=1 flags=0
```

> **PATCH rule**: `CALL` destinations MUST be labeled entrypoints. `RET` MUST return to the immediate post-CALL word.

---

## 13.3 Assembler verification rules (extensions)

Add these to the verifier:

1) **Entry label registry**  
   - Any label used as a `CALL` target MUST be declared `entry` (e.g., `(label entry foo)`).

2) **PATCH adjacency**  
   - `patch.apply` may target:
     - a labeled entrypoint, or
     - a word inside the same basic block (local hot-patch), **only if** RR/T barriers immediately precede.

3) **No mid-instruction jumps**  
   - Assembler ensures all jump targets are **word-aligned** and correspond to instruction boundaries.

---

## 13.4 Assembler: emit + verify (Scheme snippets)

### 13.4.1 Emit sizes
```scheme
(define (emit-size i)
  (let ((op (op-of i)) (args (args-of i)))
    (cond
      ((or (eq? op 'jmp) (eq? op 'call)) 2)
      ((or (eq? op 'jz) (eq? op 'jnz)) 2)
      ((eq? op 'ret) 1)
      (else (emit-size/previous i)))))
```

### 13.4.2 Emit encodings
```scheme
(define (emit-insn i labels)
  (let* ((op (op-of i)) (args (args-of i)))
    (cond
      ((eq? op 'jmp)
       (let ((addr (resolve-addr args labels)))
         (make-ext 0 #x8 0 (u16 addr))))
      ((or (eq? op 'jz) (eq? op 'jnz))
       (let* ((rs (reg->u4 (kw-get args '#:rs 'r0)))
              (cond (if (eq? op 'jnz) 1 0))
              (addr (resolve-addr args labels)))
         (make-ext rs #xA cond (u16 addr))))
      ((eq? op 'call)
       (let ((addr (resolve-addr args labels)))
         (make-ext 0 #xB 0 (u16 addr))))
      ((eq? op 'ret)
       (list (make-word #xD 0 #x1 0)))
      (else (emit-insn/previous i labels)))))
```

---

## 13.5 Canonical container: `.canbc` (CAN ByteCode)

To avoid confusion with the existing CLBC record-hash VM, introduce **`.canbc`** for Origami/CAN programs. The container preserves CLBC-POLY determinism patterns.

### 13.5.1 Layout (big-endian)
```
+0x00  u32  magic        = 0x43414E42  ; 'CANB'
+0x04  u16  version      = 0x0100      ; v1.0
+0x06  u16  flags        = bitfield (0 for now)
+0x08  u16  ring_id      = 0x0001      ; F2[x]
+0x0A  u16  isa_id       = 0x0001      ; CAN-ISA v1
+0x0C  u32  code_words   ; number of u16 words in code
+0x10  u32  code_crc32   ; over code payload (optional but recommended)
+0x14  ... code payload ; u16 words, big-endian
+...   u32  footer_len
+...   bytes footer     ; JSON (optional metadata)
+...   u32  sha256[8]   ; SHA-256 over header+code+footer
```

**Normative**:
- Endianness: **big-endian** throughout.
- `sha256` MUST match exactly; verifiers reject otherwise.
- Footer JSON MAY include:
  - `entrypoints`: array of labels
  - `axes`: the semantic 8-tuple keywords
  - `viz`: default MUX channels

### 13.5.2 Determinism
- Code words are canonical.
- Footer JSON MUST be canonicalized (sorted keys, no whitespace variance) before hashing.

---

## 13.6 Example: entrypoint + call + patch

```scheme
(program
  (section text)

  (label entry main)
  (rr.init #:n 4 #:owner 0 #:reset-epoch #t)

  ;; hot-patch a helper entrypoint
  (patch.begin #:id 7 #:len 2 #:owner 0)
  (patch.write #:off 0 #:bytes 0 0) ; placeholder
  (patch.seal)
  (barrier.rr #:strict #t)
  (patch.apply #:addr (label-ref helper))

  (call #:addr (label-ref helper))
  (halt)

  (label entry helper)
  (nop)
  (ret))
```

---

## 13.7 What’s complete now

- **Control flow** (JMP/JZ/JNZ/CALL/RET) with label safety.
- **PATCH safety** integrated with barriers and entrypoints.
- **A clean artifact** (`.canbc`) that doesn’t collide with legacy CLBC.
- **Deterministic hashing** aligned with CLBC-POLY.

### Next (say **“14”**)
We’ll add **TIME/RR scheduling semantics** to control-flow (fairness, deadlines), plus **static cost annotations** so PATCH/APPLY can be proven to respect physical timing constraints on ESP32/Pico.

---

## You

14

---

## ChatGPT

## 14) Time + Round-Robin semantics (physical constraint layer) + static cost model

This section makes the VM “touch reality” in a minimal, non-mystical way: **time is read-only**, and scheduling is enforced by **round-robin lanes + barriers**. This gives you the analog constraint you were pointing at (clock / crystal) without turning the VM into an analog simulator.

---

## 14.1 Time model (normative)

### 14.1.1 Clock source
- The VM MUST expose a monotonic tick counter `T` (u64).
- `T` MUST be sourced from a hardware monotonic clock:
  - ESP32: cycle counter or microsecond timer
  - Pico: timer peripheral / cycle counter
- `T` MUST NOT go backwards.

### 14.1.2 Determinism boundary
- Programs MUST treat `T` as **input**, not as a value to “prove”.
- Any instruction whose behavior depends on `T` MUST be explicitly marked **nondeterministic** in the trace, so replay can substitute a recorded `T`.

> Key idea: **proofs apply to state transforms**, not to wall-clock.

---

## 14.2 Scheduling model: RR lanes (normative)

We execute in *lanes* (think: 4 or 8 “threads” that take turns). This is the “circulation topology”.

### 14.2.1 State
VM maintains:

- `rr.n` : number of lanes (1..16)
- `rr.cur` : current lane index
- `rr.epoch` : u32 round counter
- `rr.quanta_ticks` : fixed time slice (ticks)
- `rr.deadline[ lane ]` : optional hard deadline tick
- `rr.owner` : “who may patch” (lane id)

### 14.2.2 RR invariants
- Only the current lane may execute mutating ops (MEET/JOIN/PATCH/MUX_EVT) unless a barrier has opened a shared region.
- Lane switching MUST be deterministic given:
  - `rr.n`, `rr.quanta_ticks`, and recorded `TIME_RD` events.

---

## 14.3 New opcodes (CAN-ISA v1 additions)

These are the smallest vertical slice you listed:

### 14.3.1 TIME_RD (read monotonic time)
- **Effect**: `rd ← low16(T)` or `rd ← hash16(T)` (implementation-defined but MUST be fixed per platform profile)
- **Encoding**: I-type family `0xE` minor `0x0`
```
word0:  E rd=rd minor=0 imm16=mode
imm16 mode:
  0x0000 = low16(T)
  0x0001 = hi16(T)
  0x0002 = hash16(T)  ; deterministic transform of u64 -> u16
```

### 14.3.2 WAIT (block until tick reached)
- **Effect**: stall until `T >= T0 + imm16`
- **Encoding**: I-type family `0xE` minor `0x1`
```
word0:  E rd=0 minor=1 imm16=dt
```
Rules:
- MUST not mutate VM state while waiting.
- MUST produce a trace event `WAIT(dt, T_start, T_end)` for replay.

### 14.3.3 BARRIER_T (time barrier)
- **Effect**: asserts “we are at/after tick boundary”; used to fence PATCH + RR.
- **Encoding**: I-type family `0xE` minor `0x2`
```
word0:  E rd=0 minor=2 imm16=slack
```
Semantics:
- Requires `T >= rr.slot_start + rr.quanta_ticks - slack`
- If false: either WAIT internally or trap (flag-controlled).

### 14.3.4 RR_INIT
- **Effect**: initialize RR lanes and slice
- **Encoding**: EXT subop `0xC`
```
word0:  F ra=0 subop=0xC flags=0
word1:  [ n:4 | owner:4 | quanta:8 ]   (packed u16)
```

### 14.3.5 RR_NEXT
- **Effect**: advance to next lane; increments epoch on wrap
- **Encoding**: EXT subop `0xD`
```
word0:  F ra=0 subop=0xD flags=(mode)
word1:  imm16 = optional (0 default)
flags mode:
  0 = strict round-robin
  1 = skip lanes whose deadline missed (requires deadline table enabled)
```

### 14.3.6 BARRIER_RR
- **Effect**: fences lane-local operations; required before PATCH/APPLY and cross-lane MUX close
- **Encoding**: EXT subop `0xE`
```
word0:  F ra=0 subop=0xE flags=(strict)
word1:  imm16 = 0
```

---

## 14.4 Static cost model (for proofs + firmware budgeting)

To make timing “provable enough”, we use **static cost units** that bound runtime.

### 14.4.1 Cost units
Each opcode has:
- `cost_base` (constant)
- `cost_degree` (depends on polynomial degree / word count)
- `cost_io` (depends on MUX channel type)

Example (normative defaults; platforms MAY tighten but not loosen without declaring a new profile):

| Opcode       | Cost model |
|--------------|------------|
| CANON        | `1 + 0.05*W` |
| MEET (GCD)   | `10 + 2.0*W*log2(W+1)` |
| JOIN (LCM)   | `12 + 2.5*W*log2(W+1)` |
| PROJ_FANO    | `6 + 0.2*W` |
| TIME_RD      | `1` |
| WAIT         | `0` (but consumes wall time) |
| RR_NEXT      | `1` |
| PATCH_APPLY  | `8 + 0.1*L` (L patched words) |
| MUX_EVT      | `4 + 0.2*payload_words` |

Where `W = poly.nwords` (32-bit words in canonical poly).

### 14.4.2 Proof hook
A program MAY include annotations (not executed) that assert:
- `Σ cost(op_i) ≤ rr.quanta_budget`

This is how you justify “we can keep real-time guarantees” while still allowing self-modifying blocks safely.

---

## 14.5 Safety rules tying time ↔ self-modifying code (normative)

1) **PATCH window rule**
- `PATCH_APPLY` MUST only execute if preceded by:
  - `BARRIER_RR(strict=1)` AND
  - `BARRIER_T(slack ≤ configured_max_slack)`
- This ensures patching occurs at controlled time boundaries.

2) **Lane ownership**
- Only `rr.owner` lane may issue PATCH_* unless a `PATCH_DELEGATE` extension is enabled later.

3) **Replay rule**
- TIME_RD and WAIT MUST emit trace records so host replay uses recorded `T`, maintaining determinism.

---

## 14.6 Minimal “physical constraint” program (vertical slice)

This is the firmware test you can run immediately on ESP32 + Pico:

```scheme
(program
  (rr.init #:n 4 #:owner 0 #:quanta 200)     ; quanta in ticks (profile-defined)
  (label entry main)

  (time.rd #:rd r1 #:mode 0)                 ; capture start tick
  (wait #:dt 50)                              ; enforce real-time spacing
  (barrier.t #:slack 10)                      ; must be near slot end
  (barrier.rr #:strict #t)                    ; lane fence

  (canon #:reg p0)
  (meet  #:dst p1 #:a p0 #:b p0)              ; gcd(p,p)=p (idempotence witness)
  (proj.fano #:src p1 #:dst f0)

  (rr.next #:mode 0)
  (jmp #:addr (label-ref main)))
```

Expected properties:
- Stable cadence (WAIT).
- Periodic lane cycling (RR_NEXT).
- Proof-relevant transform (CANON/MEET/PROJ_FANO) remains deterministic.

---

## 14.7 What this unlocks

- Your “analog constraint” is now *concrete*: **monotonic clock + enforced slice boundaries**.
- Self-modifying code becomes “circulation” only at **barrier times**.
- You can now define **harmonics** as *derived* from tick deltas and MUX wave channels (next section), without mixing metaphysics into the spec.

---

If you say **“15”**, I’ll do **MUX channels + waveform/visual multiplexing** (SVG→OBJ/GLB lift contract), including the “poly-channel / ffmpeg-like multiplexer” framing, and the opcode bit layouts for `MUX_OPEN / MUX_EVT / MUX_CLOSE`.

---

## You

15

---

## ChatGPT

## 15) MUX semantics (visual + waveform multiplexing) and binary encodings

This section is the “ffmpeg-like” layer: a **typed event multiplexer** that carries *geometry* (SVG/OBJ/GLB) and *signals* (PCM-ish wave events) alongside your **deterministic fold VM**. The key constraint: **the MUX never affects polynomial truth**; it’s an *observable channel* that can be replayed/verified via hashes.

---

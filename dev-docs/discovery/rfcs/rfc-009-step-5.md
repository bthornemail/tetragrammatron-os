# RFC-009 · Step 5  
## RR_INIT / RR_NEXT (Circulation Topology Layer)

This step gives you the **round-robin “circulation” constraint**: a deterministic scheduler ring that advances only by explicit opcodes, so it’s replayable, hashable, and can be tied to **time barriers** from Step 4.

---

## 5.1 New Opcodes

| Opcode | Mnemonic   | Operands | Meaning |
|------:|------------|----------|---------|
| 0x63  | `RR_INIT`  | `reg, imm16` | Initialize a ring scheduler state |
| 0x64  | `RR_NEXT`  | `reg, imm16` | Advance ring and emit the next slot |

Registers:
- `R2` remains your **time integer** bundle
- `R3` (new) recommended as **RR state register** (you can use any reg)

---

## 5.2 RR State Model (Normative)

We define a **pure integer scheduler**:

- `N = ring size` (number of slots/devices/roles)
- `i = current index` (0..N-1)
- `epoch = number of wraps` (increments when i wraps)

State packed into a 32-bit word stored in `reg`:

```
RR_STATE (u32):
  bits [7..0]   i      (0..255)
  bits [15..8]  N      (1..255)
  bits [31..16] epoch  (0..65535)
```

This is intentionally tiny and exact.

### Invariant
- `1 ≤ N ≤ 255`
- `i < N`
- advancing updates `(i, epoch)` deterministically

---

## 5.3 Instruction Binary Layout

### 5.3.1 RR_INIT
```
0x63  reg  imm16
```

`imm16` encodes:
- `[15..8] N`  (ring size)
- `[7..0]  i0` (start index)

Example: `RR_INIT R3, N=7, i0=0` → imm16 = `0x0700`
Bytes:
```
63 03 07 00
```

### 5.3.2 RR_NEXT
```
0x64  reg  imm16
```

`imm16` encodes:
- `[15..8] k`  (optional “stride”; default 1)
- `[7..0] flags`
  - bit0 = `EMIT` (if 1, write current slot index into `R0` as a small poly mask)
  - bit1 = `BARRIER_LINK` (if 1, require last barrier pass before advancing)
  - others reserved

Recommended default: `k=1, flags=EMIT` → imm16 = `0x0101`
Bytes:
```
64 03 01 01
```

---

## 5.4 Semantics

### 5.4.1 RR_INIT(reg, N, i0)
Sets:
- `i := i0 mod N`
- `epoch := 0`
- store packed `RR_STATE` into `reg`

### 5.4.2 RR_NEXT(reg, k, flags)
Let `(i, N, epoch)` be unpacked from `reg`.

If `flags.BARRIER_LINK = 1` then the VM must have a “barrier OK” latch set by the most recent `BARRIER_T`. If not set → trap or stall (deterministic error).

Advance:
- `i' = i + k`
- if `i' < N` then `i := i'`
- else `i := i' mod N` and `epoch := epoch + 1` (only +1 per wrap; k is expected small)

Store back packed state.

If `flags.EMIT = 1`, emit the active slot into **R0** as an F₂[x] one-hot polynomial:

- `slot = i`
- `R0 := x^slot`

This is the bridge from “scheduler” → “polynomial world”.

---

## 5.5 Minimal Program: “Timed RR with Barrier”

This is the smallest slice that proves the concept:

```asm
; rr_timed.can.s
.version 1
.target can-isa-v1

RR_INIT   R3, 0x0700      ; N=7, start=0

loop:
TIME_RD   R2, MONO_US
BARRIER_T R2, 0x82A       ; k=8 expected=42 (example phase)
RR_NEXT   R3, 0x0103      ; k=1 flags=EMIT|BARRIER_LINK (0b11)
PROJ_FANO R1, R0          ; project the slot-poly to fano (or treat as point)
COMMIT    R1
JMP       loop
```

Bytecode (only showing new instructions + key ones):
```
63 03 07 00
60 02 00
62 02 08 2A
64 03 01 03
31 01 00
50 01
.. JMP ..
```

---

## 5.6 Scheme VM Reference (Drop-in Dispatch)

```scheme
;; Helpers
(define (u32-pack i n epoch)
  (bitwise-ior
    (bitwise-and i #xFF)
    (arithmetic-shift (bitwise-and n #xFF) 8)
    (arithmetic-shift (bitwise-and epoch #xFFFF) 16)))

(define (u32-unpack x)
  (let ((i (bitwise-and x #xFF))
        (n (bitwise-and (arithmetic-shift x -8) #xFF))
        (epoch (bitwise-and (arithmetic-shift x -16) #xFFFF)))
    (values i n epoch)))

(define (imm16-hi x) (bitwise-and (arithmetic-shift x -8) #xFF))
(define (imm16-lo x) (bitwise-and x #xFF))

;; VM state bits
(define *barrier-ok?* #f)

;; Emit x^slot into R0 as a tiny poly mask (bitset form)
(define (emit-slot->R0! slot vm)
  ;; simplest: store as u32 bitmask when slot < 32
  ;; for larger slots, call your existing f2poly set-bit routine
  (vm-set-reg! vm 0 (poly-one-hot slot)))

;; Opcode 0x63
(define (op-rr-init vm reg imm16)
  (let ((n (imm16-hi imm16))
        (i0 (imm16-lo imm16)))
    (when (or (= n 0) (> n 255)) (vm-trap! vm "RR_INIT invalid N"))
    (let ((i (modulo i0 n)))
      (vm-set-reg-u32! vm reg (u32-pack i n 0)))))

;; Opcode 0x64
(define (op-rr-next vm reg imm16)
  (let* ((k (imm16-hi imm16))
         (flags (imm16-lo imm16))
         (emit? (not (= 0 (bitwise-and flags #x01))))
         (barrier-link? (not (= 0 (bitwise-and flags #x02)))))
    (when barrier-link?
      (unless *barrier-ok?*
        (vm-trap! vm "RR_NEXT blocked (barrier not ok)")))
    (let-values (((i n epoch) (u32-unpack (vm-get-reg-u32 vm reg))))
      (when (= n 0) (vm-trap! vm "RR_NEXT on uninit ring"))
      (let* ((k* (if (= k 0) 1 k))
             (i+ (+ i k*)))
        (if (< i+ n)
            (begin
              (vm-set-reg-u32! vm reg (u32-pack i+ n epoch))
              (when emit? (emit-slot->R0! i+ vm)))
            (let ((i2 (modulo i+ n))
                  (epoch2 (+ epoch 1)))
              (vm-set-reg-u32! vm reg (u32-pack i2 n epoch2))
              (when emit? (emit-slot->R0! i2 vm))))))
    ;; consume barrier latch if you want strict phase-lock:
    (set! *barrier-ok?* #f)))
```

And in your `BARRIER_T` handler from Step 4, set:
```scheme
(set! *barrier-ok?* #t)
```
on pass.

---

## 5.7 Mechanical Assembler Rules (Scheme Assembler Spec)

Add two forms:

```scheme
(RR_INIT reg imm16)  => [0x63 reg imm16-hi imm16-lo]
(RR_NEXT reg imm16)  => [0x64 reg imm16-hi imm16-lo]
```

And helper macros for readability:

```scheme
;; (rr-init R3 7 0) => imm16 = 0x0700
(define (rr-init reg n i0) (list 'RR_INIT reg (bitwise-ior (arithmetic-shift n 8) i0)))

;; flags: EMIT=1, BARRIER_LINK=2
(define EMIT 1)
(define BARRIER_LINK 2)

;; (rr-next R3 1 (+ EMIT BARRIER_LINK)) => imm16 = 0x0103
(define (rr-next reg k flags) (list 'RR_NEXT reg (bitwise-ior (arithmetic-shift k 8) flags)))
```

---

## 5.8 What this gives you in the real hardware mesh

With **N=7** you can map the ring slots to your device/role layout immediately:

Example slots:
0: ESP32-S3 #1  
1: ESP32-S3 #2  
2: ESP32-S3 #3  
3: Pico 2 W  
4: Phone A (Termux)  
5: Phone B (Termux)  
6: Router/Phone hotspot role (proxy/gateway)

Now the VM can:
- **advance** only when time phase matches (Step 4 + barrier link)
- **emit** a one-hot polynomial representing “whose turn”
- then your next step can route messages / mux channels based on that slot

---

If you say **“6”**, I’ll do the next vertical slice:

- `MUX_OPEN / MUX_EVT / MUX_CLOSE` (multi-channel event stream)
- plus a concrete mapping to **SVG 2D** and **GLB/OBJ 3D** as deterministic payload carriers (binary-safe), so you can start the “visual + waveform multiplexing” path.

---

## You

Can you provide an AGENTS.md file i can you to build this in a new github repo bthornemail/tetragrammatron-os Brian Thorne bthornemail@gmail.com  https://cash.app/$brianthorne https://venmo.com/u/brianthorne https://www.linkedin.com/in/brian-thorne-5b8a96112/

---

## ChatGPT

Below is a **ready-to-drop `AGENTS.md`** for a new GitHub repository  
**`bthornemail/tetragrammatron-os`**.  
It is written to be *normative*, machine-readable, and aligned with the RFC/VM direction you’ve established.

You can copy this verbatim.

---
